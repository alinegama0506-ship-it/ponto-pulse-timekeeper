ALTER TABLE public.profiles ADD COLUMN modalidade text NOT NULL DEFAULT 'presencial' CHECK (modalidade IN ('presencial','hibrido','externo','remoto')), ADD COLUMN geo_aviso_visto_em timestamptz;
ALTER TABLE public.regras ADD COLUMN geo_modo text NOT NULL DEFAULT 'justificar' CHECK (geo_modo IN ('bloquear','justificar','apenas_registrar')), ADD COLUMN precisao_max_m integer NOT NULL DEFAULT 100 CHECK (precisao_max_m > 0), ADD COLUMN divergencia_max_s integer NOT NULL DEFAULT 300 CHECK (divergencia_max_s >= 0), ADD COLUMN geo_aviso text NOT NULL DEFAULT 'A localização é usada para conferir o local da marcação. Ela é coletada apenas quando você registra o ponto: não há rastreamento em segundo plano nem armazenamento de trajetos. Você e Gestor/RH podem consultar esses dados, mantidos pelo mesmo prazo dos registros de ponto definido pela organização.' CHECK (length(trim(geo_aviso)) BETWEEN 10 AND 2000);
CREATE TABLE public.locais_trabalho (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL CHECK (length(trim(nome)) BETWEEN 1 AND 150), endereco text NOT NULL DEFAULT '' CHECK (length(endereco) <= 500), latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90), longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180), raio_m integer NOT NULL DEFAULT 150 CHECK (raio_m BETWEEN 50 AND 500), ativo boolean NOT NULL DEFAULT true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locais_trabalho TO authenticated;
GRANT ALL ON public.locais_trabalho TO service_role;
ALTER TABLE public.locais_trabalho ENABLE ROW LEVEL SECURITY;
CREATE POLICY locais_leitura ON public.locais_trabalho FOR SELECT TO authenticated USING (true);
CREATE POLICY locais_gestor ON public.locais_trabalho FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor')) WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE TABLE public.colaborador_locais (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, local_id uuid NOT NULL REFERENCES public.locais_trabalho(id) ON DELETE CASCADE, PRIMARY KEY (user_id, local_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaborador_locais TO authenticated;
GRANT ALL ON public.colaborador_locais TO service_role;
ALTER TABLE public.colaborador_locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY vinculos_leitura ON public.colaborador_locais FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY vinculos_gestor ON public.colaborador_locais FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor')) WITH CHECK (public.has_role(auth.uid(), 'gestor'));
ALTER TABLE public.marcacoes ADD COLUMN latitude double precision CHECK (latitude BETWEEN -90 AND 90), ADD COLUMN longitude double precision CHECK (longitude BETWEEN -180 AND 180), ADD COLUMN precisao_m double precision CHECK (precisao_m >= 0 AND precisao_m < 'Infinity'::double precision), ADD COLUMN local_id uuid REFERENCES public.locais_trabalho(id) ON DELETE SET NULL, ADD COLUMN distancia_m double precision, ADD COLUMN geo_status text NOT NULL DEFAULT 'dispensado' CHECK (geo_status IN ('dentro','fora','precisao_baixa','sem_permissao','indisponivel','dispensado')), ADD COLUMN geo_justificativa text CHECK (length(geo_justificativa) <= 1000), ADD COLUMN divergencia_relogio_s double precision;
CREATE OR REPLACE FUNCTION public.proteger_modalidade_geo() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.modalidade IS DISTINCT FROM OLD.modalidade AND NOT public.has_role(auth.uid(), 'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode alterar a modalidade'; END IF;
 IF NEW.geo_aviso_visto_em IS DISTINCT FROM OLD.geo_aviso_visto_em AND current_user IN ('authenticated','anon') THEN RAISE EXCEPTION 'Registre a ciência pelo aviso de localização'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profiles_geo_protegido BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.proteger_modalidade_geo();
CREATE OR REPLACE FUNCTION public.registrar_ciencia_geo() RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE visto timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão expirada'; END IF;
 UPDATE public.profiles SET geo_aviso_visto_em = COALESCE(geo_aviso_visto_em, clock_timestamp()) WHERE id = auth.uid() RETURNING geo_aviso_visto_em INTO visto;
 IF NOT FOUND THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
 RETURN visto;
END $$;
REVOKE ALL ON FUNCTION public.registrar_ciencia_geo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_ciencia_geo() TO authenticated;
CREATE OR REPLACE FUNCTION public.distancia_haversine(_lat1 double precision, _lng1 double precision, _lat2 double precision, _lng2 double precision) RETURNS double precision LANGUAGE sql IMMUTABLE STRICT SET search_path = public AS $$
 SELECT 6371000 * 2 * asin(sqrt(least(1::double precision, greatest(0::double precision, power(sin(radians(_lat2-_lat1)/2),2) + cos(radians(_lat1))*cos(radians(_lat2))*power(sin(radians(_lng2-_lng1)/2),2)))));
$$;
CREATE OR REPLACE FUNCTION public.calcular_geo(_uid uuid, _latitude double precision, _longitude double precision, _precisao_m double precision, _falha text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE modalidade_atual text; cfg public.regras; loc record; escolhido record; st text; d double precision; dentro boolean := false;
BEGIN
 SELECT modalidade INTO modalidade_atual FROM public.profiles WHERE id = _uid;
 IF modalidade_atual IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
 SELECT * INTO STRICT cfg FROM public.regras WHERE id=1;
 IF (_latitude IS NULL) <> (_longitude IS NULL) OR (_latitude IS NOT NULL AND (_precisao_m IS NULL OR NOT (_latitude BETWEEN -90 AND 90) OR NOT (_longitude BETWEEN -180 AND 180) OR NOT (_precisao_m >= 0 AND _precisao_m < 'Infinity'::double precision))) OR (_latitude IS NULL AND _precisao_m IS NOT NULL) THEN RAISE EXCEPTION 'Coordenadas ou precisão inválidas'; END IF;
 IF _falha NOT IN ('sem_permissao','indisponivel') THEN RAISE EXCEPTION 'Falha de localização inválida'; END IF;
 IF _latitude IS NOT NULL THEN
   FOR loc IN SELECT l.*, public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) AS distancia FROM public.locais_trabalho l WHERE l.ativo AND (NOT EXISTS(SELECT 1 FROM public.colaborador_locais c WHERE c.user_id=_uid) OR EXISTS(SELECT 1 FROM public.colaborador_locais c WHERE c.user_id=_uid AND c.local_id=l.id)) ORDER BY (public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) <= l.raio_m) DESC, public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) ASC LIMIT 1 LOOP
     escolhido := loc; d := loc.distancia; dentro := d <= loc.raio_m;
   END LOOP;
 END IF;
 st := CASE WHEN modalidade_atual IN ('externo','remoto') THEN 'dispensado' WHEN _latitude IS NULL THEN COALESCE(_falha,'indisponivel') WHEN _precisao_m > cfg.precisao_max_m THEN 'precisao_baixa' WHEN dentro THEN 'dentro' ELSE 'fora' END;
 RETURN jsonb_build_object('geo_status',st,'local_id',CASE WHEN d IS NOT NULL THEN escolhido.id ELSE NULL END,'local_nome',CASE WHEN d IS NOT NULL THEN escolhido.nome ELSE NULL END,'distancia_m',d,'geo_modo',cfg.geo_modo,'precisao_max_m',cfg.precisao_max_m,'modalidade',modalidade_atual);
