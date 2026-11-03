-- ═══════════════════════════════════════════════════════════════════════
-- CRM Consórcio — esquema sugerido para Supabase (PostgreSQL)
-- Espelha os tipos de src/types/index.ts (camelCase no front ↔ snake_case aqui).
-- Rode no SQL Editor do Supabase. Todas as tabelas têm RLS por usuário.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ───────────── Enums ─────────────
create type canal            as enum ('ligacao', 'whatsapp');
create type resultado_contato as enum ('atendeu','nao_atendeu','caixa_postal','respondeu','visualizou_sem_resposta','pediu_retorno');
create type objetivo         as enum ('imovel','veiculo','pesado','servicos','investimento');
create type temperatura      as enum ('frio','morno','quente');
create type sim_nao_talvez   as enum ('sim','nao','talvez');
create type urgencia         as enum ('baixa','media','alta');
create type motivo_perda     as enum ('sem_dinheiro','preferiu_financiamento','outra_administradora','sem_interesse_agora','nao_responde','outro');
create type tipo_etapa       as enum ('aberta','ganho','perdido');
create type tipo_atividade   as enum ('ligacao','whatsapp','nota','etapa','simulacao','sistema');
create type tipo_tarefa      as enum ('retorno','reuniao','tarefa','assembleia','indicacao');
create type formato_reuniao  as enum ('presencial','video','telefone');
create type status_cliente   as enum ('ativo','contemplado','cancelado');
create type tipo_bem         as enum ('imovel','veiculo','pesado','servicos','outro');

-- ───────────── Configurações (1 linha por usuário) ─────────────
create table configuracoes (
  user_id                 uuid primary key references auth.users on delete cascade default auth.uid(),
  nome_vendedor           text not null default '',
  meta_diaria             int  not null default 30 check (meta_diaria > 0),
  amarelo_ate_dias        int  not null default 2  check (amarelo_ate_dias >= 1),
  laranja_ate_dias        int  not null default 6,
  auto_avancar_lead_novo  boolean not null default true,
  check (laranja_ate_dias > amarelo_ate_dias)
);

create table etapas (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade default auth.uid(),
  nome     text not null,
  tipo     tipo_etapa not null default 'aberta',
  cor      text not null default 'slate',
  ordem    int  not null
);
-- exatamente 1 etapa de ganho e 1 de perda por usuário
create unique index etapas_ganho_unica   on etapas(user_id) where tipo = 'ganho';
create unique index etapas_perdido_unica on etapas(user_id) where tipo = 'perdido';

create table origens (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade default auth.uid(),
  nome     text not null,
  ordem    int  not null default 0,
  unique (user_id, nome)
);

create table modelos_mensagem (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade default auth.uid(),
  nome     text not null,
  texto    text not null
);

-- ───────────── Leads ─────────────
create table leads (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users on delete cascade default auth.uid(),
  nome                  text not null,
  telefone              text not null check (telefone ~ '^\d{10,13}$'),
  email                 text,
  cidade                text,
  origem                text,
  indicado_por          text,
  objetivo              objetivo,
  valor_carta           numeric(14,2),
  parcela_ideal         numeric(12,2),
  recurso_lance         sim_nao_talvez,
  valor_lance           numeric(14,2),
  prazo_uso_credito     text,
  urgencia              urgencia,
  ja_teve_consorcio     sim_nao_talvez,
  decisor_junto         text,
  objecao_principal     text,
  temperatura           temperatura not null default 'morno',
  etiquetas             text[] not null default '{}',
  observacoes           text,
  etapa_id              uuid not null references etapas on delete restrict,
  motivo_perda          motivo_perda,
  motivo_perda_detalhe  text,
  -- denormalizado (mantido pelo trigger abaixo) para listagens rápidas
  ultimo_contato_em     timestamptz,
  ultimo_contato_canal  canal,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);
create index leads_user_ultimo_contato on leads(user_id, ultimo_contato_em nulls first);
create index leads_user_etapa          on leads(user_id, etapa_id);
create index leads_user_telefone       on leads(user_id, telefone);
create index leads_busca on leads using gin (to_tsvector('portuguese', nome || ' ' || coalesce(cidade,'')));

