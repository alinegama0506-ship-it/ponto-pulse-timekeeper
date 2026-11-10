CREATE TYPE public.app_role AS ENUM ('colaborador','gestor');
CREATE TYPE public.tipo_marcacao AS ENUM ('entrada','saida_intervalo','retorno_intervalo','saida');
CREATE TYPE public.motivo_ajuste AS ENUM ('esquecimento','falha_sistema','conexao','dispositivo','atividade_externa','outro');
CREATE TYPE public.status_solicitacao AS ENUM ('pendente','aprovado','rejeitado');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text,
  cargo text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "gestor updates profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gestor'));
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'gestor'));

-- Signup: profile + role (first user becomes gestor)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'gestor') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gestor');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.regras (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  jornada_diaria_min int NOT NULL DEFAULT 480,
  tolerancia_min int NOT NULL DEFAULT 10,
  limite_diario_min int NOT NULL DEFAULT 600,
  validade_banco_dias int NOT NULL DEFAULT 180,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.regras (id) VALUES (1);
GRANT SELECT, UPDATE ON public.regras TO authenticated;
GRANT ALL ON public.regras TO service_role;
ALTER TABLE public.regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras read" ON public.regras FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras update gestor" ON public.regras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'gestor'));

CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  data_solicitada date NOT NULL,
  hora_solicitada time NOT NULL,
  tz_offset_min int NOT NULL DEFAULT 0,
  tipo public.tipo_marcacao NOT NULL,
  motivo public.motivo_ajuste NOT NULL,
  observacao text,
  status public.status_solicitacao NOT NULL DEFAULT 'pendente',
  decidido_por uuid,
  decidido_em timestamptz,
  justificativa_rejeicao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX solicitacoes_pendente_unica ON public.solicitacoes (user_id, data_solicitada, tipo) WHERE status = 'pendente';
GRANT SELECT, INSERT ON public.solicitacoes TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solic read" ON public.solicitacoes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "solic insert own pending" ON public.solicitacoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pendente' AND decidido_por IS NULL AND decidido_em IS NULL);

CREATE TABLE public.marcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tipo public.tipo_marcacao NOT NULL,
  momento_dispositivo timestamptz NOT NULL,
  data_local date NOT NULL,
  hora_local time NOT NULL,
  tz_offset_min int NOT NULL,
  timezone text,
  origem text NOT NULL DEFAULT 'app' CHECK (origem IN ('app','ajuste')),
  solicitacao_id uuid REFERENCES public.solicitacoes(id),
  aprovado_por uuid,
  aprovado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, data_local, tipo)
);
GRANT SELECT, INSERT ON public.marcacoes TO authenticated;
GRANT ALL ON public.marcacoes TO service_role;
ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marc read" ON public.marcacoes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "marc insert own app" ON public.marcacoes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND origem = 'app' AND solicitacao_id IS NULL AND aprovado_por IS NULL);

-- Sequence validation for app punches
CREATE OR REPLACE FUNCTION public.validar_sequencia_marcacao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE prev public.tipo_marcacao;
BEGIN
  IF NEW.origem <> 'app' THEN RETURN NEW; END IF;
  prev := CASE NEW.tipo
    WHEN 'saida_intervalo' THEN 'entrada'::public.tipo_marcacao
    WHEN 'retorno_intervalo' THEN 'saida_intervalo'::public.tipo_marcacao
    WHEN 'saida' THEN 'retorno_intervalo'::public.tipo_marcacao
    ELSE NULL END;
  IF prev IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.marcacoes WHERE user_id = NEW.user_id AND data_local = NEW.data_local AND tipo = prev
  ) THEN
    RAISE EXCEPTION 'Sequência inválida: registre a marcação anterior primeiro';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER marcacoes_sequencia BEFORE INSERT ON public.marcacoes FOR EACH ROW EXECUTE FUNCTION public.validar_sequencia_marcacao();

-- Decide request (gestor only, never own)
CREATE OR REPLACE FUNCTION public.decidir_solicitacao(_id uuid, _aprovar boolean, _justificativa text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.solicitacoes; momento timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode decidir'; END IF;
  SELECT * INTO s FROM public.solicitacoes WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF s.user_id = auth.uid() THEN RAISE EXCEPTION 'Você não pode decidir a própria solicitação'; END IF;
  IF s.status <> 'pendente' THEN RAISE EXCEPTION 'Solicitação já decidida'; END IF;
  IF _aprovar THEN
    momento := (s.data_solicitada + s.hora_solicitada) - make_interval(mins => s.tz_offset_min);
    INSERT INTO public.marcacoes (user_id, tipo, momento_dispositivo, data_local, hora_local, tz_offset_min, origem, solicitacao_id, aprovado_por, aprovado_em)
    VALUES (s.user_id, s.tipo, momento, s.data_solicitada, s.hora_solicitada, s.tz_offset_min, 'ajuste', s.id, auth.uid(), now())
    ON CONFLICT (user_id, data_local, tipo) DO UPDATE SET
      momento_dispositivo = EXCLUDED.momento_dispositivo, hora_local = EXCLUDED.hora_local,
      origem = 'ajuste', solicitacao_id = EXCLUDED.solicitacao_id, aprovado_por = EXCLUDED.aprovado_por, aprovado_em = EXCLUDED.aprovado_em;
    UPDATE public.solicitacoes SET status = 'aprovado', decidido_por = auth.uid(), decidido_em = now() WHERE id = _id;
  ELSE
    UPDATE public.solicitacoes SET status = 'rejeitado', decidido_por = auth.uid(), decidido_em = now(), justificativa_rejeicao = NULLIF(trim(_justificativa),'') WHERE id = _id;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.decidir_solicitacao(uuid, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.decidir_solicitacao(uuid, boolean, text) TO authenticated;