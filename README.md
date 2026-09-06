# EduBot — Frontend (branch de integração local)

Painel React (Vite) com as telas do MVP das Sprints 02, 03, 05 e 06
combinadas nesta branch (`feat/teste-integracao-geral`) para teste local
ponta a ponta, antes do merge progressivo em `main`. O Dashboard (Tela 02)
também já não usa dado mock — lê métricas e painel escolar reais, como o
resto da plataforma. Visual fiel aos mockups em
`../documentos/EduBot_Telas_MVP.pptx`.

## Como rodar

```bash
cp .env.example .env   # aponte para a API do backend, se diferente
npm install
npm run dev            # http://localhost:5173
```

Requer o backend (`../EDUCHAT_BACKEND`) rodando em `http://localhost:4000`
(ou o endereço configurado em `VITE_API_URL`), na branch de integração
correspondente (`feat/teste-integracao-geral` do backend, ou
`feat/sprint06-sync-dashboard-escolar`/mais recente) — as telas desta
branch consomem `/api/metrics/overview`, `/api/metrics/dispatch-logs`,
`/api/integrations/sheets/*` e `/api/students/*`.

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Real** — `GET /api/metrics/overview`, `/api/students/summary`, `/api/students/sync-status` e `/api/metrics/dispatch-logs` (RF-12, RF-13, RF-17, RF-19) |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |
| 05 — Resultado do Disparo | `/oportunidades/:id/disparo` (protegida) | Backend real — consome `GET /opportunities/:id/dispatch-logs` (RF-06), criado na Sprint 03 do backend |
| 06 — Métricas de Engajamento | `/metricas` (protegida) | Backend real — `GET /api/metrics/overview` (RF-12, RF-13) |
| 07 — Painel Escolar | `/painel-escolar` (protegida) | Backend real — `GET /api/students`, `/summary`, `/sync-status` e `POST /sync` (RF-16 a RF-19) |
| 08 — Integração · Google Sheets | `/integracao` (protegida) | Backend real — `GET/PUT /api/integrations/sheets/config`, `GET /api/integrations/sheets/preview` (RF-14, RF-15) |

Todos os itens da sidebar estão habilitados nesta branch — é a primeira
vez que as telas 05 a 08 aparecem juntas para teste.

## Sprint 03 — Resultado do Disparo

Ao disparar uma oportunidade (pela lista ou pelo formulário), o painel
navega para `/oportunidades/:id/disparo`, que mostra enviados, entregues,
falhas e taxa de entrega, além do detalhe por contato (nome, telefone,
status e motivo da falha, quando houver) — RF-04 a RF-06.

Não há botão de reenvio para os contatos que falharam: o backend desta
Sprint não expõe esse endpoint, então a tela só exibe o que já aconteceu
(nada de funcionalidade "para inglês ver").

## Sprint 05 — Métricas e Integração

- **Métricas** (RF-12, RF-13): KPIs de envio (notificações, contatos
  alcançados, taxa de entrega, falhas) e de interação (taxa de automação,
  taxa de resposta, encaminhadas a atendente), além do ranking de
  oportunidades por engajamento e das dúvidas mais frequentes — tudo vem
  de dados reais gravados desde as Sprints 03/04; sem disparo/interação
  ainda, os números aparecem zerados (nada de mock aqui — o Dashboard
  também já não usa dado fictício, ver seção "Dashboard sem mock" abaixo).
- **Integração · Google Sheets** (RF-14, RF-15): dois modos, alternados
  por um seletor no topo do formulário —
  - **Colar link**: cola a URL completa da planilha (o backend extrai o
    ID sozinho) e o intervalo consumido;
  - **Anexar arquivo**: envia um `.csv` exportado da planilha (Arquivo →
    Fazer download → CSV, no Google Sheets ou Excel), para quem prefere
    não compartilhar o link.

  Nos dois casos, o botão "Ler planilha agora" chama a prova de conceito
  de leitura (`GET /api/integrations/sheets/preview`) e mostra as linhas
  cruas — ou o erro claro do backend quando nada está configurado. A
  Equipe da Escola vê a configuração, mas só o Administrador pode
  alterá-la (colar um link novo ou enviar um arquivo novo).

## Sprint 06 — Painel Escolar

- Banner de somente leitura logo no topo (a plataforma consome a planilha
  da escola, mas nunca escreve nela — seção 5.7 do Documento de Escopo).
- Indicadores agregados (RF-19): total de alunos, frequência média e
  "desempenho geral" (percentual de alunos em situação Regular).
- Status da sincronização (RF-17): data/hora da última sincronização
  bem-sucedida, e o motivo quando a última tentativa falhou.
- Botão "Sincronizar agora" (RF-16), visível só para o Administrador —
  a Equipe da Escola consulta em modo somente leitura, sem forçar a
  sincronização.
- Listagem com busca por nome e filtros por série e situação (RF-18).

## Dashboard sem mock

Nenhum card mostra número fixo. Enquanto não houver disparos, interações
ou sincronização registrados, o dashboard reflete isso honestamente:

- KPIs de envio (notificações, contatos alcançados, taxa de entrega) e de
  interação (FAQ) vêm de `GET /api/metrics/overview` — aparecem `0` até
  que algo aconteça de verdade.
- "Oportunidades com maior engajamento" some e vira uma mensagem
  ("ainda não há...") quando não há dados suficientes para ranquear, em
  vez de mostrar barras fictícias.
- "Painel escolar" mostra frequência média e desempenho real
  (`GET /api/students/summary`) e o status real da última sincronização
  (`GET /api/students/sync-status`) — inclusive quando ainda não houve
  nenhuma sincronização bem-sucedida.
- "Últimos disparos" agrupa `GET /api/metrics/dispatch-logs` (o log por
  contato) em uma linha por oportunidade, mostrando as 5 mais recentes —
  ou uma mensagem vazia, se nada foi disparado ainda.

## Estrutura

```
src/
  App.jsx                       # rotas
  main.jsx                      # bootstrap
  context/AuthContext.jsx       # sessão (token + usuário)
  services/api.js               # axios com interceptor de token/401
  components/
    PrivateRoute.jsx
    Layout.jsx / Sidebar.jsx / Topbar.jsx
  pages/
    Login.jsx
    Dashboard.jsx                # agora com dados reais, sem mock
    Oportunidades.jsx
    NovaOportunidade.jsx
    ResultadoDisparo.jsx        # Tela 05 — Sprint 03
    Metricas.jsx                # Tela 06 — Sprint 05
    PainelEscolar.jsx           # Tela 07 — Sprint 06
    Integracao.jsx              # Tela 08 — Sprint 05
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css, resultadoDisparo.css,
    metricas.css, painelEscolar.css, integracao.css
```
