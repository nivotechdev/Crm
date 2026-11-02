import type {
  Canal, MotivoPerda, Objetivo, ResultadoContato, SimNaoTalvez, StatusCliente, Temperatura, TipoBem, TipoTarefa, Urgencia,
} from '../types';

export const OBJETIVOS: Record<Objetivo, string> = {
  imovel: 'Imóvel',
  veiculo: 'Veículo',
  pesado: 'Pesado',
  servicos: 'Serviços',
  investimento: 'Investimento/patrimônio',
};

export const TEMPERATURAS: Record<Temperatura, string> = { frio: 'Frio', morno: 'Morno', quente: 'Quente' };

export const SIM_NAO_TALVEZ: Record<SimNaoTalvez, string> = { sim: 'Sim', nao: 'Não', talvez: 'Talvez' };

export const URGENCIAS: Record<Urgencia, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

export const CANAIS: Record<Canal, string> = { ligacao: 'Ligação', whatsapp: 'WhatsApp' };

export const RESULTADOS: Record<ResultadoContato, string> = {
  atendeu: 'Atendeu',
  nao_atendeu: 'Não atendeu',
  caixa_postal: 'Caixa postal',
  respondeu: 'Respondeu',
  visualizou_sem_resposta: 'Visualizou e não respondeu',
  pediu_retorno: 'Pediu retorno',
};

/** Resultados que fazem sentido para cada canal (ordem de exibição). */
export const RESULTADOS_POR_CANAL: Record<Canal, ResultadoContato[]> = {
  ligacao: ['atendeu', 'nao_atendeu', 'caixa_postal', 'pediu_retorno'],
  whatsapp: ['respondeu', 'visualizou_sem_resposta', 'pediu_retorno', 'nao_atendeu'],
};

export const MOTIVOS_PERDA: Record<MotivoPerda, string> = {
  sem_dinheiro: 'Sem dinheiro',
  preferiu_financiamento: 'Preferiu financiamento',
  outra_administradora: 'Comprou com outra administradora',
  sem_interesse_agora: 'Sem interesse agora',
  nao_responde: 'Não responde',
  outro: 'Outro',
};

export const STATUS_CLIENTE: Record<StatusCliente, string> = {
  ativo: 'Ativo',
  contemplado: 'Contemplado',
  cancelado: 'Cancelado',
};

export const TIPOS_BEM: Record<TipoBem, string> = {
  imovel: 'Imóvel',
  veiculo: 'Veículo',
  pesado: 'Pesado',
  servicos: 'Serviços',
  outro: 'Outro',
};

export const TIPOS_TAREFA: Record<TipoTarefa, string> = {
  retorno: 'Retorno',
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  assembleia: 'Assembleia',
  indicacao: 'Pedir indicação',
};

export function opcoes<T extends string>(rec: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(rec) as T[]).map((value) => ({ value, label: rec[value] }));
}
