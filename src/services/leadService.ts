import type { Atividade, ID, Lead, MotivoPerda, NovoLeadInput } from '../types';
import { somenteDigitos } from '../lib/format';
import { uid } from '../lib/uid';
import { db } from './storage';

const agora = () => new Date().toISOString();

export const leadService = {
  listar(): Promise<Lead[]> {
    return db.listar<Lead>('leads');
  },

  obter(id: ID): Promise<Lead | undefined> {
    return db.obter<Lead>('leads', id);
  },

  /** Só nome e telefone são obrigatórios. */
  async criar(input: NovoLeadInput, etapaInicialId: ID): Promise<Lead> {
    const nome = input.nome.trim();
    const telefone = somenteDigitos(input.telefone);
    if (!nome) throw new Error('Informe o nome');
    if (telefone.length < 10) throw new Error('Telefone deve ter DDD + número');
    const ts = agora();
    const lead: Lead = {
      temperatura: 'morno',
      etiquetas: [],
      ...input,
      nome,
      telefone,
      id: uid(),
      etapaId: input.etapaId ?? etapaInicialId,
      criadoEm: ts,
      atualizadoEm: ts,
    };
    await db.inserir('leads', lead);
    await db.inserir<Atividade>('atividades', {
      id: uid(),
      leadId: lead.id,
      tipo: 'sistema',
      criadoEm: ts,
      observacao: 'Lead criado' + (lead.origem ? ` · origem: ${lead.origem}` : ''),
    });
    return lead;
  },

  atualizar(id: ID, patch: Partial<Omit<Lead, 'id' | 'criadoEm'>>): Promise<Lead> {
    const p = { ...patch, atualizadoEm: agora() };
    if (p.telefone !== undefined) p.telefone = somenteDigitos(p.telefone);
    return db.atualizar<Lead>('leads', id, p);
  },

  async atualizarEmMassa(ids: ID[], patch: Partial<Lead>): Promise<void> {
    for (const id of ids) await db.atualizar<Lead>('leads', id, { ...patch, atualizadoEm: agora() });
  },

  async adicionarEtiquetaEmMassa(ids: ID[], etiqueta: string): Promise<void> {
    const leads = await db.listar<Lead>('leads');
    for (const l of leads.filter((x) => ids.includes(x.id))) {
      if (!l.etiquetas.includes(etiqueta)) {
        await db.atualizar<Lead>('leads', l.id, { etiquetas: [...l.etiquetas, etiqueta], atualizadoEm: agora() });
      }
    }
  },

  /** Muda a etapa e registra no histórico. */
  async moverEtapa(
    id: ID,
    etapaId: ID,
    extra?: { motivoPerda?: MotivoPerda; motivoPerdaDetalhe?: string },
  ): Promise<Lead> {
    const lead = await db.obter<Lead>('leads', id);
    if (!lead) throw new Error('Lead não encontrado');
    if (lead.etapaId === etapaId) return lead;
    const ts = agora();
    await db.inserir<Atividade>('atividades', {
      id: uid(),
      leadId: id,
      tipo: 'etapa',
      etapaDe: lead.etapaId,
      etapaPara: etapaId,
      criadoEm: ts,
      observacao: extra?.motivoPerdaDetalhe,
    });
    return db.atualizar<Lead>('leads', id, {
      etapaId,
      motivoPerda: extra?.motivoPerda,
      motivoPerdaDetalhe: extra?.motivoPerdaDetalhe,
      atualizadoEm: ts,
    });
  },

  async moverEtapaEmMassa(ids: ID[], etapaId: ID): Promise<void> {
    for (const id of ids) await this.moverEtapa(id, etapaId);
  },

  async excluir(ids: ID | ID[]): Promise<void> {
    const lista = Array.isArray(ids) ? ids : [ids];
    const set = new Set(lista);
    await db.remover('leads', lista);
    // No banco: ON DELETE CASCADE
    await db.removerOnde<Atividade>('atividades', (a) => set.has(a.leadId));
    await db.removerOnde<{ leadId?: string }>('tarefas', (t) => !!t.leadId && set.has(t.leadId));
    await db.removerOnde<{ leadId: string }>('simulacoes', (s) => set.has(s.leadId));
  },
};
