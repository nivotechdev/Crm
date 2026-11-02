import { useMemo } from 'react';
import type { Lead, Tarefa } from '../types';
import { useData } from '../store/DataContext';
import { useNow } from '../store/NowContext';
import { endOfDay, isSameDay, startOfDay } from '../lib/dates';
import { contactService } from '../services/contactService';

/** Dados derivados usados em várias telas (contadores do dia, próximos passos...). */
export function useDerivados() {
  const { leads, atividades, tarefas, config } = useData();
  const now = useNow();
  const hojeKey = startOfDay(now).getTime();

  return useMemo(() => {
    const tiposAtivos = new Set(config.etapas.filter((e) => e.tipo === 'aberta').map((e) => e.id));
    const conhecidas = new Set(config.etapas.map((e) => e.id));
    const isAtivo = (l: Lead) => tiposAtivos.has(l.etapaId) || !conhecidas.has(l.etapaId);
    const leadsAtivos = leads.filter(isAtivo);

    // Contatos de hoje
    const contatosHoje = atividades.filter((a) => contactService.isContato(a) && isSameDay(a.criadoEm, now));
    const ligacoesHoje = contatosHoje.filter((a) => a.tipo === 'ligacao').length;
    const whatsappsHoje = contatosHoje.filter((a) => a.tipo === 'whatsapp').length;
    const idsContatadosHoje = new Set(contatosHoje.map((a) => a.leadId));
    const ativosContatadosHoje = leadsAtivos.filter((l) => idsContatadosHoje.has(l.id)).length;

    // Próxima tarefa pendente por lead
    const pendentes = tarefas.filter((t) => !t.concluida).sort((a, b) => a.dataHora.localeCompare(b.dataHora));
    const proximaTarefaPorLead = new Map<string, Tarefa>();
    for (const t of pendentes) if (t.leadId && !proximaTarefaPorLead.has(t.leadId)) proximaTarefaPorLead.set(t.leadId, t);

    const fimHoje = endOfDay(now).toISOString();
    const inicioHoje = startOfDay(now).toISOString();
    const retornoHojeIds = new Set(
      pendentes.filter((t) => t.leadId && t.dataHora <= fimHoje && t.dataHora >= inicioHoje).map((t) => t.leadId!),
    );
    const tarefasAtrasadas = pendentes.filter((t) => t.dataHora < inicioHoje);
    const tarefasHoje = pendentes.filter((t) => t.dataHora >= inicioHoje && t.dataHora <= fimHoje);

    const leadPorId = new Map(leads.map((l) => [l.id, l]));

    return {
      leadsAtivos,
      isAtivo,
      leadPorId,
      ligacoesHoje,
      whatsappsHoje,
      contatosHojeTotal: contatosHoje.length,
      ativosContatadosHoje,
      idsContatadosHoje,
      proximaTarefaPorLead,
      retornoHojeIds,
      tarefasAtrasadas,
      tarefasHoje,
      pendentes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, atividades, tarefas, config, hojeKey]);
}
