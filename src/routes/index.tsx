import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ponto Inteligente — Controle de jornada e banco de horas" },
      { name: "description", content: "Registro de ponto, ajustes com aprovação e banco de horas transparente para colaboradores e RH." },
      { property: "og:title", content: "Ponto Inteligente" },
      { property: "og:description", content: "Registro de ponto, ajustes com aprovação e banco de horas transparente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Clock3 className="size-5" /></span>
          Ponto Inteligente
        </div>
        <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-12 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Gestão de jornada</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Ponto registrado no horário certo. Saldo claro para todos.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">Colaboradores marcam o ponto pelo celular, pedem ajustes com motivo e acompanham o banco de horas. Gestor/RH aprova com trilha de auditoria.</p>
          <Button asChild size="lg" className="mt-8 h-12 px-6"><Link to="/auth">Acessar o sistema</Link></Button>
        </div>
        <div className="grid gap-4">
          {[
            { i: Timer, t: "Relógio do dispositivo", d: "A marcação usa a hora local no instante do clique, com registro do servidor para auditoria." },
            { i: ShieldCheck, t: "Ajustes com aprovação", d: "Data, horário, tipo e motivo obrigatórios. O saldo só muda após a decisão do RH." },
            { i: Clock3, t: "Banco de horas transparente", d: "Tolerância, limite diário e validade visíveis para toda a equipe." },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
              <I className="size-5 shrink-0 text-primary" />
              <div><h2 className="font-bold">{t}</h2><p className="text-sm text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
