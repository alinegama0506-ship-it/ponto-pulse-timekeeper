CREATE OR REPLACE FUNCTION public.calcular_geo(_uid uuid, _latitude double precision, _longitude double precision, _precisao_m double precision, _falha text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE modalidade_atual text; cfg public.regras; escolhido record; st text; d double precision; dentro boolean := false;
BEGIN
 SELECT modalidade INTO modalidade_atual FROM public.profiles WHERE id = _uid;
 IF modalidade_atual IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
 SELECT * INTO STRICT cfg FROM public.regras WHERE id=1;
 IF (_latitude IS NULL) <> (_longitude IS NULL) OR (_latitude IS NOT NULL AND (_precisao_m IS NULL OR NOT (_latitude BETWEEN -90 AND 90) OR NOT (_longitude BETWEEN -180 AND 180) OR NOT (_precisao_m >= 0 AND _precisao_m < 'Infinity'::double precision))) OR (_latitude IS NULL AND _precisao_m IS NOT NULL) THEN RAISE EXCEPTION 'Coordenadas ou precisão inválidas'; END IF;
 IF _falha NOT IN ('sem_permissao','indisponivel') THEN RAISE EXCEPTION 'Falha de localização inválida'; END IF;
 IF _latitude IS NOT NULL THEN
   SELECT l.*, public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) AS distancia INTO escolhido FROM public.locais_trabalho l WHERE l.ativo ORDER BY (public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) <= l.raio_m) DESC, public.distancia_haversine(_latitude,_longitude,l.latitude,l.longitude) ASC LIMIT 1;
   IF FOUND THEN d := escolhido.distancia; dentro := d <= escolhido.raio_m; END IF;
 END IF;
 st := CASE WHEN modalidade_atual IN ('externo','remoto') THEN 'dispensado' WHEN _latitude IS NULL THEN COALESCE(_falha,'indisponivel') WHEN dentro THEN 'dentro' WHEN _precisao_m > cfg.precisao_max_m THEN 'precisao_baixa' ELSE 'fora' END;
 RETURN jsonb_build_object('geo_status',st,'local_id',CASE WHEN d IS NOT NULL THEN escolhido.id ELSE NULL END,'local_nome',CASE WHEN d IS NOT NULL THEN escolhido.nome ELSE NULL END,'distancia_m',d,'geo_modo',cfg.geo_modo,'precisao_max_m',cfg.precisao_max_m,'modalidade',modalidade_atual);
END $$;
REVOKE ALL ON FUNCTION public.calcular_geo(uuid,double precision,double precision,double precision,text) FROM PUBLIC, anon, authenticated;
ALTER POLICY locais_leitura ON public.locais_trabalho TO authenticated USING (public.has_role(auth.uid(),'gestor'::public.app_role) OR (public.has_role(auth.uid(),'colaborador'::public.app_role) AND (ativo OR EXISTS (SELECT 1 FROM public.marcacoes m WHERE m.user_id=auth.uid() AND m.local_id=locais_trabalho.id))));