END $$;
REVOKE ALL ON FUNCTION public.calcular_geo(uuid,double precision,double precision,double precision,text) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.avaliar_localizacao(_latitude double precision DEFAULT NULL, _longitude double precision DEFAULT NULL, _precisao_m double precision DEFAULT NULL, _falha text DEFAULT 'indisponivel') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão expirada'; END IF;
 RETURN public.calcular_geo(auth.uid(),_latitude,_longitude,_precisao_m,_falha);
END $$;
REVOKE ALL ON FUNCTION public.avaliar_localizacao(double precision,double precision,double precision,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.avaliar_localizacao(double precision,double precision,double precision,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.auditar_divergencia_relogio() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.divergencia_relogio_s := extract(epoch FROM (NEW.created_at - NEW.momento_dispositivo));
 RETURN NEW;
END $$;
CREATE TRIGGER marcacoes_divergencia BEFORE INSERT OR UPDATE ON public.marcacoes FOR EACH ROW EXECUTE FUNCTION public.auditar_divergencia_relogio();
CREATE OR REPLACE FUNCTION public.registrar_marcacao(_tipo public.tipo_marcacao, _momento_dispositivo timestamptz, _data_local date, _hora_local time, _tz_offset_min integer, _timezone text DEFAULT NULL, _latitude double precision DEFAULT NULL, _longitude double precision DEFAULT NULL, _precisao_m double precision DEFAULT NULL, _justificativa text DEFAULT NULL, _falha text DEFAULT 'indisponivel') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); geo jsonb; mid uuid; esperado timestamp;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sessão expirada'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 IF _tipo IS NULL OR _momento_dispositivo IS NULL OR NOT isfinite(_momento_dispositivo) OR _data_local IS NULL OR NOT isfinite(_data_local) OR _hora_local IS NULL OR _hora_local >= '24:00'::time OR _tz_offset_min IS NULL OR _tz_offset_min NOT BETWEEN -840 AND 840 THEN RAISE EXCEPTION 'Data, horário ou fuso inválidos'; END IF;
 esperado := _data_local + _hora_local - make_interval(mins=>_tz_offset_min);
 IF abs(extract(epoch FROM ((_momento_dispositivo AT TIME ZONE 'UTC') - esperado))) >= 1 THEN RAISE EXCEPTION 'Data e hora locais incompatíveis com o momento do dispositivo'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=uid AND ativo AND geo_aviso_visto_em IS NOT NULL) THEN RAISE EXCEPTION 'Leia o aviso de localização antes de registrar'; END IF;
 IF length(COALESCE(_timezone,'')) > 150 OR length(COALESCE(_justificativa,'')) > 1000 THEN RAISE EXCEPTION 'Texto muito longo'; END IF;
 geo := public.calcular_geo(uid,_latitude,_longitude,_precisao_m,_falha);
 IF geo->>'geo_status' NOT IN ('dentro','dispensado') THEN
   IF geo->>'geo_modo' = 'bloquear' THEN RAISE EXCEPTION 'Marcação bloqueada: localização fora da área ou indisponível'; END IF;
   IF geo->>'geo_modo' = 'justificar' AND length(trim(COALESCE(_justificativa,''))) < 10 THEN RAISE EXCEPTION 'Informe uma justificativa com pelo menos 10 caracteres'; END IF;
 END IF;
 INSERT INTO public.marcacoes (user_id,tipo,momento_dispositivo,data_local,hora_local,tz_offset_min,timezone,origem,latitude,longitude,precisao_m,local_id,distancia_m,geo_status,geo_justificativa)
 VALUES(uid,_tipo,_momento_dispositivo,_data_local,_hora_local,_tz_offset_min,_timezone,'app',_latitude,_longitude,_precisao_m,(geo->>'local_id')::uuid,(geo->>'distancia_m')::double precision,geo->>'geo_status',NULLIF(trim(_justificativa),'')) RETURNING id INTO mid;
 RETURN mid;
END $$;
REVOKE ALL ON FUNCTION public.registrar_marcacao(public.tipo_marcacao,timestamptz,date,time,integer,text,double precision,double precision,double precision,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_marcacao(public.tipo_marcacao,timestamptz,date,time,integer,text,double precision,double precision,double precision,text,text) TO authenticated;
REVOKE INSERT ON public.marcacoes FROM authenticated;
DROP POLICY "marc insert own app" ON public.marcacoes;