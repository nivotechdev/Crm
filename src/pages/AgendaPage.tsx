import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarX, Plus } from 'lucide-react';
import type { TipoTarefa } from '../types';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { addDays, endOfDay, formatDiaSemana, startOfDay, toInputDate } from '../lib/dates';
import { TIPOS_TAREFA, opcoes } from '../lib/labels';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { Segmented } from '../components/ui/Segmented';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskItem } from '../components/agenda/TaskItem';

type Aba = 'hoje' | 'atrasados' | 'semana' | 'concluidas';

export default function AgendaPage() {
  const { tarefas, excluirTarefa } = useData();
  const { confirmar } = useAcoes();
  const toast = useToast();
  const now = useNow();
  const d = useDerivados();
  const [aba, setAba] = useState<Aba>(() => (d.tarefasAtrasadas.length > 0 && d.tarefasHoje.length === 0 ? 'atrasados' : 'hoje'));
  const [nova, setNova] = useState(false);

  const fimSemana = endOfDay(addDays(now, 6)).toISOString();
  const inicioHoje = startOfDay(now).toISOString();
  const semana = useMemo(() => d.pendentes.filter((t) => t.dataHora >= inicioHoje && t.dataHora <= fimSemana), [d.pendentes, inicioHoje, fimSemana]);
  const concluidas = useMemo(
    () => tarefas.filter((t) => t.concluida).sort((a, b) => (b.concluidaEm ?? '').localeCompare(a.concluidaEm ?? '')).slice(0, 50),
    [tarefas],
  );

  const excluir = async (id: string) => {
    if (await confirmar({ titulo: 'Excluir esta tarefa?', confirmarLabel: 'Excluir', perigo: true })) {
      await excluirTarefa(id);
      toast('Tarefa excluída', { tipo: 'info' });
    }
  };

  const lista = aba === 'hoje' ? d.tarefasHoje : aba === 'atrasados' ? d.tarefasAtrasadas : aba === 'semana' ? semana : concluidas;

  // agrupar por dia na visão semanal
  const grupos = useMemo(() => {
    if (aba !== 'semana') return null;
    const m = new Map<string, typeof semana>();
    for (const t of semana) {
      const k = toInputDate(t.dataHora);
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m.entries()];
  }, [aba, semana]);

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6">
      <PageHeader
        titulo="Agenda"
        subtitulo="Retornos, reuniões e tarefas"
        acoes={
          <Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => setNova(true)}>
            Nova tarefa
          </Button>
        }
      />
      <Segmented
        className="no-scrollbar mb-4 flex w-full overflow-x-auto"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { value: 'atrasados', label: 'Atrasados', contador: d.tarefasAtrasadas.length },
          { value: 'hoje', label: 'Hoje', contador: d.tarefasHoje.length },
          { value: 'semana', label: '7 dias', contador: semana.length },
          { value: 'concluidas', label: 'Concluídas' },
        ]}
      />
      <Card>
        {lista.length === 0 ? (
          aba === 'atrasados' ? (
            <EmptyState icone={<CalendarCheck className="h-6 w-6" />} titulo="Nada atrasado 🎉" descricao="Você está em dia com seus retornos." />
          ) : (
            <EmptyState
              icone={<CalendarX className="h-6 w-6" />}
              titulo={aba === 'concluidas' ? 'Nenhuma tarefa concluída ainda' : 'Nada agendado'}
              descricao="Agende retornos direto do popup após cada ligação ou WhatsApp."
              acao={aba !== 'concluidas' && <Button onClick={() => setNova(true)}>Nova tarefa</Button>}
            />
          )
        ) : grupos ? (
          grupos.map(([dia, itens]) => (
            <div key={dia}>
              <p className="border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                {formatDiaSemana(itens[0].dataHora)}
              </p>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {itens.map((t) => (
                  <TaskItem key={t.id} tarefa={t} lead={t.leadId ? d.leadPorId.get(t.leadId) : undefined} onExcluir={() => excluir(t.id)} mostrarData={false} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {lista.map((t) => (
              <TaskItem key={t.id} tarefa={t} lead={t.leadId ? d.leadPorId.get(t.leadId) : undefined} onExcluir={() => excluir(t.id)} mostrarData={aba !== 'hoje'} />
            ))}
          </ul>
        )}
      </Card>
      <NovaTarefaModal aberto={nova} onFechar={() => setNova(false)} />
    </div>
  );
}

function NovaTarefaModal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { leads, criarTarefa } = useData();
  const toast = useToast();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoTarefa>('retorno');
  const [leadNome, setLeadNome] = useState('');
  const [data, setData] = useState(toInputDate(new Date().toISOString()));
  const [hora, setHora] = useState('');

  const salvar = async () => {
    if (!data) return;
    const lead = leads.find((l) => l.nome.toLowerCase() === leadNome.trim().toLowerCase());
    await criarTarefa({
      titulo: titulo.trim() || TIPOS_TAREFA[tipo],
      tipo,
      leadId: lead?.id,
      dataHora: new Date(`${data}T${hora || '09:00'}:00`).toISOString(),
      diaInteiro: !hora,
    });
    toast('Tarefa criada');
    setTitulo('');
    setLeadNome('');
    setHora('');
    onFechar();
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Nova tarefa"
      tamanho="sm"
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar}>Cancelar</Button>
          <Button variante="primario" onClick={salvar}>Salvar</Button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => (e.preventDefault(), salvar())}>
        <Field label="Lead (opcional)" className="col-span-2">
          <Input list="lista-leads" value={leadNome} onChange={(e) => setLeadNome(e.target.value)} placeholder="Digite o nome…" />
          <datalist id="lista-leads">
            {leads.map((l) => (
              <option key={l.id} value={l.nome} />
            ))}
          </datalist>
        </Field>
        <Field label="Descrição" className="col-span-2">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Retornar sobre a proposta" />
        </Field>
        <Field label="Tipo" className="col-span-2">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarefa)} opcoes={opcoes(TIPOS_TAREFA)} />
        </Field>
        <Field label="Data">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Hora (opcional)">
          <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
