# EduBot — Frontend (Sprint 06)

Painel React (Vite) com as telas do MVP entregues até a Sprint 06: Login,
Dashboard (base, dados mock), Lista de Oportunidades, Nova Oportunidade/Editar
e Painel Escolar. Visual fiel aos mockups em
`../documentos/EduBot_Telas_MVP.pptx`.

> Métricas e Integração · Google Sheets (Tela 06 e Tela 08) foram
> implementadas em paralelo na branch `feat/sprint05-metricas-integracao` —
> nesta branch elas seguem desabilitadas na sidebar.

## Como rodar

```bash
cp .env.example .env   # aponte para a API do backend, se diferente
npm install
npm run dev            # http://localhost:5173
```

Requer o backend (`../EDUCHAT_BACKEND`) rodando em `http://localhost:4000`
(ou o endereço configurado em `VITE_API_URL`), na branch
`feat/sprint06-sync-dashboard-escolar` ou mais recente — esta tela consome
`/api/students/*`.

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Mock** — indicadores estáticos, conforme retro (slide 8) |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |
| 07 — Painel Escolar | `/painel-escolar` (protegida) | Backend real — `GET /api/students`, `/summary`, `/sync-status` e `POST /sync` (RF-16 a RF-19) |

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
- Listagem com busca por nome e filtros por série e situação (RF-18),
  mostrando presenças e faltas ao lado da frequência (%) já calculada —
  a coordenação nunca digita a porcentagem diretamente.

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
    Dashboard.jsx
    Oportunidades.jsx
    NovaOportunidade.jsx
    PainelEscolar.jsx           # Tela 07 — Sprint 06
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css, painelEscolar.css
```
