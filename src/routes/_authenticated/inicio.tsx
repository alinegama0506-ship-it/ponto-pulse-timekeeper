import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMe } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Início — Ponto Inteligente" }, { property: "og:title", content: "Início — Ponto Inteligente" }, { property: "og:description", content: "Acesse seu ponto ou a gestão de jornada do Ponto Inteligente." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Acesse seu ponto ou a gestão de jornada do Ponto Inteligente." }] }),
  component: Inicio,
});

function Inicio() {
  const { data } = useMe();
  if (!data) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  return <Navigate to={data.isGestor ? "/gestor/dashboard" : "/colaborador"} replace />;
}
