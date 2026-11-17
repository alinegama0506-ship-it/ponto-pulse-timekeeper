import {createFileRoute,Link} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {KeyRound,ArrowLeft} from 'lucide-react';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {pageHead} from '@/lib/metadata';
import {mensagemRecuperacao,validarNovaSenha} from '@/lib/recuperacao';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('Recuperar senha','Recupere o acesso ao Ponto Inteligente pelo e-mail e defina uma nova senha.'),component:Recuperar});
function Recuperar(){
 const [etapa,setEtapa]=useState<'email'|'codigo'|'senha'|'concluido'>('email');
 const [email,setEmail]=useState('');const [codigo,setCodigo]=useState('');const [senha,setSenha]=useState('');const [confirmacao,setConfirmacao]=useState('');const [busy,setBusy]=useState(false);const [iniciando,setIniciando]=useState(true);const [erro,setErro]=useState('');const [aviso,setAviso]=useState('');
 useEffect(()=>{let ativo=true;const hash=new URLSearchParams(window.location.hash.slice(1));const recovery=hash.get('type')==='recovery';
  if(hash.get('error')){setErro('O link de recuperação é inválido ou expirou. Solicite um novo e-mail.');}
  const carregar=async()=>{try{if(recovery){const {data,error}=await supabase.auth.getUser();if(ativo){if(!error&&data.user)setEtapa('senha');else setErro('O link expirou. Solicite um novo e-mail.');}window.history.replaceState(null,'',window.location.pathname);}}finally{if(ativo)setIniciando(false);}};void carregar();return()=>{ativo=false;};
 },[]);
 const enviar=async()=>{setBusy(true);setErro('');setAviso('');try{const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;setEtapa('codigo');setAviso('Se este e-mail tiver uma conta, você receberá as instruções de recuperação. Confira também o spam.');}catch(e){setErro(mensagemRecuperacao(e));}finally{setBusy(false);}};
 const verificar=async()=>{setBusy(true);setErro('');try{const {data,error}=await supabase.auth.verifyOtp({email:email.trim(),token:codigo.trim(),type:'recovery'});if(error)throw error;if(!data.session)throw new Error('Sessão inválida');setCodigo('');setAviso('');setEtapa('senha');}catch(e){setErro(mensagemRecuperacao(e));}finally{setBusy(false);}};
 const salvar=async()=>{const msg=validarNovaSenha(senha,confirmacao);if(msg){setErro(msg);return;}setBusy(true);setErro('');try{const {error}=await supabase.auth.updateUser({password:senha});if(error)throw error;setSenha('');setConfirmacao('');await supabase.auth.signOut();setEtapa('concluido');}catch(e){setErro(mensagemRecuperacao(e));}finally{setBusy(false);}};
 return <main className="grid min-h-screen place-items-center px-4 py-8"><section className="w-full max-w-sm"><div className="mb-7 flex items-center gap-3 font-bold"><KeyRound className="size-7 text-primary"/>Ponto Inteligente</div><h1 className="text-2xl font-bold">{etapa==='senha'?'Nova senha':etapa==='concluido'?'Senha atualizada':'Recuperar senha'}</h1>{erro&&<p role="alert" className="mt-4 text-sm text-destructive">{erro}</p>}{aviso&&<p role="status" className="mt-4 text-sm text-muted-foreground">{aviso}</p>}
 {iniciando?<p role="status" className="mt-5">Aguarde…</p>:etapa==='concluido'?<p role="status" className="mt-4">Sua senha foi alterada. Entre com a nova senha.</p>:<form className="mt-5 grid gap-4" onSubmit={e=>{e.preventDefault();void(etapa==='email'?enviar():etapa==='codigo'?verificar():salvar());}}>
 {etapa==='email'&&<div className="grid gap-2"><Label htmlFor="recovery-email">E-mail da conta</Label><Input id="recovery-email" type="email" autoComplete="email" className="h-11" required value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></div>}
 {etapa==='codigo'&&<><div className="grid gap-2"><Label htmlFor="recovery-code">Código recebido por e-mail</Label><Input id="recovery-code" inputMode="numeric" autoComplete="one-time-code" className="h-11" required value={codigo} onChange={e=>setCodigo(e.target.value)} disabled={busy}/></div><p className="text-sm text-muted-foreground">Se o e-mail trouxer um link em vez de código, abra o link para definir sua nova senha.</p></>}
 {etapa==='senha'&&<><div className="grid gap-2"><Label htmlFor="recovery-password">Nova senha</Label><Input id="recovery-password" type="password" autoComplete="new-password" className="h-11" required value={senha} onChange={e=>setSenha(e.target.value)} disabled={busy}/></div><div className="grid gap-2"><Label htmlFor="recovery-confirm">Confirmar nova senha</Label><Input id="recovery-confirm" type="password" autoComplete="new-password" className="h-11" required value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} disabled={busy}/></div></>}
 <Button className="min-h-11" type="submit" disabled={busy}>{busy?'Aguarde…':etapa==='email'?'Enviar e-mail de recuperação':etapa==='codigo'?'Verificar código':'Salvar nova senha'}</Button>
 {etapa==='codigo'&&<div className="grid gap-2"><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={()=>void enviar()}>Reenviar e-mail</Button><Button type="button" variant="ghost" className="min-h-11" disabled={busy} onClick={()=>{setEtapa('email');setAviso('');setErro('');setCodigo('');}}>Usar outro e-mail</Button></div>}
 </form>}
 <Button asChild variant="ghost" className="mt-5 min-h-11 w-full"><Link to="/auth"><ArrowLeft className="size-4"/>Voltar para entrar</Link></Button></section></main>;
}