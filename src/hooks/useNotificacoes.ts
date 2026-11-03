import { useCallback, useMemo, useState } from 'react';
import { useData } from '../store/DataContext';
import { useNow } from '../store/NowContext';
import { useDerivados } from './useDerivados';
import { diffDiasCalendario, formatHora, tempoRelativoAgenda, toInputDate } from '../lib/dates';
import { TIPOS_TAREFA } from '../lib/labels';
import { prefs } from '../services/storage';

export interface Notificacao {
  id: string;
  tipo: 'atrasada' | 'hoje' | 'assembleia';
  titulo: string;
  detalhe: string;
  path: string;
}

const CHAVE = 'notificacoes:lidas';

/**
 * Avisos gerados a partir dos dados (não há servidor de notificações ainda):
 * compromissos atrasados, compromissos de hoje e assembleias nos próximos 7 dias.
 * O que já foi lido fica guardado só neste navegador.
 */
export function useNotificacoes() {
  const { clientes } = useData();
  const d = useDerivados();
  const now = useNow();
  const [lidas, setLidas] = useState<string[]>(() => prefs.get<string[]>(CHAVE, []));

  const itens = useMemo<Notificacao[]>(() => {
    const nome = (id?: string) => (id ? d.leadPorId.get(id)?.nome : undefined);
    const lista: Notificacao[] = [];
    for (const t of d.tarefasAtrasadas) {
      lista.push({
        id: `atrasada:${t.id}`,
        tipo: 'atrasada',
        titulo: `${TIPOS_TAREFA[t.tipo]} atrasado${t.tipo === 'reuniao' || t.tipo === 'tarefa' || t.tipo === 'assembleia' || t.tipo === 'indicacao' ? 'a' : ''}${nome(t.leadId) ? ` · ${nome(t.leadId)}` : ''}`,
        detalhe: `${tempoRelativoAgenda(t.dataHora, now)} · ${t.titulo}`,
        path: t.leadId ? `/leads/${t.leadId}` : '/agenda',
      });
    }
    for (const t of d.tarefasHoje) {
      lista.push({
        id: `hoje:${t.id}:${toInputDate(t.dataHora)}`,
        tipo: 'hoje',
        titulo: `${TIPOS_TAREFA[t.tipo]} hoje${t.diaInteiro ? '' : ` às ${formatHora(t.dataHora)}`}${nome(t.leadId) ? ` · ${nome(t.leadId)}` : ''}`,
        detalhe: t.titulo,
        path: t.leadId ? `/leads/${t.leadId}` : '/agenda',
      });
    }
    for (const c of clientes) {
      if (c.status !== 'ativo' || !c.proximaAssembleia) continue;
      const dias = -diffDiasCalendario(c.proximaAssembleia, now);
      if (dias < 0 || dias > 7) continue;
      lista.push({
        id: `assembleia:${c.id}:${toInputDate(c.proximaAssembleia)}`,
        tipo: 'assembleia',
        titulo: `Assembleia ${tempoRelativoAgenda(c.proximaAssembleia, now).toLowerCase()} · ${c.nome}`,
        detalhe: `Grupo ${c.grupo ?? '—'}${c.pretendeLance === 'sim' ? ' · pretende dar lance' : ''}`,
        path: `/clientes?id=${c.id}`,
      });
    }
    return lista;
  }, [d, clientes, now]);

  const lidasSet = useMemo(() => new Set(lidas), [lidas]);
  const naoLidas = itens.filter((n) => !lidasSet.has(n.id)).length;

  const salvar = useCallback((novas: string[]) => {
    setLidas(novas);
    prefs.set(CHAVE, novas.slice(-300));
  }, []);

  const marcarLida = useCallback((id: string) => !lidasSet.has(id) && salvar([...lidas, id]), [lidas, lidasSet, salvar]);
  const marcarTodas = useCallback(() => salvar([...new Set([...lidas, ...itens.map((n) => n.id)])]), [lidas, itens, salvar]);

  return { itens, naoLidas, isLida: (id: string) => lidasSet.has(id), marcarLida, marcarTodas };
}
