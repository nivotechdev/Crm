import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Atividade, Canal, Cliente, Configuracoes, ID, Lead, MotivoPerda, NovaSimulacaoInput, NovaTarefaInput,
  NovoClienteInput, NovoLeadInput, ResultadoContato, Simulacao, Tarefa,
} from '../types';
import {
  CONFIG_PADRAO, apagarTudo, clientService, contactService, inicializarSeNecessario, leadService, restaurarExemplo,
  settingsService, simulationService, taskService,
} from '../services';
import { endOfDay } from '../lib/dates';

type Colecao = 'leads' | 'atividades' | 'tarefas' | 'clientes' | 'simulacoes' | 'config';

interface DataState {
  carregando: boolean;
  leads: Lead[];
  atividades: Atividade[];
  tarefas: Tarefa[];
  clientes: Cliente[];
  simulacoes: Simulacao[];
  config: Configuracoes;
}

interface DataActions {
  criarLead(input: NovoLeadInput): Promise<Lead>;
  atualizarLead(id: ID, patch: Partial<Lead>): Promise<Lead>;
  excluirLeads(ids: ID[]): Promise<void>;
  moverEtapa(id: ID, etapaId: ID, extra?: { motivoPerda?: MotivoPerda; motivoPerdaDetalhe?: string }): Promise<void>;
  moverEtapaEmMassa(ids: ID[], etapaId: ID): Promise<void>;
  atualizarLeadsEmMassa(ids: ID[], patch: Partial<Lead>): Promise<void>;
  adicionarEtiquetaEmMassa(ids: ID[], etiqueta: string): Promise<void>;

  registrarContato(
    leadId: ID,
    canal: Canal,
  ): Promise<{ contatoId: ID; etapaAvancada: boolean; retornosConcluidos: number }>;
  atualizarContato(id: ID, patch: { resultado?: ResultadoContato; observacao?: string }): Promise<void>;
  desfazerContato(id: ID): Promise<void>;
  adicionarNota(leadId: ID, texto: string): Promise<void>;
  excluirAtividade(id: ID): Promise<void>;

  criarTarefa(input: NovaTarefaInput): Promise<Tarefa>;
  agendarRetorno(leadId: ID, dataHora: string, titulo?: string): Promise<Tarefa>;
  alternarTarefa(id: ID, concluida: boolean): Promise<void>;
  atualizarTarefa(id: ID, patch: Partial<Tarefa>): Promise<void>;
  excluirTarefa(id: ID): Promise<void>;

  criarCliente(input: NovoClienteInput): Promise<Cliente>;
  atualizarCliente(id: ID, patch: Partial<Cliente>): Promise<void>;
  excluirCliente(id: ID): Promise<void>;
  registrarPedidoIndicacao(id: ID): Promise<void>;

  criarSimulacao(input: NovaSimulacaoInput): Promise<Simulacao>;

  salvarConfig(cfg: Configuracoes): Promise<void>;
  restaurarExemplo(): Promise<void>;
  apagarTudo(): Promise<void>;
}

