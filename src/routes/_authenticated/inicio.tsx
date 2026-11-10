import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMe } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Ponto Inteligente" }] }),
  component: Inicio,
});

function Inicio() {
  const { data } = useMe();
  if (!data) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  return <Navigate to={data.isGestor ? "/gestor/dashboard" : "/colaborador"} replace />;
}
