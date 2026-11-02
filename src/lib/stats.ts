import type { Atividade, Cliente, Configuracoes, Lead, MotivoPerda } from '../types';
import { addDays, inicioDaSemana, startOfDay } from './dates';

/** Funil ordenado: etapas abertas + ganho. */
export function etapasDoFunil(cfg: Configuracoes) {
  return [...cfg.etapas.filter((e) => e.tipo === 'aberta'), ...cfg.etapas.filter((e) => e.tipo === 'ganho')];
}

/**
 * Conversão por etapa: quantos leads ALCANÇARAM cada etapa (pelo histórico)
 * e a taxa de passagem da etapa anterior para ela.
 */
export function conversaoPorEtapa(leads: Lead[], atividades: Atividade[], cfg: Configuracoes) {
  const funil = etapasDoFunil(cfg);
  const idx = new Map(funil.map((e, i) => [e.id, i]));
  const maxPorLead = new Map<string, number>();
  for (const l of leads) maxPorLead.set(l.id, idx.get(l.etapaId) ?? 0);
  for (const a of atividades) {
    if (a.tipo !== 'etapa' || !a.etapaPara) continue;
    const i = idx.get(a.etapaPara);
    if (i !== undefined && maxPorLead.has(a.leadId)) maxPorLead.set(a.leadId, Math.max(maxPorLead.get(a.leadId)!, i));
  }
  const valores = [...maxPorLead.values()];
  return funil.map((etapa, i) => {
    const alcancaram = valores.filter((v) => v >= i).length;
    const anteriores = i === 0 ? alcancaram : valores.filter((v) => v >= i - 1).length;
    return { etapa, alcancaram, taxa: i === 0 ? 1 : anteriores ? alcancaram / anteriores : 0 };
  });
}

export function contatosPorDia(atividades: Atividade[], dias: number, now = new Date()) {
  const inicio = startOfDay(addDays(now, -(dias - 1)));
  const buckets = Array.from({ length: dias }, (_, i) => ({ data: addDays(inicio, i), ligacoes: 0, whatsapps: 0 }));
  for (const a of atividades) {
    if (a.tipo !== 'ligacao' && a.tipo !== 'whatsapp') continue;
    const d = startOfDay(new Date(a.criadoEm));
    const i = Math.round((d.getTime() - inicio.getTime()) / 86_400_000);
    if (i < 0 || i >= dias) continue;
    if (a.tipo === 'ligacao') buckets[i].ligacoes++;
    else buckets[i].whatsapps++;
  }
  return buckets;
}

export function contatosPorSemana(atividades: Atividade[], semanas: number, now = new Date()) {
  const inicio = addDays(inicioDaSemana(now), -7 * (semanas - 1));
  const buckets = Array.from({ length: semanas }, (_, i) => ({ data: addDays(inicio, i * 7), ligacoes: 0, whatsapps: 0 }));
  for (const a of atividades) {
    if (a.tipo !== 'ligacao' && a.tipo !== 'whatsapp') continue;
    const i = Math.floor((new Date(a.criadoEm).getTime() - inicio.getTime()) / (7 * 86_400_000));
    if (i < 0 || i >= semanas) continue;
    if (a.tipo === 'ligacao') buckets[i].ligacoes++;
    else buckets[i].whatsapps++;
  }
  return buckets;
}

export function motivosDePerda(leads: Lead[], cfg: Configuracoes) {
  const perdido = cfg.etapas.find((e) => e.tipo === 'perdido')?.id;
  const cont = new Map<MotivoPerda, number>();
  for (const l of leads) if (l.etapaId === perdido) cont.set(l.motivoPerda ?? 'outro', (cont.get(l.motivoPerda ?? 'outro') ?? 0) + 1);
  return [...cont.entries()].map(([motivo, qtd]) => ({ motivo, qtd })).sort((a, b) => b.qtd - a.qtd);
}

export function conversaoPorOrigem(leads: Lead[], cfg: Configuracoes) {
  const ganho = cfg.etapas.find((e) => e.tipo === 'ganho')?.id;
  const perdido = cfg.etapas.find((e) => e.tipo === 'perdido')?.id;
  const mapa = new Map<string, { total: number; ganhos: number; perdidos: number; volume: number }>();
  for (const l of leads) {
    const o = l.origem || 'Sem origem';
    const m = mapa.get(o) ?? { total: 0, ganhos: 0, perdidos: 0, volume: 0 };
    m.total++;
    if (l.etapaId === ganho) {
      m.ganhos++;
      m.volume += l.valorCarta ?? 0;
    }
    if (l.etapaId === perdido) m.perdidos++;
    mapa.set(o, m);
  }
  return [...mapa.entries()]
    .map(([origem, m]) => ({ origem, ...m, taxa: m.total ? m.ganhos / m.total : 0 }))
    .sort((a, b) => b.taxa - a.taxa || b.total - a.total);
}

export function vendasPorMes(clientes: Cliente[], meses: number, now = new Date()) {
  const out = Array.from({ length: meses }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (meses - 1 - i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), qtd: 0, volume: 0 };
  });
  for (const c of clientes) {
    const d = new Date(c.dataVenda);
    const b = out.find((x) => x.ano === d.getFullYear() && x.mes === d.getMonth());
    if (b) {
      b.qtd++;
      b.volume += c.valorCarta ?? 0;
    }
  }
  return out;
}

export function vendasDoMes(clientes: Cliente[], now = new Date()) {
  const doMes = clientes.filter((c) => {
    const d = new Date(c.dataVenda);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  return { qtd: doMes.length, volume: doMes.reduce((s, c) => s + (c.valorCarta ?? 0), 0) };
}
