import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from 'zod';

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({convite:z.string().optional().catch('')}),
  head: () => ({
    meta: [
      { title: "Entrar — Ponto Inteligente" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { name: "description", content: "Acesse sua conta do Ponto Inteligente." },
      { property: "og:title", content: "Entrar — Ponto Inteligente" },
      { property: "og:description", content: "Acesse sua conta do Ponto Inteligente." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const {convite}=Route.useSearch();
  const [modo, setModo] = useState<"entrar" | "cadastrar">(convite ? "cadastrar" : "entrar");
  const [codigo,setCodigo]=useState(convite??'');
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        nav({ to: "/inicio", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password: senha,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { nome, convite: codigo } },
        });
        if (error) throw error;
        if (data.session) nav({ to: "/inicio", replace: true });
        else toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = err instanceof Error ? err.message : "";
      const traduz: Record<string, string> = {
        weak_password: "Senha fraca ou já vazada na internet. Use uma senha mais forte (letras, números e símbolos).",
        user_already_exists: "Este e-mail já está cadastrado. Use \"Entrar\".",
        invalid_credentials: "E-mail ou senha incorretos.",
        email_not_confirmed: "Confirme seu e-mail pelo link enviado antes de entrar.",
        over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
        unexpected_failure: "Não foi possível criar a conta. Confira se o convite está válido e se o e-mail é o mesmo informado pelo Gestor/RH.",
      };
      toast.error(traduz[code] ?? (msg.includes("not allowed") ? "Este endereço de e-mail não é aceito. Use um e-mail real." : msg || "Não foi possível continuar"), { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2.5 font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Clock3 className="size-5" /></span>
          Ponto Inteligente
        </div>
        <h1 className="text-xl font-bold">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          {modo === "cadastrar" && (
            <><div className="grid gap-1.5"><Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required maxLength={200} className="h-11" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label htmlFor="codigo">Código do convite</Label><Input id="codigo" required className="h-11" value={codigo} onChange={e=>setCodigo(e.target.value)} autoComplete="off"/></div></>
          )}
          <div className="grid gap-1.5"><Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" required className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" minLength={6} required className="h-11" autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
          <Button type="submit" className="h-11" disabled={loading}>{loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <Button variant="ghost" type="button" className="mt-4 min-h-11 w-full text-sm font-medium text-primary"
          onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}>
          {modo === "entrar" ? "Tenho um convite" : "Já tem conta? Entrar"}
        </Button>
      </div>
    </main>
  );
}
