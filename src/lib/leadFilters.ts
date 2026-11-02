import type { Lead, Tarefa } from '../types';
import { diasSemContato } from './contactStatus';
import { isSameDay } from './dates';
import { normalizarBusca, somenteDigitos } from './format';

export type FiltroRapido = 'nao_contatados_hoje' | 'atrasados' | 'nunca' | 'retorno_hoje';

export const FILTROS_RAPIDOS: Array<{ id: FiltroRapido; label: string }> = [
  { id: 'nao_contatados_hoje', label: 'Não contatados hoje' },
  { id: 'atrasados', label: 'Atrasados (7+ dias)' },
  { id: 'nunca', label: 'Nunca contatados' },
  { id: 'retorno_hoje', label: 'Retorno hoje' },
];

export function aplicaFiltroRapido(
  l: Lead,
  f: FiltroRapido,
  ctx: { retornoHojeIds: Set<string>; vermelhoApartirDe: number; now: Date },
): boolean {
  switch (f) {
    case 'nao_contatados_hoje':
      return !l.ultimoContatoEm || !isSameDay(l.ultimoContatoEm, ctx.now);
    case 'atrasados':
      return !!l.ultimoContatoEm && diasSemContato(l, ctx.now) >= ctx.vermelhoApartirDe;
    case 'nunca':
      return !l.ultimoContatoEm;
    case 'retorno_hoje':
      return ctx.retornoHojeIds.has(l.id);
  }
}

export function buscaLead(l: Lead, q: string): boolean {
  if (!q.trim()) return true;
  const t = normalizarBusca(q.trim());
  const dig = somenteDigitos(q);
  return (
    normalizarBusca(l.nome).includes(t) ||
    normalizarBusca(l.cidade ?? '').includes(t) ||
    l.etiquetas.some((e) => normalizarBusca(e).includes(t)) ||
    (dig.length >= 3 && l.telefone.includes(dig))
  );
}

export type Ordenacao = 'sem_contato' | 'nome' | 'valor' | 'recentes' | 'proximo_passo';

export const ORDENACOES: Array<{ value: Ordenacao; label: string }> = [
  { value: 'sem_contato', label: 'Mais tempo sem contato' },
  { value: 'proximo_passo', label: 'Próximo passo' },
  { value: 'valor', label: 'Maior valor de carta' },
  { value: 'recentes', label: 'Criados recentemente' },
  { value: 'nome', label: 'Nome (A–Z)' },
];

export function ordenar(leads: Lead[], ord: Ordenacao, proxima: Map<string, Tarefa>): Lead[] {
  const arr = [...leads];
  switch (ord) {
    case 'sem_contato':
      // nunca contatados primeiro, depois quem está há mais tempo
      return arr.sort((a, b) => (a.ultimoContatoEm ?? '').localeCompare(b.ultimoContatoEm ?? '') || a.nome.localeCompare(b.nome));
    case 'nome':
      return arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'valor':
      return arr.sort((a, b) => (b.valorCarta ?? 0) - (a.valorCarta ?? 0));
    case 'recentes':
      return arr.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    case 'proximo_passo':
      return arr.sort((a, b) => (proxima.get(a.id)?.dataHora ?? '9999').localeCompare(proxima.get(b.id)?.dataHora ?? '9999'));
  }
}