const DataCtx = createContext<(DataState & DataActions) | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    carregando: true,
    leads: [],
    atividades: [],
    tarefas: [],
    clientes: [],
    simulacoes: [],
    config: CONFIG_PADRAO,
  });

  const recarregar = useCallback(async (...cols: Colecao[]) => {
    const todas = cols.length === 0;
    const has = (c: Colecao) => todas || cols.includes(c);
    const [leads, atividades, tarefas, clientes, simulacoes, config] = await Promise.all([
      has('leads') ? leadService.listar() : undefined,
      has('atividades') ? contactService.listar() : undefined,
      has('tarefas') ? taskService.listar() : undefined,
      has('clientes') ? clientService.listar() : undefined,
      has('simulacoes') ? simulationService.listar() : undefined,
      has('config') ? settingsService.obter() : undefined,
    ]);
    setState((s) => ({
      carregando: false,
      leads: leads ?? s.leads,
      atividades: atividades ?? s.atividades,
      tarefas: tarefas ?? s.tarefas,
      clientes: clientes ?? s.clientes,
      simulacoes: simulacoes ?? s.simulacoes,
      config: config ?? s.config,
    }));
  }, []);

  useEffect(() => {
    inicializarSeNecessario().then(() => recarregar());
  }, [recarregar]);

  const actions = useMemo<DataActions>(() => {
    const etapaInicial = () => state.config.etapas.find((e) => e.tipo === 'aberta')?.id ?? 'novo';
    return {
      async criarLead(input) {
        const l = await leadService.criar(input, etapaInicial());
        await recarregar('leads', 'atividades');
        return l;
      },
      async atualizarLead(id, patch) {
        const l = await leadService.atualizar(id, patch);
        setState((s) => ({ ...s, leads: s.leads.map((x) => (x.id === id ? l : x)) }));
        return l;
      },
      async excluirLeads(ids) {
        await leadService.excluir(ids);
        await recarregar('leads', 'atividades', 'tarefas', 'simulacoes');
      },
      async moverEtapa(id, etapaId, extra) {
        await leadService.moverEtapa(id, etapaId, extra);
        await recarregar('leads', 'atividades');
      },
      async moverEtapaEmMassa(ids, etapaId) {
        await leadService.moverEtapaEmMassa(ids, etapaId);
        await recarregar('leads', 'atividades');
      },
      async atualizarLeadsEmMassa(ids, patch) {
        await leadService.atualizarEmMassa(ids, patch);
        await recarregar('leads');
      },
      async adicionarEtiquetaEmMassa(ids, etiqueta) {
        await leadService.adicionarEtiquetaEmMassa(ids, etiqueta);
        await recarregar('leads');
      },

      async registrarContato(leadId, canal) {
        const { contato, etapaAvancada } = await contactService.registrarContato(leadId, canal, state.config);
        // Retornos vencidos/de hoje deste lead são concluídos automaticamente
        const limite = endOfDay(new Date()).toISOString();
        const pendentes = (await taskService.listar()).filter(
          (t) => t.leadId === leadId && !t.concluida && t.tipo === 'retorno' && t.dataHora <= limite,
        );
        for (const t of pendentes) await taskService.alternarConcluida(t.id, true);
        await recarregar('leads', 'atividades', 'tarefas');
        return { contatoId: contato.id, etapaAvancada, retornosConcluidos: pendentes.length };
      },
      async atualizarContato(id, patch) {
        await contactService.atualizarContato(id, patch);
        await recarregar('atividades');
      },
      async desfazerContato(id) {
        await contactService.desfazerContato(id);
        await recarregar('leads', 'atividades');
      },
      async adicionarNota(leadId, texto) {
        await contactService.adicionarNota(leadId, texto);
        await recarregar('atividades');
      },
      async excluirAtividade(id) {
        await contactService.excluirAtividade(id);
        await recarregar('leads', 'atividades');
      },

      async criarTarefa(input) {
        const t = await taskService.criar(input);
        await recarregar('tarefas');
        return t;
      },
      async agendarRetorno(leadId, dataHora, titulo) {
        const t = await taskService.agendarRetorno(leadId, dataHora, titulo);
        await recarregar('tarefas');
        return t;
      },
      async alternarTarefa(id, concluida) {
        await taskService.alternarConcluida(id, concluida);
        await recarregar('tarefas');
      },
      async atualizarTarefa(id, patch) {
        await taskService.atualizar(id, patch);
        await recarregar('tarefas');
      },
      async excluirTarefa(id) {
        await taskService.excluir(id);
        await recarregar('tarefas');
      },

      async criarCliente(input) {
        const c = await clientService.criar(input);
        await recarregar('clientes');
        return c;
      },
      async atualizarCliente(id, patch) {
        const c = await clientService.atualizar(id, patch);
        setState((s) => ({ ...s, clientes: s.clientes.map((x) => (x.id === id ? c : x)) }));
      },
      async excluirCliente(id) {
        await clientService.excluir(id);
        await recarregar('clientes');
      },
      async registrarPedidoIndicacao(id) {
        await clientService.registrarPedidoIndicacao(id);
        await recarregar('clientes');
      },

      async criarSimulacao(input) {
        const s = await simulationService.criar(input);
        await recarregar('simulacoes', 'atividades');
        return s;
      },

      async salvarConfig(cfg) {
        await settingsService.salvar(cfg);
        await recarregar('config');
      },
      async restaurarExemplo() {
        await restaurarExemplo();
        await recarregar();
      },
      async apagarTudo() {
        await apagarTudo();
        await recarregar();
      },
    };
  }, [state.config, recarregar]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData fora do DataProvider');
  return ctx;
}
