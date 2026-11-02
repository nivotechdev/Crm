import type { Cliente, ID, NovoClienteInput } from '../types';
import { somenteDigitos } from '../lib/format';
import { uid } from '../lib/uid';
import { db } from './storage';

export const clientService = {
  listar(): Promise<Cliente[]> {
    return db.listar<Cliente>('clientes');
  },

  criar(input: NovoClienteInput): Promise<Cliente> {
    const c: Cliente = {
      ...input,
      telefone: somenteDigitos(input.telefone),
      id: uid(),
      criadoEm: new Date().toISOString(),
    };
    return db.inserir('clientes', c);
  },

  atualizar(id: ID, patch: Partial<Omit<Cliente, 'id'>>): Promise<Cliente> {
    return db.atualizar<Cliente>('clientes', id, patch);
  },

  registrarPedidoIndicacao(id: ID): Promise<Cliente> {
    return db.atualizar<Cliente>('clientes', id, { indicacaoPedidaEm: new Date().toISOString() });
  },

  excluir(id: ID): Promise<void> {
    return db.remover('clientes', id);
  },
};
