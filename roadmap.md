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
- [x] Menu com perfil Gestor/RH conferido em desktop e 380px na Fase 4.
- [ ] Completar política formal de privacidade: faltam controlador, contato, base legal, prazo de guarda e compartilhamentos da empresa.

# Fase 3 — Visão semanal
- [x] Cálculos puros e testes: semana seg–dom, meta provisória de 5 dias, saldo, intervalo e saída prevista.
- [x] Semana com indicadores, gráfico e tabela, detalhes por dia e ajuste preenchido.
- [x] Resumo semanal no Hoje, idiomas e leitura por período sem truncar o banco.
- [x] 29 testes passando; conferência autenticada em 380px e desktop com sete dias, semana anterior, ajuste preenchido e resumo do Hoje. Nenhum registro fictício inserido.
- [ ] Pontualidade, feriados/faltas confirmadas e vencimentos FIFO: dependem das escalas e dos lotes previstos na Fase 5; exibidos sem valores inventados.

# Fase 4 — Gestão por período
- [x] Áreas distintas Gestor/RH e Colaborador, folha por colaborador/período com download PDF conferido.
- [x] Filtros compartilhados de período/equipe/local e navegação dos indicadores para a operação conferida.
- [x] Dashboard Agora/Período, atualização a cada 30 s, comparação, tendências, extras e entradas por dia/horário.
- [x] Aprovação/rejeição atômica em lote via decidir_solicitacao, mediana e pendências acima de 48 horas.
- [x] Equipes, ativação/desativação protegida no banco, convites por link e bloqueio de cadastro sem convite; criação/cancelamento conferidos.
- [x] CSV seguro e XLSX por período/equipe com downloads conferidos; consultas paginadas.
- [x] 35 testes e conferência autenticada de Dashboard, Operação, Equipe e folhas em desktop/380px.
- [ ] Decisão real em lote e cadastro completo por convite: precisam de solicitações/conta de teste adequadas; não alterar solicitações reais para teste.
- [ ] Escalas, atrasos/ausências e vencimentos reais: dependem do motor da Fase 5.