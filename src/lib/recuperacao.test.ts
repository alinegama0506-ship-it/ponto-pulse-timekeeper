import {describe,it,expect} from 'vitest';
import {validarNovaSenha,mensagemRecuperacao} from './recuperacao';
describe('recuperação de senha',()=>{
 it('bloqueia confirmação diferente da nova senha',()=>{expect(validarNovaSenha('NovaSenha123','OutraSenha123')).not.toBeNull();expect(validarNovaSenha('NovaSenha123','NovaSenha123')).toBeNull();});
 it('não aceita senha vazia',()=>expect(validarNovaSenha('','')).not.toBeNull());
 it('trata código expirado sem revelar dados da conta',()=>{expect(mensagemRecuperacao({code:'otp_expired'})).toContain('expirado');});
});