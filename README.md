# CRM Consórcio

CRM para vendedor de consórcio (imóveis e veículos), feito para quem passa o dia **ligando e mandando WhatsApp**.
Mobile-first, em português, com modo claro/escuro. Por enquanto roda 100% no navegador (localStorage) com 30 leads de exemplo.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera /dist (estático, pode subir em qualquer hospedagem)
```

## O diferencial: indicador de último contato

Em **todas** as listagens (cards de leads, agenda, painel, busca) cada lead mostra, sem abrir:

| Cor | Padrão | Significado |
|---|---|---|
| 🟢 Verde | hoje | já trabalhado hoje |
| 🟡 Amarelo | 1–2 dias | recente |
| 🟠 Laranja | 3–6 dias | esfriando |
| 🔴 Vermelho | 7+ dias | atrasado |
| ⚪ Cinza | — | nunca contatado |

- Badge com texto humano ("Hoje", "Ontem", "Há 3 dias", "Há 2 semanas") + ícone do canal; recalculado em tempo real.
- Faixa lateral colorida no card/linha.
- Botões **📞 Liguei** e **WhatsApp** ao lado: 1 clique registra o contato com data/hora e atualiza a cor na hora. O WhatsApp também abre o `wa.me`.
- Depois do clique aparece um **mini-popup opcional** (não bloqueia a tela): resultado, observação curta e agendar próximo contato (Amanhã / 2 dias / 1 semana / data). Tem **Desfazer**.
- Contador no topo: *Contatados hoje X de Y leads ativos*, ligações e WhatsApps do dia e barra da meta.
- Filtros de 1 clique: Não contatados hoje · Atrasados (7+) · Nunca contatados · Retorno hoje.
- Os intervalos das cores são configuráveis em **Configurações**.

## Navegação

Menu único (`src/components/nav/AppNav.tsx`), com as mesmas 3 abas nos dois tamanhos; o ponto de corte é **770 px**.

| Aba | Ícone | Rota |
|---|---|---|
| Início | casa | `/` (inclui os relatórios) |
| Leads | pessoas | `/leads` (a ficha `/leads/:id` acende esta aba) |
| Agenda | calendário | `/agenda` |

- **Celular (< 770 px):** pílula de vidro flutuante embaixo, só nas telas de aba (`TAB_ROOTS` em `AppShell.tsx`).
- **Computador (≥ 770 px):** barra do topo em "ilha" com logo, abas com sublinhado deslizante, sino de avisos (atrasados, compromissos de hoje e assembleias da semana) e menu da conta (Configurações · Clientes · Notificações · Atalhos e ajuda). Vira vidro ao rolar a página.
- Dados das abas e do menu: `navItems.ts` e `accountMenu.ts`.

## Telas

| Rota | Tela |
|---|---|
| `/` | **Início** — meta do dia (editável no lápis), botão de Configurações, agendar, retornos de hoje/atrasados, leads atrasados, funil com conversão, vendas do mês, assembleias e indicações, e a seção **Relatórios** (contatos por dia/semana, motivos de perda, origem que mais converte, volume por mês) |
| `/leads` | **Leads = funil** — cards (2 colunas no celular, até 5 no desktop). Seletor de etapa: cada etapa é uma tela (`?etapa=<id>`), além de "Todas". No card: etapa, Liguei, WhatsApp e **Agendar reunião**. "Perdido" pede o motivo; "Ganho" vira cliente |
| `/leads/:id` | **Ficha** — Ligar / WhatsApp (com modelos) / Registrar contato, etapas em 1 clique, próximo passo, edição inline, linha do tempo e simulador |
| `/agenda` | **Agenda** — atrasados, hoje, 7 dias, concluídas; check rápido. "Nova tarefa" abre o card de agendamento: busca do lead, tipo, formato (presencial/vídeo/telefone), data, horário, local/link, aviso de conflito e confirmação pelo WhatsApp |
| `/clientes` | **Pós-venda** (pelo card Pós-venda do Início ou pelo menu da conta no computador) — administradora, grupo, cota, assembleia, lance; alertas de assembleia e de pedir indicação |
| `/configuracoes` | Aberta pelo botão na tela inicial (ou `G S`). Meta diária, cores, etapas, origens, modelos de WhatsApp (`{nome}`, `{primeiroNome}`, `{valor}`, `{objetivo}`, `{cidade}`, `{vendedor}`), tema, backup |

## Atalhos de teclado

| Tecla | Ação |
|---|---|
| `Ctrl K` ou `/` | Busca global (nome, telefone, cidade, etiqueta) |
| `N` | Novo lead (só nome + telefone obrigatórios; `Enter` salva) |
| `M` | Agendar reunião (na ficha, já com o lead) |
| `G` + `D/L/A/C/R/S` | Ir para Início / Leads / Agenda / Clientes / Relatórios (no Início) / Configurações |
| `[` `]` | Etapa anterior / próxima (em Leads) |
| `J` `K` (ou setas) | Navegar entre os cards de leads |
| `L` / `W` | Registrar ligação / abrir WhatsApp no lead selecionado (lista) ou aberto (ficha) |
| `X` | Selecionar lead para ação em massa |
| `A` | Nova anotação (ficha) |
| `?` | Ver todos os atalhos |

## Estrutura

```
src/
├─ types/            Lead, Atividade/Contato, Tarefa, Cliente, Simulacao, Configuracoes
├─ services/         ← ÚNICA camada que conhece a persistência
│  ├─ storage.ts     adaptador localStorage (assíncrono, como um banco remoto)
│  ├─ leadService.ts · contactService.ts · taskService.ts
│  ├─ clientService.ts · simulationService.ts · settingsService.ts
│  ├─ defaults.ts    etapas, origens e modelos padrão
│  └─ seed.ts        30 leads de exemplo com datas relativas
├─ store/            DataContext (estado + ações), AcoesContext (fluxos de 1 clique),
│                    Toast, Theme, Now (relógio que atualiza "Há X dias")
├─ lib/              datas relativas, urgência/cores, formatação BR, wa.me, estatísticas
├─ hooks/            useDerivados (contadores do dia), useHotkeys
├─ components/
│  ├─ ui/            Button, Modal/Sheet, Field, Inline*, Chip, Charts…
│  ├─ nav/           AppNav (pílula do celular), TopBar (ilha do computador), navItems, accountMenu
│  ├─ layout/        AppShell, CommandPalette, DailyCounter, PageHeader
│  ├─ leads/         LastContactBadge, QuickContactButtons, StageSwitcher, ContactOutcomeSheet,
│  │                 NewLeadModal, LostReasonModal, WonModal, Timeline, Simulator
│  ├─ agenda/        TaskItem, ScheduleModal (card de agendamento)
│  └─ dashboard/     MetaModal (edição rápida da meta), RelatoriosSecao
└─ pages/            uma por tela
supabase/schema.sql  esquema sugerido (tabelas, enums, índices, trigger, RLS)
```

**Regra de ouro:** telas nunca acessam `localStorage` — só chamam `useData()`, que chama os services.
Para trocar de banco, reescreva o corpo das funções em `src/services/*` mantendo as assinaturas.

## Simulação

Calculadora simples: **nenhuma taxa vem pré-preenchida** — você informa valor da carta, prazo, taxa de administração e fundo de reserva da administradora.
`parcela ≈ crédito × (1 + taxa adm% + fundo reserva%) ÷ prazo`. Sempre exibida como *"Estimativa — confirme no sistema da administradora"*. Não considera seguro, reajustes, lance ou regras do grupo.

## O que falta para conectar ao banco (Supabase)

1. **Criar o projeto** e rodar `supabase/schema.sql` no SQL Editor (testado em PostgreSQL 16).
2. `npm i @supabase/supabase-js` e criar `src/services/supabaseClient.ts` com `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (`.env.local`).
3. **Autenticação**: tela de login (e-mail/senha ou magic link) e um guard nas rotas. Todas as tabelas já têm RLS por `user_id = auth.uid()`.
4. **Reescrever os services** trocando `db.*` por `supabase.from('<tabela>')`, com um mapeador camelCase ↔ snake_case (ex.: `valorCarta` ↔ `valor_carta`).
   - `contactService.registrarContato` → só `insert` em `atividades`; o **trigger** `trg_ultimo_contato` atualiza `leads.ultimo_contato_*` (já cobre o "Desfazer").
   - `leadService.moverEtapa` → idealmente uma função RPC (`update` + `insert` da atividade numa transação).
   - `settingsService` → passa a ler/gravar `configuracoes`, `etapas`, `origens` e `modelos_mensagem`.
5. **IDs de etapa**: hoje são textos (`'novo'`, `'ganho'`…); no banco viram `uuid`. Duas regras usam o id fixo `'simulacao'` e `'m-indicacao'/'m-assembleia'` (atalhos do simulador e de clientes) — trocar por uma coluna `papel`/`slug` ao migrar.
6. **Primeiro acesso**: criar as linhas padrão (`CONFIG_PADRAO`) para o usuário novo (trigger em `auth.users` ou no app).
7. **Importação**: opcional, ler o JSON de "Exportar backup" para migrar os dados locais.
8. **Tempo real/offline** (opcional): `supabase.channel()` para sincronizar entre celular e computador; fila offline para registrar contatos sem sinal.
9. **Agregações**: os relatórios hoje calculam no navegador; com muitos dados, mover para *views* SQL (`contatos_por_dia`, `conversao_por_etapa`).

### Esquema resumido

| Tabela | Campos principais |
|---|---|
| `configuracoes` | user_id (PK), nome_vendedor, meta_diaria, amarelo_ate_dias, laranja_ate_dias, auto_avancar_lead_novo |
| `etapas` | id, user_id, nome, tipo (`aberta`/`ganho`/`perdido`), cor, ordem |
| `origens` | id, user_id, nome, ordem |
| `modelos_mensagem` | id, user_id, nome, texto |
| `leads` | id, user_id, nome, telefone, email, cidade, origem, indicado_por, objetivo, valor_carta, parcela_ideal, recurso_lance, valor_lance, prazo_uso_credito, urgencia, ja_teve_consorcio, decisor_junto, objecao_principal, temperatura, etiquetas[], observacoes, etapa_id → etapas, motivo_perda, motivo_perda_detalhe, **ultimo_contato_em**, **ultimo_contato_canal**, criado_em, atualizado_em |
| `atividades` | id, user_id, lead_id → leads, tipo (`ligacao`/`whatsapp`/`nota`/`etapa`/`simulacao`/`sistema`), resultado, observacao, etapa_de, etapa_para, simulacao_id, criado_em |
| `tarefas` | id, user_id, titulo, tipo, data_hora, dia_inteiro, formato (presencial/video/telefone), local, lead_id, cliente_id, concluida, concluida_em, criado_em |
| `clientes` | id, user_id, lead_id, nome, telefone, administradora, grupo, cota, tipo_bem, valor_carta, prazo_meses, data_venda, status, proxima_assembleia, pretende_lance, valor_lance, indicacao_pedida_em, observacoes |
| `simulacoes` | id, user_id, lead_id, valor_carta, prazo_meses, taxa_adm_pct, fundo_reserva_pct, parcela_estimada, criado_em |
