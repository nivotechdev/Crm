import type { Configuracoes, Etapa } from '../types';

/** Paleta de cores disponíveis para etapas (chave → classes). */
export const CORES_ETAPA: Record<string, { dot: string; chip: string; bar: string }> = {
  slate: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200', bar: 'bg-slate-400' },
  sky: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', bar: 'bg-sky-500' },
  indigo: { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', bar: 'bg-indigo-500' },
  violet: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', bar: 'bg-violet-500' },
  fuchsia: { dot: 'bg-fuchsia-500', chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300', bar: 'bg-fuchsia-500' },
  amber: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', bar: 'bg-amber-500' },
  teal: { dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300', bar: 'bg-teal-500' },
  emerald: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-500' },
  rose: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', bar: 'bg-rose-500' },
};

export function corEtapa(e?: Etapa) {
  return CORES_ETAPA[e?.cor ?? 'slate'] ?? CORES_ETAPA.slate;
}

export function etapaPorId(cfg: Configuracoes, id: string): Etapa | undefined {
  return cfg.etapas.find((e) => e.id === id);
}

export function etapaGanho(cfg: Configuracoes): Etapa {
  return cfg.etapas.find((e) => e.tipo === 'ganho')!;
}

export function etapaPerdido(cfg: Configuracoes): Etapa {
  return cfg.etapas.find((e) => e.tipo === 'perdido')!;
}

export function etapasAbertas(cfg: Configuracoes): Etapa[] {
  return cfg.etapas.filter((e) => e.tipo === 'aberta');
}

export function isEtapaAtiva(cfg: Configuracoes, etapaId: string): boolean {
  return etapaPorId(cfg, etapaId)?.tipo === 'aberta' || !etapaPorId(cfg, etapaId);
}
