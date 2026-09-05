# EduBot — Frontend (Sprint 03)

Painel React (Vite) com as telas do MVP entregues até a Sprint 03: Login,
Dashboard (base, dados mock), Lista de Oportunidades, Nova Oportunidade/Editar
e Resultado do Disparo. Visual fiel aos mockups em
`../documentos/EduBot_Telas_MVP.pptx`.

## Como rodar

```bash
cp .env.example .env   # aponte para a API do backend, se diferente
npm install
npm run dev            # http://localhost:5173
```

Requer o backend (`../backend`) rodando em `http://localhost:4000` (ou o
endereço configurado em `VITE_API_URL`).

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Mock** — indicadores estáticos, conforme retro (slide 8): leitura real fica para a Sprint 05 |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |
| 05 — Resultado do Disparo | `/oportunidades/:id/disparo` (protegida) | Backend real — consome `GET /opportunities/:id/dispatch-logs` (RF-06), criado na Sprint 03 do backend |

Os itens "Métricas", "Painel Escolar" e "Integração" aparecem na sidebar
desabilitados, como lembrete visual de que pertencem às Sprints 05/06.

## Sprint 03 — Resultado do Disparo

Ao disparar uma oportunidade (pela lista ou pelo formulário), o painel agora
navega para `/oportunidades/:id/disparo`, que mostra enviados, entregues,
falhas e taxa de entrega, além do detalhe por contato (nome, telefone,
status e motivo da falha, quando houver) — RF-04 a RF-06.

Não há ainda um botão de reenvio para os contatos que falharam: o backend
desta Sprint não expõe esse endpoint, então a tela só exibe o que já
aconteceu (nada de funcionalidade "para inglês ver").

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
    ResultadoDisparo.jsx        # Tela 05 — Sprint 03
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css, resultadoDisparo.css
```
