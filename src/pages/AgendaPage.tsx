import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarX, Plus } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useAcoes } from '../store/AcoesContext';
import { useToast } from '../store/ToastContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from '../hooks/useDerivados';
import { addDays, endOfDay, formatDiaSemana, startOfDay, toInputDate } from '../lib/dates';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Segmented } from '../components/ui/Segmented';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskItem } from '../components/agenda/TaskItem';

type Aba = 'hoje' | 'atrasados' | 'semana';

export default function AgendaPage() {
  const { excluirTarefa } = useData();
  const { confirmar, abrirAgendamento } = useAcoes();
  const toast = useToast();
  const now = useNow();
  const d = useDerivados();
  const [aba, setAba] = useState<Aba>(() => (d.tarefasAtrasadas.length > 0 && d.tarefasHoje.length === 0 ? 'atrasados' : 'hoje'));

  const fimSemana = endOfDay(addDays(now, 6)).toISOString();
  const inicioHoje = startOfDay(now).toISOString();
  const semana = useMemo(() => d.pendentes.filter((t) => t.dataHora >= inicioHoje && t.dataHora <= fimSemana), [d.pendentes, inicioHoje, fimSemana]);

  const excluir = async (id: string) => {
    if (await confirmar({ titulo: 'Excluir este compromisso?', confirmarLabel: 'Excluir', perigo: true })) {
      await excluirTarefa(id);
      toast('Tarefa excluída', { tipo: 'info' });
    }
  };

  const lista = aba === 'hoje' ? d.tarefasHoje : aba === 'atrasados' ? d.tarefasAtrasadas : semana;

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
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        titulo="Agenda"
        subtitulo="Retornos, reuniões e tarefas"
        acoes={
          <Button variante="primario" icone={<Plus className="h-4 w-4" />} onClick={() => abrirAgendamento({ tipo: 'reuniao' })}>
            Nova reunião
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
        ]}
      />
      <Card>
        {lista.length === 0 ? (
          aba === 'atrasados' ? (
            <EmptyState icone={<CalendarCheck className="h-6 w-6" />} titulo="Nada atrasado 🎉" descricao="Você está em dia com seus retornos." />
          ) : (
            <EmptyState
              icone={<CalendarX className="h-6 w-6" />}
              titulo="Nada agendado"
              descricao="Agende reuniões pelo botão de calendário no card do lead, ou retornos pelo popup após cada contato."
              acao={<Button onClick={() => abrirAgendamento({ tipo: 'reuniao' })}>Agendar reunião</Button>}
            />
          )
        ) : grupos ? (
          grupos.map(([dia, itens]) => (
            <div key={dia}>
              <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
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
    </div>
  );
}
