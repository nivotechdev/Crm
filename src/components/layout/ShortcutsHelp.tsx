import { useAcoes } from '../../store/AcoesContext';
import { Modal } from '../ui/Modal';

const GRUPOS = [
  {
    titulo: 'Geral',
    itens: [
      ['Ctrl K  ou  /', 'Busca global'],
      ['N', 'Novo lead'],
      ['?', 'Mostrar atalhos'],
      ['Esc', 'Fechar janela / popup'],
    ],
  },
  {
    titulo: 'Navegação',
    itens: [
      ['G  D', 'Painel'],
      ['G  L', 'Leads (lista)'],
      ['G  F', 'Funil (kanban)'],
      ['G  A', 'Agenda'],
      ['G  C', 'Clientes'],
      ['G  R', 'Relatórios'],
      ['G  S', 'Configurações'],
    ],
  },
  {
    titulo: 'Na lista de leads',
    itens: [
      ['J / K  ou  ↓ / ↑', 'Próximo / anterior'],
      ['L', 'Registrar ligação no lead selecionado'],
      ['W', 'WhatsApp no lead selecionado'],
      ['Enter', 'Abrir ficha'],
      ['X', 'Selecionar para ação em massa'],
    ],
  },
  {
    titulo: 'Na ficha do lead',
    itens: [
      ['L', 'Registrar ligação'],
      ['W', 'Abrir WhatsApp e registrar'],
      ['A', 'Adicionar anotação'],
    ],
  },
];

export function ShortcutsHelp() {
  const { atalhosAbertos, setAtalhosAbertos } = useAcoes();
  return (
    <Modal aberto={atalhosAbertos} onFechar={() => setAtalhosAbertos(false)} titulo="Atalhos de teclado" tamanho="lg">
      <div className="grid gap-6 sm:grid-cols-2">
        {GRUPOS.map((g) => (
          <div key={g.titulo}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.titulo}</h3>
            <dl className="space-y-1.5">
              {g.itens.map(([k, d]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-slate-600 dark:text-slate-300">{d}</dt>
                  <dd>
                    <kbd className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                      {k}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Modal>
  );
}
