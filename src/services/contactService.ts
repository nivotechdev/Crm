import type { Atividade, Canal, Configuracoes, Contato, ID, Lead, ResultadoContato } from '../types';
import { uid } from '../lib/uid';
import { db } from './storage';
import { leadService } from './leadService';

const agora = () => new Date().toISOString();
const isContato = (a: Atividade): a is Contato => a.tipo === 'ligacao' || a.tipo === 'whatsapp';

/** Recalcula os campos denormalizados de último contato do lead. */
async function recalcularUltimoContato(leadId: ID): Promise<void> {
  const atividades = await db.listar<Atividade>('atividades');
  const ultimo = atividades
    .filter((a) => a.leadId === leadId && isContato(a))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0];
  await db.atualizar<Lead>('leads', leadId, {
    ultimoContatoEm: ultimo?.criadoEm,
    ultimoContatoCanal: ultimo?.tipo as Canal | undefined,
  });
}

export const contactService = {
  /** Todas as atividades (linha do tempo de todos os leads). */
  listar(): Promise<Atividade[]> {
    return db.listar<Atividade>('atividades');
  },

  async listarPorLead(leadId: ID): Promise<Atividade[]> {
    const todas = await db.listar<Atividade>('atividades');
    return todas.filter((a) => a.leadId === leadId).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },

  /**
   * Registra uma ligação ou WhatsApp com data/hora automática.
   * Atualiza o último contato do lead e, se configurado, avança "Lead novo".
   */
  async registrarContato(
    leadId: ID,
    canal: Canal,
    cfg: Configuracoes,
    dados?: { resultado?: ResultadoContato; observacao?: string },
  ): Promise<{ contato: Contato; etapaAvancada: boolean }> {
    const ts = agora();
    const contato: Contato = { id: uid(), leadId, tipo: canal, criadoEm: ts, ...dados };
    await db.inserir('atividades', contato);
    await db.atualizar<Lead>('leads', leadId, { ultimoContatoEm: ts, ultimoContatoCanal: canal });

    let etapaAvancada = false;
    const lead = await db.obter<Lead>('leads', leadId);
    const abertas = cfg.etapas.filter((e) => e.tipo === 'aberta');
    if (cfg.autoAvancarLeadNovo && lead && abertas.length > 1 && lead.etapaId === abertas[0].id) {
      await leadService.moverEtapa(leadId, abertas[1].id);
      etapaAvancada = true;
    }
    return { contato, etapaAvancada };
  },

  /** Completa o contato com resultado/observação (mini-popup opcional). */
  atualizarContato(id: ID, patch: { resultado?: ResultadoContato; observacao?: string }): Promise<Atividade> {
    return db.atualizar<Atividade>('atividades', id, patch);
  },

  /** Desfaz um contato registrado por engano. */
  async desfazerContato(id: ID): Promise<void> {
    const a = await db.obter<Atividade>('atividades', id);
    if (!a) return;
    await db.remover('atividades', id);
    await recalcularUltimoContato(a.leadId);
  },

  async adicionarNota(leadId: ID, texto: string): Promise<Atividade> {
    const nota: Atividade = { id: uid(), leadId, tipo: 'nota', observacao: texto.trim(), criadoEm: agora() };
    return db.inserir('atividades', nota);
  },

  async excluirAtividade(id: ID): Promise<void> {
    const a = await db.obter<Atividade>('atividades', id);
    await db.remover('atividades', id);
    if (a && isContato(a)) await recalcularUltimoContato(a.leadId);
  },

  isContato,
};
