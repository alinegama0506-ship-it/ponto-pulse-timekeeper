import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Clock3, LayoutDashboard, LogOut, MapPin, Menu, Scale, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Clock } from "@/components/ponto/Clock";
import { iniciais, sair, useMe } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gestor")({
  component: GestorLayout,
});

const NAV = [
  { to: "/gestor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/gestor/operacao", label: "Operação", icon: ClipboardList },
  { to: "/gestor/equipe", label: "Equipe", icon: Users },
  { to: "/gestor/locais", label: "Locais de trabalho", icon: MapPin },
  { to: "/gestor/regras", label: "Regras e transparência", icon: Scale },
] as const;

function GestorLayout() {
  const me = useMe();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const atual = NAV.find((n) => pathname.startsWith(n.to))?.label ?? "";

  if (me.isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  if (!me.data?.isGestor)
    return <Navigate to="/colaborador" replace />;

  const sidebar = (
    <nav aria-label="Menu principal" className="flex h-full flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-2 font-extrabold text-sidebar-accent-foreground">
        <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Clock3 className="size-5" /></span>
        Ponto Inteligente
      </div>
      <div>
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest opacity-70">Gestão</div>
        <ul className="grid gap-1">
          {NAV.map(({ to, label, icon: I }) => {
            const active = pathname.startsWith(to);
            return (
              <li key={to}>
                <Link to={to} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]")}>
                  <I className="size-4" />{label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest opacity-70">Pessoal</div>
        <Link to="/colaborador" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><UserRound className="size-4" />Meu ponto</Link>
      </div>
      <button onClick={async () => { await sair(qc); nav({ to: "/auth", replace: true }); }}
        className="mt-auto flex min-h-11 items-center gap-3 rounded-lg border-t border-sidebar-border px-3 pt-4 text-sm hover:text-sidebar-accent-foreground">
        <LogOut className="size-4" />Sair
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Abrir menu" onClick={() => setOpen(true)}>{open ? <X /> : <Menu />}</Button>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">Ponto Inteligente <span aria-hidden>/</span> <b className="text-foreground">{atual}</b></nav>
          </div>
          <div className="flex items-center gap-3">
            <Clock />
            <span className="grid size-9 place-items-center rounded-full bg-success text-xs font-extrabold text-success-foreground" title={me.data.profile?.nome ?? ""}>{iniciais(me.data.profile?.nome)}</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
