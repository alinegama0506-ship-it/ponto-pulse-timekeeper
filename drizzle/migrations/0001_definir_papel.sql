CREATE OR REPLACE FUNCTION public.definir_gestor(_user_id uuid, _gestor boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'gestor') THEN RAISE EXCEPTION 'Apenas Gestor/RH pode alterar acessos'; END IF;
  IF _user_id = auth.uid() AND NOT _gestor THEN RAISE EXCEPTION 'Você não pode remover o próprio acesso de Gestor/RH'; END IF;
  IF _gestor THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'gestor') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'gestor';
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.definir_gestor(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.definir_gestor(uuid, boolean) TO authenticated;