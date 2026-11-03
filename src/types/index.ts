/**
 * Tipos do domínio. Cada interface "de topo" corresponde a uma tabela futura
 * no banco (ver README → Esquema sugerido). Datas são sempre strings ISO 8601.
 * IDs são strings (uuid no banco).
 */

export type ID = string;
export type ISODate = string;

// ───────────────────────── Enums / uniões ─────────────────────────

export type Canal = 'ligacao' | 'whatsapp';

export type ResultadoContato =
  | 'atendeu'
  | 'nao_atendeu'
  | 'caixa_postal'
  | 'respondeu'
  | 'visualizou_sem_resposta'
  | 'pediu_retorno';

export type Objetivo = 'imovel' | 'veiculo' | 'pesado' | 'servicos' | 'investimento';
export type Temperatura = 'frio' | 'morno' | 'quente';
export type SimNaoTalvez = 'sim' | 'nao' | 'talvez';
export type Urgencia = 'baixa' | 'media' | 'alta';

export type MotivoPerda =
  | 'sem_dinheiro'
  | 'preferiu_financiamento'
  | 'outra_administradora'
  | 'sem_interesse_agora'
  | 'nao_responde'
  | 'outro';

export type TipoEtapa = 'aberta' | 'ganho' | 'perdido';

/** Nível de urgência do indicador de último contato. */
export type NivelContato = 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza';

// ───────────────────────── Entidades ─────────────────────────

/** Tabela `leads` */
export interface Lead {
  id: ID;
  nome: string;
  telefone: string; // somente dígitos, com DDD (ex: 62999998888)
  email?: string;
  cidade?: string;
  origem?: string; // texto livre vindo de Configuracoes.origens
  indicadoPor?: string;
  objetivo?: Objetivo;
  valorCarta?: number;
  parcelaIdeal?: number;
  recursoLance?: SimNaoTalvez;
  valorLance?: number;
  prazoUsoCredito?: string; // ex: "Em até 6 meses"
  urgencia?: Urgencia;
  jaTeveConsorcio?: SimNaoTalvez;
  decisorJunto?: string; // cônjuge, sócio...
  objecaoPrincipal?: string;
  temperatura: Temperatura;
  etiquetas: string[];
  observacoes?: string;

  etapaId: ID;
  motivoPerda?: MotivoPerda;
  motivoPerdaDetalhe?: string;

  /** Denormalizado para listagens rápidas (no banco: atualizado por trigger). */
  ultimoContatoEm?: ISODate;
  ultimoContatoCanal?: Canal;

  criadoEm: ISODate;
  atualizadoEm: ISODate;
}

export type TipoAtividade = 'ligacao' | 'whatsapp' | 'nota' | 'etapa' | 'simulacao' | 'sistema';

/** Tabela `atividades` — linha do tempo do lead (contatos, notas, etapas...). */
export interface Atividade {
  id: ID;
  leadId: ID;
  tipo: TipoAtividade;
  criadoEm: ISODate;
  resultado?: ResultadoContato; // só para ligacao/whatsapp
  observacao?: string;
  etapaDe?: ID; // só para tipo "etapa"
  etapaPara?: ID;
  simulacaoId?: ID; // só para tipo "simulacao"
}

/** Um contato é uma atividade de ligação ou WhatsApp. */
export type Contato = Atividade & { tipo: Canal };

export type TipoTarefa = 'retorno' | 'reuniao' | 'tarefa' | 'assembleia' | 'indicacao';

/** Como a reunião acontece. */
export type FormatoReuniao = 'presencial' | 'video' | 'telefone';

/** Tabela `tarefas` — retornos e compromissos. */
export interface Tarefa {
  id: ID;
  titulo: string;
  tipo: TipoTarefa;
  dataHora: ISODate;
  /** true quando o horário não importa (vence no dia) */
  diaInteiro: boolean;
  /** Só para reuniões */
  formato?: FormatoReuniao;
  /** Endereço (presencial) ou link (vídeo) */
  local?: string;
  leadId?: ID;
  clienteId?: ID;
  concluida: boolean;
  concluidaEm?: ISODate;
  criadoEm: ISODate;
}

export type StatusCliente = 'ativo' | 'contemplado' | 'cancelado';
export type TipoBem = 'imovel' | 'veiculo' | 'pesado' | 'servicos' | 'outro';

/** Tabela `clientes` — pós-venda (uma cota vendida). */
export interface Cliente {
  id: ID;
  leadId?: ID;
  nome: string;
  telefone: string;
  administradora?: string;
  grupo?: string;
  cota?: string;
  tipoBem?: TipoBem;
  valorCarta?: number;
  prazoMeses?: number;
  dataVenda: ISODate;
  status: StatusCliente;
  proximaAssembleia?: ISODate;
  pretendeLance?: SimNaoTalvez;
  valorLance?: number;
  indicacaoPedidaEm?: ISODate;
  observacoes?: string;
  criadoEm: ISODate;
}

/** Tabela `simulacoes` — sempre uma ESTIMATIVA com dados informados pelo vendedor. */
export interface Simulacao {
  id: ID;
  leadId: ID;
  valorCarta: number;
  prazoMeses: number;
  taxaAdmPct: number; // % total sobre o crédito
  fundoReservaPct: number; // % total sobre o crédito
  parcelaEstimada: number;
  observacao?: string;
  criadoEm: ISODate;
}

// ───────────────────────── Configurações ─────────────────────────

export interface Etapa {
  id: ID;
  nome: string;
  tipo: TipoEtapa;
  cor: string; // chave da paleta (ver lib/etapas.ts)
}

export interface ModeloMensagem {
  id: ID;
  nome: string;
  texto: string; // aceita {nome}, {primeiroNome}, {valor}, {objetivo}, {vendedor}, {cidade}
}

/** Tabela `configuracoes` (1 linha por usuário). */
export interface Configuracoes {
  nomeVendedor: string;
  metaDiaria: number;
  /** Último dia (inclusive) considerado amarelo. Ex: 2 → 1–2 dias = amarelo */
  amareloAteDias: number;
  /** Último dia (inclusive) considerado laranja. Ex: 6 → 3–6 dias = laranja; 7+ vermelho */
  laranjaAteDias: number;
  etapas: Etapa[];
  origens: string[];
  modelos: ModeloMensagem[];
  /** Ao registrar o 1º contato de um lead na 1ª etapa, move para a 2ª. */
  autoAvancarLeadNovo: boolean;
}

// ───────────────────────── Inputs ─────────────────────────

export type NovoLeadInput = Pick<Lead, 'nome' | 'telefone'> &
  Partial<Omit<Lead, 'id' | 'nome' | 'telefone' | 'criadoEm' | 'atualizadoEm'>>;

export type NovaTarefaInput = Omit<Tarefa, 'id' | 'criadoEm' | 'concluida' | 'concluidaEm'>;

export type NovoClienteInput = Omit<Cliente, 'id' | 'criadoEm'>;

export type NovaSimulacaoInput = Omit<Simulacao, 'id' | 'criadoEm' | 'parcelaEstimada'>;
