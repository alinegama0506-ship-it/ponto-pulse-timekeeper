import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ponto Inteligente" },
      { name: "description", content: "Acesse sua conta do Ponto Inteligente." },
      { property: "og:title", content: "Entrar — Ponto Inteligente" },
      { property: "og:description", content: "Acesse sua conta do Ponto Inteligente." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
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
          options: { emailRedirectTo: window.location.origin + "/inicio", data: { nome } },
        });
        if (error) throw error;
        if (data.session) nav({ to: "/inicio", replace: true });
        else toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar");
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
            <div className="grid gap-1.5"><Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" required className="h-11" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          )}
          <div className="grid gap-1.5"><Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" required className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" minLength={6} required className="h-11" autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
          <Button type="submit" className="h-11" disabled={loading}>{loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <button type="button" className="mt-4 min-h-11 w-full text-sm font-medium text-primary hover:underline"
          onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}>
          {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
