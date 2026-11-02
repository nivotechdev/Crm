import type { Cliente } from '../types';
import { diffDiasCalendario } from './dates';

/** Venda há 7+ dias e indicação nunca pedida (ou pedida há 90+ dias). */
export function precisaPedirIndicacao(c: Cliente, now = new Date()): boolean {
  if (c.status === 'cancelado') return false;
  if (diffDiasCalendario(c.dataVenda, now) < 7) return false;
  return !c.indicacaoPedidaEm || diffDiasCalendario(c.indicacaoPedidaEm, now) >= 90;
}

/** Dias até a assembleia (negativo = já passou). */
export function diasAteAssembleia(c: Cliente, now = new Date()): number | null {
  if (!c.proximaAssembleia) return null;
  return -diffDiasCalendario(c.proximaAssembleia, now);
}
