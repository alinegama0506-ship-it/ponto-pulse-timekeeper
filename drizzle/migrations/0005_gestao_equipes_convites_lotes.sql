CREATE TABLE public.equipes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL CHECK(length(trim(nome)) BETWEEN 1 AND 100), UNIQUE(nome));
GRANT SELECT,INSERT,UPDATE ON public.equipes TO authenticated;
GRANT ALL ON public.equipes TO service_role;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD COLUMN equipe_id uuid REFERENCES public.equipes(id);
CREATE INDEX profiles_equipe_idx ON public.profiles(equipe_id);
CREATE POLICY equipes_leitura ON public.equipes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'gestor') OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.equipe_id=equipes.id));
CREATE POLICY equipes_gestao ON public.equipes FOR ALL TO authenticated USING(public.has_role(auth.uid(),'gestor')) WITH CHECK(public.has_role(auth.uid(),'gestor'));
CREATE TABLE public.convites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, token_hash text NOT NULL UNIQUE, equipe_id uuid REFERENCES public.equipes(id), criado_por uuid NOT NULL REFERENCES public.profiles(id), criado_em timestamptz NOT NULL DEFAULT now(), expira_em timestamptz NOT NULL DEFAULT now()+interval '7 days', usado_em timestamptz, cancelado_em timestamptz);
GRANT SELECT ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
CREATE POLICY convites_gestor ON public.convites FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'gestor'));
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.user_id=_user_id AND r.role=_role AND p.ativo) $$;
CREATE OR REPLACE FUNCTION public.proteger_gestao_perfil() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.ativo IS DISTINCT FROM OLD.ativo OR NEW.equipe_id IS DISTINCT FROM OLD.equipe_id THEN
 IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode alterar situação ou equipe'; END IF;
 IF NEW.id=auth.uid() AND NOT NEW.ativo THEN RAISE EXCEPTION 'Você não pode desativar a própria conta'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER proteger_gestao_perfil BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.proteger_gestao_perfil();
CREATE OR REPLACE FUNCTION public.criar_convite(_email text,_equipe_id uuid DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE token text; BEGIN
 IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode convidar'; END IF;
 IF length(_email)>254 OR trim(_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Informe um e-mail válido'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE lower(email)=lower(trim(_email))) THEN RAISE EXCEPTION 'Este e-mail já possui conta'; END IF;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 INSERT INTO public.convites(email,token_hash,equipe_id,criado_por) VALUES(lower(trim(_email)),encode(sha256(convert_to(token,'UTF8')),'hex'),_equipe_id,auth.uid()); RETURN token; END $$;
REVOKE ALL ON FUNCTION public.criar_convite(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.criar_convite(text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.cancelar_convite(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode cancelar'; END IF; UPDATE public.convites SET cancelado_em=now() WHERE id=_id AND usado_em IS NULL AND cancelado_em IS NULL; END $$;
REVOKE ALL ON FUNCTION public.cancelar_convite(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancelar_convite(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE convite public.convites; codigo text; BEGIN
 codigo:=NEW.raw_user_meta_data->>'convite';
 SELECT * INTO convite FROM public.convites WHERE token_hash=encode(sha256(convert_to(COALESCE(codigo,''),'UTF8')),'hex') AND email=lower(NEW.email) AND usado_em IS NULL AND cancelado_em IS NULL AND expira_em>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro somente por convite válido para este e-mail'; END IF;
 INSERT INTO public.profiles(id,nome,email,equipe_id) VALUES(NEW.id,COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nome'),''),split_part(NEW.email,'@',1)),NEW.email,convite.equipe_id);
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'colaborador');
 UPDATE public.convites SET usado_em=now() WHERE id=convite.id;
 RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.decidir_solicitacoes_lote(_ids uuid[],_aprovar boolean,_justificativa text DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE sid uuid; total integer:=0; BEGIN
 IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode decidir'; END IF;
 IF COALESCE(cardinality(_ids),0) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Selecione entre 1 e 100 solicitações'; END IF;
 IF length(COALESCE(_justificativa,''))>500 THEN RAISE EXCEPTION 'Justificativa: máximo de 500 caracteres'; END IF;
 FOR sid IN SELECT DISTINCT unnest(_ids) ORDER BY 1 LOOP PERFORM public.decidir_solicitacao(sid,_aprovar,_justificativa); total:=total+1; END LOOP; RETURN total; END $$;
REVOKE ALL ON FUNCTION public.decidir_solicitacoes_lote(uuid[],boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decidir_solicitacoes_lote(uuid[],boolean,text) TO authenticated;
CREATE INDEX marcacoes_periodo_idx ON public.marcacoes(data_local,id);
CREATE INDEX solicitacoes_periodo_idx ON public.solicitacoes(data_solicitada,id);
CREATE OR REPLACE FUNCTION public.validar_conta_ativa_solicitacao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=NEW.user_id AND ativo) THEN RAISE EXCEPTION 'Conta inativa'; END IF; RETURN NEW; END $$;
CREATE TRIGGER validar_conta_ativa_solicitacao BEFORE INSERT ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.validar_conta_ativa_solicitacao();