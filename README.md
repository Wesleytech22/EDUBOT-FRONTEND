# EduBot — Frontend (branch: dados reais no Dashboard)

Painel React (Vite). Esta branch parte da Sprint 02 e substitui os dados
fictícios do Dashboard por leitura real da API, usando endpoints que já
existem no backend das Sprints 03/05/06 (métricas, painel escolar).
Visual fiel aos mockups em `../documentos/EduBot_Telas_MVP.pptx`.

## Como rodar

```bash
cp .env.example .env   # aponte para a API do backend, se diferente
npm install
npm run dev            # http://localhost:5173
```

Requer o backend (`../EDUCHAT_BACKEND`) rodando em `http://localhost:4000`
(ou o endereço configurado em `VITE_API_URL`), com os endpoints
`/api/metrics/overview`, `/api/metrics/dispatch-logs`,
`/api/students/summary` e `/api/students/sync-status` disponíveis —
ou seja, pelo menos até a Sprint 06 do backend (ou a branch
`feat/teste-integracao-geral`).

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Real** — `GET /api/metrics/overview`, `/api/students/summary`, `/api/students/sync-status` e `/api/metrics/dispatch-logs` (RF-12, RF-13, RF-17, RF-19) |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |

Os itens "Métricas", "Painel Escolar" e "Integração" aparecem na sidebar
desabilitados, como lembrete visual de que pertencem às Sprints 05/06.

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
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css
```
