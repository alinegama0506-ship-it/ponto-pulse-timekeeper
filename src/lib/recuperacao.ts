export function validarNovaSenha(senha:string,confirmacao:string){
 if(!senha)return 'Informe uma nova senha.';
 if(senha!==confirmacao)return 'As senhas não coincidem.';
 return null;
}
export function mensagemRecuperacao(error:unknown){
 const codigo=error&&typeof error==='object'&&'code' in error?String(error.code):'';
 if(codigo==='otp_expired')return 'Código inválido ou expirado. Solicite um novo e-mail.';
 if(codigo==='weak_password')return 'Use uma senha mais forte, com letras, números e símbolos.';
 if(codigo==='same_password')return 'A nova senha deve ser diferente da anterior.';
 if(codigo==='over_email_send_rate_limit'||codigo==='over_request_rate_limit')return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
 return 'Não foi possível continuar. Tente novamente.';
}