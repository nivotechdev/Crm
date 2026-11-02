import type { Atividade, ID, NovaSimulacaoInput, Simulacao } from '../types';
import { formatBRL } from '../lib/format';
import { uid } from '../lib/uid';
import { db } from './storage';

/**
 * Cálculo SIMPLIFICADO de parcela de consórcio — apenas ESTIMATIVA.
 * parcela = crédito × (1 + taxa adm % + fundo de reserva %) ÷ prazo
 * Não considera seguro, reajustes, lance, redutores, nem regras da administradora.
 */
export function calcularParcela(p: Pick<Simulacao, 'valorCarta' | 'prazoMeses' | 'taxaAdmPct' | 'fundoReservaPct'>) {
  const { valorCarta, prazoMeses, taxaAdmPct, fundoReservaPct } = p;
  if (!valorCarta || !prazoMeses || prazoMeses <= 0) return null;
  const fundoComum = valorCarta / prazoMeses;
  const taxaAdm = (valorCarta * (taxaAdmPct || 0)) / 100 / prazoMeses;
  const fundoReserva = (valorCarta * (fundoReservaPct || 0)) / 100 / prazoMeses;
  const parcela = fundoComum + taxaAdm + fundoReserva;
  return { fundoComum, taxaAdm, fundoReserva, parcela, totalPago: parcela * prazoMeses };
}

export const simulationService = {
  listar(): Promise<Simulacao[]> {
    return db.listar<Simulacao>('simulacoes');
  },

  async criar(input: NovaSimulacaoInput): Promise<Simulacao> {
    const calc = calcularParcela(input);
    if (!calc) throw new Error('Informe valor da carta e prazo');
    const sim: Simulacao = {
      ...input,
      id: uid(),
      parcelaEstimada: Math.round(calc.parcela * 100) / 100,
      criadoEm: new Date().toISOString(),
    };
    await db.inserir('simulacoes', sim);
    await db.inserir<Atividade>('atividades', {
      id: uid(),
      leadId: sim.leadId,
      tipo: 'simulacao',
      simulacaoId: sim.id,
      criadoEm: sim.criadoEm,
      observacao: `Carta ${formatBRL(sim.valorCarta)} · ${sim.prazoMeses} meses · parcela estimada ${formatBRL(sim.parcelaEstimada, true)}`,
    });
    return sim;
  },

  excluir(id: ID): Promise<void> {
    return db.remover('simulacoes', id);
  },
};
