ALTER POLICY "regras read" ON public.regras TO authenticated USING (
  id = 1 AND (
    public.has_role(auth.uid(), 'colaborador'::public.app_role)
    OR public.has_role(auth.uid(), 'gestor'::public.app_role)
  )
);
ALTER POLICY locais_leitura ON public.locais_trabalho TO authenticated USING (
  public.has_role(auth.uid(), 'gestor'::public.app_role)
  OR (
    public.has_role(auth.uid(), 'colaborador'::public.app_role)
    AND (
      (
        ativo
        AND (
          NOT EXISTS (SELECT 1 FROM public.colaborador_locais c WHERE c.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.colaborador_locais c WHERE c.user_id = auth.uid() AND c.local_id = locais_trabalho.id)
        )
      )
      OR EXISTS (SELECT 1 FROM public.marcacoes m WHERE m.user_id = auth.uid() AND m.local_id = locais_trabalho.id)
    )
  )
);