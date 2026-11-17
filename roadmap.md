# Fase 1 — Registro por geolocalização
- [x] Banco: locais, vínculos, modalidades, parâmetros, aviso e registro protegido com cálculo de distância/status/divergência.
- [x] Colaborador: coleta pontual, aviso, confirmação, justificativa, recuperação de permissão e selos.
- [x] Gestor: locais/vínculos, modalidade da equipe, regras/aviso, operação/CSV e alertas.
- [x] Testes unitários de lógica (14 testes passando) e compilação.
- [ ] Verificação de registro real e do perfil Gestor/RH: requer uma conta de teste apropriada; carregamento do colaborador conferido, sem inserir pontos fictícios na conta real.

# Fase 2 — Navegação e conta
- [x] Menu lateral compartilhado, divisão do ponto e menu da conta.
- [x] Configurações, exportação pessoal, senha e lembretes na tela.
- [x] Idiomas e acessibilidade persistidos, aplicados antes da tela autenticada.
- [x] Regras ao vivo, referência legal pesquisável, privacidade, ajuda e versão.
- [x] 20 testes passando; sessão do colaborador conferida em 380px e desktop, com download JSON, idioma após recarga, tema escuro e foco persistido. Preferências de teste restauradas.
- [x] Menu Gestor/RH conferido com sessão autorizada em desktop e 380px.
- [ ] Completar política formal de privacidade: faltam controlador, contato, base legal, prazo de guarda e compartilhamentos da empresa.

# Fase 3 — Visão semanal
- [x] Cálculos puros e testes: semana seg–dom, meta provisória de 5 dias, saldo, intervalo e saída prevista.
- [x] Semana com indicadores, gráfico e tabela, detalhes por dia e ajuste preenchido.
- [x] Resumo semanal no Hoje, idiomas e leitura por período sem truncar o banco.
- [x] 29 testes passando; conferência autenticada em 380px e desktop com sete dias, semana anterior, ajuste preenchido e resumo do Hoje. Nenhum registro fictício inserido.
- [ ] Pontualidade, feriados/faltas confirmadas e vencimentos FIFO: dependem das escalas e dos lotes previstos na Fase 5; exibidos sem valores inventados.

# Fase 4 — Gestão por período
- [x] Entrada/cadastro por perfil; privilégios validados pelo papel ativo e convite autorizado, nunca pela seleção na tela.
- [x] Folha mensal do colaborador selecionado, com download PDF; documento conferido com todos os 30 dias de novembro e dados reais.
- [x] Filtros compartilhados de período/equipe/local e navegação dos indicadores para a operação.
- [x] Dashboard Agora/Período, comparação, tendências, extras e entradas por dia/horário; atualização a cada 30 segundos.
- [x] Aprovação/rejeição em lote, mediana de decisão e pendências acima de 48 horas implementadas, mantendo aprovação exclusiva pelo procedimento existente.
- [x] Equipes, ativação/desativação e convites por perfil/link; cadastro sem convite bloqueado no banco.
- [x] CSV segura e XLSX paginados; downloads conferidos com quatro marcações existentes.
- [x] 36 testes passando, compilação sem erros; dashboard, operação, seleção do colaborador e PDF conferidos com sessão Gestor/RH em desktop e 380px.
- [ ] Cadastro por convite, alteração de acessos e decisões reais em lote: verificação destrutiva depende de contas/solicitações de teste autorizadas; criação de conta temporária não autorizada.
- [ ] Escalas, atrasos/ausências e vencimentos reais: dependem do motor da Fase 5.