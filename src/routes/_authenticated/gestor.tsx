import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useMe } from "@/lib/queries";
export const Route = createFileRoute("/_authenticated/gestor")({ component: GestorLayout });
function GestorLayout() { const me = useMe(); if (me.isLoading) return <p role="status">Carregando…</p>; if (!me.data?.isGestor) return <Navigate to="/colaborador" replace />; return <Outlet />; }
