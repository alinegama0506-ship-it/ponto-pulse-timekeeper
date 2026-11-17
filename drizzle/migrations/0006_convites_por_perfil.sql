ALTER TABLE public.convites ADD COLUMN perfil public.app_role NOT NULL DEFAULT 'colaborador';
CREATE OR REPLACE FUNCTION public.criar_convite_perfil(_email text,_perfil public.app_role,_equipe_id uuid DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE token text; BEGIN
 IF NOT public.has_role(auth.uid(),'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode convidar'; END IF;
 IF _perfil IS NULL THEN RAISE EXCEPTION 'Selecione um perfil'; END IF;
 token:=public.criar_convite(_email,_equipe_id);
 UPDATE public.convites SET perfil=_perfil WHERE token_hash=encode(sha256(convert_to(token,'UTF8')),'hex');
 RETURN token; END $$;
REVOKE ALL ON FUNCTION public.criar_convite_perfil(text,public.app_role,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.criar_convite_perfil(text,public.app_role,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE convite public.convites; codigo text; BEGIN
 codigo:=NEW.raw_user_meta_data->>'convite';
 SELECT * INTO convite FROM public.convites WHERE token_hash=encode(sha256(convert_to(COALESCE(codigo,''),'UTF8')),'hex') AND email=lower(NEW.email) AND usado_em IS NULL AND cancelado_em IS NULL AND expira_em>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro somente por convite válido para este e-mail'; END IF;
 IF COALESCE(NEW.raw_user_meta_data->>'perfil','colaborador')<>convite.perfil::text THEN RAISE EXCEPTION 'O perfil não corresponde ao convite'; END IF;
 INSERT INTO public.profiles(id,nome,email,equipe_id) VALUES(NEW.id,COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nome'),''),split_part(NEW.email,'@',1)),NEW.email,convite.equipe_id);
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'colaborador');
 IF convite.perfil='gestor' THEN INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'gestor'); END IF;
 UPDATE public.convites SET usado_em=now() WHERE id=convite.id;
 RETURN NEW; END $$;