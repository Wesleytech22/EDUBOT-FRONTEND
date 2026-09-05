# EduBot — Frontend (Sprint 05)

Painel React (Vite) com as telas do MVP entregues até a Sprint 05: Login,
Dashboard (base, dados mock), Lista de Oportunidades, Nova Oportunidade/Editar,
Métricas e Integração · Google Sheets. Visual fiel aos mockups em
`../documentos/EduBot_Telas_MVP.pptx`.

## Como rodar

```bash
cp .env.example .env   # aponte para a API do backend, se diferente
npm install
npm run dev            # http://localhost:5173
```

Requer o backend (`../EDUCHAT_BACKEND`) rodando em `http://localhost:4000`
(ou o endereço configurado em `VITE_API_URL`), na branch
`feat/sprint05-metricas-sheets` ou mais recente — as telas desta Sprint
consomem `/api/metrics/overview` e `/api/integrations/sheets/*`.

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Mock** — indicadores estáticos, conforme retro (slide 8) |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |
| 06 — Métricas de Engajamento | `/metricas` (protegida) | Backend real — `GET /api/metrics/overview` (RF-12, RF-13) |
| 08 — Integração · Google Sheets | `/integracao` (protegida) | Backend real — `GET/PUT /api/integrations/sheets/config`, `GET /api/integrations/sheets/preview` (RF-14, RF-15) |

O item "Painel Escolar" segue desabilitado na sidebar — chega na Sprint 06.

## Sprint 05 — Métricas e Integração

- **Métricas** (RF-12, RF-13): KPIs de envio (notificações, contatos
  alcançados, taxa de entrega, falhas) e de interação (taxa de automação,
  taxa de resposta, encaminhadas a atendente), além do ranking de
  oportunidades por engajamento e das dúvidas mais frequentes — tudo vem
  de dados reais gravados desde as Sprints 03/04; sem disparo/interação
  ainda, os números aparecem zerados (nada de mock aqui, ao contrário do
  Dashboard da Sprint 02).
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
    Metricas.jsx                # Tela 06 — Sprint 05
    Integracao.jsx               # Tela 08 — Sprint 05
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css,
    metricas.css, integracao.css
```
