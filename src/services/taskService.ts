import type { ID, NovaTarefaInput, Tarefa } from '../types';
import { uid } from '../lib/uid';
import { db } from './storage';

export const taskService = {
  listar(): Promise<Tarefa[]> {
    return db.listar<Tarefa>('tarefas');
  },

  criar(input: NovaTarefaInput): Promise<Tarefa> {
    const t: Tarefa = { ...input, id: uid(), concluida: false, criadoEm: new Date().toISOString() };
    return db.inserir('tarefas', t);
  },

  /** Atalho usado no mini-popup: agenda o próximo contato de um lead. */
  agendarRetorno(leadId: ID, dataHora: string, titulo = 'Retornar contato', diaInteiro = true): Promise<Tarefa> {
    return this.criar({ leadId, dataHora, titulo, tipo: 'retorno', diaInteiro });
  },

  alternarConcluida(id: ID, concluida: boolean): Promise<Tarefa> {
    return db.atualizar<Tarefa>('tarefas', id, {
      concluida,
      concluidaEm: concluida ? new Date().toISOString() : undefined,
    });
  },

  atualizar(id: ID, patch: Partial<Tarefa>): Promise<Tarefa> {
    return db.atualizar<Tarefa>('tarefas', id, patch);
  },

  excluir(id: ID): Promise<void> {
    return db.remover('tarefas', id);
  },
};
