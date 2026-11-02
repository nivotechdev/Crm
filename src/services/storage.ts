/**
 * Adaptador de persistência LOCAL (localStorage).
 *
 * É o ÚNICO arquivo que sabe onde os dados moram. Os services (leadService etc.)
 * usam só estas funções assíncronas. Para migrar ao Supabase, troque os services
 * para chamar `supabase.from('<tabela>')...` — as telas não mudam.
 */
import type { Configuracoes } from '../types';

const PREFIX = 'crm-consorcio:v1:';

export type Colecao = 'leads' | 'atividades' | 'tarefas' | 'clientes' | 'simulacoes';

const cache = new Map<string, unknown>();

function ler<T>(chave: string, padrao: T): T {
  if (cache.has(chave)) return cache.get(chave) as T;
  try {
    const raw = localStorage.getItem(PREFIX + chave);
    const v = raw ? (JSON.parse(raw) as T) : padrao;
    cache.set(chave, v);
    return v;
  } catch {
    return padrao;
  }
}

function gravar<T>(chave: string, valor: T) {
  cache.set(chave, valor);
  try {
    localStorage.setItem(PREFIX + chave, JSON.stringify(valor));
  } catch (e) {
    console.warn('Falha ao salvar no localStorage', e);
  }
}

/** Simula a natureza assíncrona de um banco remoto. */
const async = <T>(v: T): Promise<T> => Promise.resolve(structuredClone(v));

export const db = {
  async listar<T>(c: Colecao): Promise<T[]> {
    return async(ler<T[]>(c, []));
  },

  async obter<T extends { id: string }>(c: Colecao, id: string): Promise<T | undefined> {
    return async(ler<T[]>(c, []).find((x) => x.id === id));
  },

  async inserir<T extends { id: string }>(c: Colecao, item: T): Promise<T> {
    gravar(c, [...ler<T[]>(c, []), item]);
    return async(item);
  },

  async inserirVarios<T extends { id: string }>(c: Colecao, itens: T[]): Promise<T[]> {
    gravar(c, [...ler<T[]>(c, []), ...itens]);
    return async(itens);
  },

  async atualizar<T extends { id: string }>(c: Colecao, id: string, patch: Partial<T>): Promise<T> {
    const lista = ler<T[]>(c, []);
    const idx = lista.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error(`Registro ${id} não encontrado em ${c}`);
    const novo = { ...lista[idx], ...patch, id } as T;
    const copia = [...lista];
    copia[idx] = novo;
    gravar(c, copia);
    return async(novo);
  },

  async remover(c: Colecao, ids: string | string[]): Promise<void> {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    gravar(c, ler<Array<{ id: string }>>(c, []).filter((x) => !set.has(x.id)));
  },

  async removerOnde<T>(c: Colecao, pred: (x: T) => boolean): Promise<void> {
    gravar(c, ler<T[]>(c, []).filter((x) => !pred(x)));
  },

  async substituirTudo<T>(c: Colecao, itens: T[]): Promise<void> {
    gravar(c, itens);
  },

  async lerConfig(padrao: Configuracoes): Promise<Configuracoes> {
    return async({ ...padrao, ...ler<Partial<Configuracoes>>('config', {}) });
  },

  async gravarConfig(cfg: Configuracoes): Promise<Configuracoes> {
    gravar('config', cfg);
    return async(cfg);
  },

  jaInicializado(): boolean {
    return ler<boolean>('inicializado', false);
  },

  marcarInicializado() {
    gravar('inicializado', true);
  },

  limparTudo() {
    cache.clear();
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

// Preferências puramente de interface (não vão para o banco).
export const prefs = {
  get<T>(chave: string, padrao: T): T {
    try {
      const raw = localStorage.getItem('crm-consorcio:' + chave);
      return raw ? (JSON.parse(raw) as T) : padrao;
    } catch {
      return padrao;
    }
  },
  set<T>(chave: string, v: T) {
    try {
      localStorage.setItem('crm-consorcio:' + chave, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  },
};