-- ───────────── Atividades (linha do tempo) ─────────────
create table atividades (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade default auth.uid(),
  lead_id        uuid not null references leads on delete cascade,
  tipo           tipo_atividade not null,
  resultado      resultado_contato,
  observacao     text,
  etapa_de       uuid references etapas on delete set null,
  etapa_para     uuid references etapas on delete set null,
  simulacao_id   uuid,
  criado_em      timestamptz not null default now()
);
create index atividades_lead_data on atividades(lead_id, criado_em desc);
create index atividades_user_contatos on atividades(user_id, criado_em) where tipo in ('ligacao','whatsapp');

-- ───────────── Tarefas / retornos ─────────────
create table tarefas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade default auth.uid(),
  titulo        text not null,
  tipo          tipo_tarefa not null default 'retorno',
  data_hora     timestamptz not null,
  dia_inteiro   boolean not null default true,
  formato       formato_reuniao,
  local         text,
  lead_id       uuid references leads on delete cascade,
  cliente_id    uuid,
  concluida     boolean not null default false,
  concluida_em  timestamptz,
  criado_em     timestamptz not null default now()
);
create index tarefas_pendentes on tarefas(user_id, data_hora) where not concluida;

-- ───────────── Clientes (pós-venda) ─────────────
create table clientes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade default auth.uid(),
  lead_id              uuid references leads on delete set null,
  nome                 text not null,
  telefone             text not null,
  administradora       text,
  grupo                text,
  cota                 text,
  tipo_bem             tipo_bem,
  valor_carta          numeric(14,2),
  prazo_meses          int,
  data_venda           timestamptz not null default now(),
  status               status_cliente not null default 'ativo',
  proxima_assembleia   timestamptz,
  pretende_lance       sim_nao_talvez,
  valor_lance          numeric(14,2),
  indicacao_pedida_em  timestamptz,
  observacoes          text,
  criado_em            timestamptz not null default now()
);
create index clientes_assembleia on clientes(user_id, proxima_assembleia) where status = 'ativo';
alter table tarefas add constraint tarefas_cliente_fk foreign key (cliente_id) references clientes on delete cascade;

-- ───────────── Simulações (sempre estimativas) ─────────────
create table simulacoes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade default auth.uid(),
  lead_id            uuid not null references leads on delete cascade,
  valor_carta        numeric(14,2) not null,
  prazo_meses        int not null check (prazo_meses > 0),
  taxa_adm_pct       numeric(6,3) not null,
  fundo_reserva_pct  numeric(6,3) not null,
  parcela_estimada   numeric(12,2) not null,
  observacao         text,
  criado_em          timestamptz not null default now()
);
alter table atividades add constraint atividades_simulacao_fk foreign key (simulacao_id) references simulacoes on delete set null;

-- ───────────── Trigger: último contato do lead ─────────────
create or replace function atualizar_ultimo_contato() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_lead uuid := coalesce(new.lead_id, old.lead_id);
begin
  update leads set (ultimo_contato_em, ultimo_contato_canal) = (
    select a.criado_em, a.tipo::text::canal
    from atividades a
    where a.lead_id = v_lead and a.tipo in ('ligacao','whatsapp')
    order by a.criado_em desc
    limit 1
  )
  where id = v_lead;
  return null;
end $$;

create trigger trg_ultimo_contato
after insert or delete or update of criado_em, tipo on atividades
for each row execute function atualizar_ultimo_contato();

-- atualizado_em automático
create or replace function tocar_atualizado_em() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
create trigger trg_leads_atualizado before update on leads for each row execute function tocar_atualizado_em();

-- ───────────── RLS: cada usuário só vê os próprios dados ─────────────
do $$
declare t text;
begin
  foreach t in array array['configuracoes','etapas','origens','modelos_mensagem','leads','atividades','tarefas','clientes','simulacoes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "dono_%1$s" on %1$I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
