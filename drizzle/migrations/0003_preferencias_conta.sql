ALTER TABLE public.profiles ADD COLUMN idioma text NOT NULL DEFAULT 'pt-BR', ADD COLUMN acessibilidade jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN notificacoes jsonb NOT NULL DEFAULT '{"ativo":false,"horario":"09:00"}'::jsonb;
CREATE OR REPLACE FUNCTION public.validar_preferencias_perfil() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.idioma NOT IN ('pt-BR','en','es') THEN RAISE EXCEPTION 'Idioma inválido'; END IF;
 IF jsonb_typeof(NEW.acessibilidade) <> 'object' OR jsonb_typeof(NEW.notificacoes) <> 'object' THEN RAISE EXCEPTION 'Preferências inválidas'; END IF;
 IF COALESCE(NEW.acessibilidade->>'tamanho','100') NOT IN ('100','115','130','150') OR COALESCE(NEW.acessibilidade->>'tema','sistema') NOT IN ('claro','escuro','sistema') THEN RAISE EXCEPTION 'Preferências de acessibilidade inválidas'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(NEW.acessibilidade) e WHERE e.key NOT IN ('tamanho','tema','contraste','reduzir','espacamento','foco','fonte','vlibras') OR (e.key IN ('contraste','reduzir','espacamento','foco','fonte','vlibras') AND jsonb_typeof(e.value) <> 'boolean')) THEN RAISE EXCEPTION 'Preferências de acessibilidade inválidas'; END IF;
 IF COALESCE(NEW.notificacoes->>'horario','09:00') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR (NEW.notificacoes ? 'ativo' AND jsonb_typeof(NEW.notificacoes->'ativo') <> 'boolean') THEN RAISE EXCEPTION 'Lembrete inválido'; END IF;
 IF length(trim(NEW.nome)) = 0 OR length(NEW.nome) > 200 THEN RAISE EXCEPTION 'Informe um nome de até 200 caracteres'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profiles_preferencias BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validar_preferencias_perfil();