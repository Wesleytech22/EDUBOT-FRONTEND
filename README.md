# EduBot — Frontend (Sprint 03)

Painel React (Vite) do Módulo Web de Gestão de Oportunidades. Nesta Sprint
entra a tela de Resultado do Disparo, ligada ao broadcast real do Módulo B
(RF-04 a RF-06) implementado no backend. Visual fiel aos mockups em
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
| 05 — Resultado do Disparo | `/oportunidades/:id/disparo` (protegida, só Administrador) | Backend real — log de envio por contato (RF-06), aberto automaticamente após "Disparar" ou pelo link "Ver disparo" na lista |

Os itens "Métricas", "Painel Escolar" e "Integração" aparecem na sidebar
desabilitados, como lembrete visual de que pertencem às Sprints 05/06.

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
    ResultadoDisparo.jsx        # RF-04 a RF-06 — log de envio por contato
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css, resultadoDisparo.css
```
