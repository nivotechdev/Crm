import type { Configuracoes, Lead, NivelContato } from '../types';
import { diffDiasCalendario } from './dates';

/** Calcula o nível de urgência de um lead a partir do último contato. */
export function nivelContato(
  ultimoContatoEm: string | undefined,
  cfg: Pick<Configuracoes, 'amareloAteDias' | 'laranjaAteDias'>,
  now: Date = new Date(),
): NivelContato {
  if (!ultimoContatoEm) return 'cinza';
  const dias = diffDiasCalendario(ultimoContatoEm, now);
  if (dias <= 0) return 'verde';
  if (dias <= cfg.amareloAteDias) return 'amarelo';
  if (dias <= cfg.laranjaAteDias) return 'laranja';
  return 'vermelho';
}

export function diasSemContato(lead: Pick<Lead, 'ultimoContatoEm'>, now = new Date()): number {
  return lead.ultimoContatoEm ? diffDiasCalendario(lead.ultimoContatoEm, now) : Number.POSITIVE_INFINITY;
}

/** Classes Tailwind de cada nível. Contraste AA em claro e escuro. */
export const NIVEL_ESTILO: Record<
  NivelContato,
  { faixa: string; badge: string; ponto: string; label: string; hex: string }
> = {
  verde: {
    faixa: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30',
    ponto: 'bg-emerald-500',
    label: 'Contatado hoje',
    hex: '#10b981',
  },
  amarelo: {
    faixa: 'bg-yellow-400',
    badge: 'bg-yellow-50 text-yellow-800 ring-yellow-600/30 dark:bg-yellow-400/15 dark:text-yellow-200 dark:ring-yellow-300/30',
    ponto: 'bg-yellow-400',
    label: 'Recente',
    hex: '#facc15',
  },
  laranja: {
    faixa: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-800 ring-orange-600/30 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/30',
    ponto: 'bg-orange-500',
    label: 'Esfriando',
    hex: '#f97316',
  },
  vermelho: {
    faixa: 'bg-red-500',
    badge: 'bg-red-50 text-red-800 ring-red-600/25 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
    ponto: 'bg-red-500',
    label: 'Atrasado',
    hex: '#ef4444',
  },
  cinza: {
    faixa: 'bg-slate-300 dark:bg-slate-600',
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/25',
    ponto: 'bg-slate-400',
    label: 'Nunca contatado',
    hex: '#94a3b8',
  },
};

export function descricaoFaixas(cfg: Pick<Configuracoes, 'amareloAteDias' | 'laranjaAteDias'>) {
  const a = cfg.amareloAteDias;
  const l = cfg.laranjaAteDias;
  return {
    verde: 'Hoje',
    amarelo: a <= 1 ? '1 dia' : `1 a ${a} dias`,
    laranja: l <= a + 1 ? `${a + 1} dias` : `${a + 1} a ${l} dias`,
    vermelho: `${l + 1}+ dias`,
    cinza: 'Nunca',
  } satisfies Record<NivelContato, string>;
}
