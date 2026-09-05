# EduBot — Frontend (branch de integração local)

Painel React (Vite) com as telas do MVP das Sprints 02, 03 e 05 combinadas
nesta branch (`feat/teste-integracao-geral`) para teste local ponta a
ponta, antes do merge progressivo em `main`. Visual fiel aos mockups em
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
`feat/sprint05-metricas-sheets`/mais recente) — as telas de Métricas e
Integração consomem `/api/metrics/overview` e `/api/integrations/sheets/*`.

## Telas

| Tela | Rota | Fonte de dados |
|---|---|---|
| 01 — Login | `/login` | Backend real (`POST /api/auth/login`) |
| 02 — Dashboard | `/` (protegida) | **Mock** — indicadores estáticos, conforme retro (slide 8) |
| 03 — Oportunidades | `/oportunidades` (protegida) | Backend real, com busca e filtros |
| 04 — Nova/Editar Oportunidade | `/oportunidades/nova`, `/oportunidades/:id/editar` (protegida) | Backend real; pré-visualização da mensagem é client-side (binding em tempo real) |
| 05 — Resultado do Disparo | `/oportunidades/:id/disparo` (protegida) | Backend real — consome `GET /opportunities/:id/dispatch-logs` (RF-06), criado na Sprint 03 do backend |
| 06 — Métricas de Engajamento | `/metricas` (protegida) | Backend real — `GET /api/metrics/overview` (RF-12, RF-13) |
| 08 — Integração · Google Sheets | `/integracao` (protegida) | Backend real — `GET/PUT /api/integrations/sheets/config`, `GET /api/integrations/sheets/preview` (RF-14, RF-15) |

O item "Painel Escolar" segue desabilitado na sidebar até o merge da
Sprint 06 nesta branch.

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
  ainda, os números aparecem zerados (nada de mock aqui, ao contrário do
  Dashboard da Sprint 02).
- **Integração · Google Sheets** (RF-14, RF-15): formulário para o
  Administrador configurar o ID da planilha e o intervalo consumido, e um
  botão "Ler planilha agora" que chama a prova de conceito de leitura
  (`GET /api/integrations/sheets/preview`) e mostra as linhas cruas — ou o
  erro claro do backend quando a planilha ou a API key não estão
  configuradas. A Equipe da Escola vê a configuração, mas só o
  Administrador pode alterá-la.

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
    Metricas.jsx                # Tela 06 — Sprint 05
    Integracao.jsx              # Tela 08 — Sprint 05
  styles/
    tokens.css                  # paleta extraída do Figma do EduBot
    global.css, layout.css, login.css, dashboard.css,
    oportunidades.css, novaOportunidade.css, resultadoDisparo.css,
    metricas.css, integracao.css
```
