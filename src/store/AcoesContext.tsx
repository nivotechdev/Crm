import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Canal, Lead, NovoLeadInput } from '../types';
import { useData } from './DataContext';
import { useToast } from './ToastContext';
import { abrirWhatsApp } from '../lib/whatsapp';
import { etapaPorId } from '../lib/etapas';
import { primeiroNome } from '../lib/format';
import { ContactOutcomeSheet, type ContatoEmAberto } from '../components/leads/ContactOutcomeSheet';
import { NewLeadModal } from '../components/leads/NewLeadModal';
import { LostReasonModal } from '../components/leads/LostReasonModal';
import { WonModal } from '../components/leads/WonModal';
import { ConfirmDialog, type ConfirmOpts } from '../components/ui/ConfirmDialog';

interface Acoes {
  /** 1 clique: registra o contato (e abre o WhatsApp se for o caso) + mini-popup opcional. */
  contatoRapido(lead: Lead, canal: Canal, opts?: { abrir?: boolean; texto?: string }): void;
  abrirNovoLead(prefill?: Partial<NovoLeadInput>): void;
  /** Move de etapa tratando "Perdido" (pede motivo) e "Ganho" (converte em cliente). */
  pedirMoverEtapa(lead: Lead, etapaId: string): void;
  confirmar(opts: ConfirmOpts): Promise<boolean>;
  buscaAberta: boolean;
  setBuscaAberta(v: boolean): void;
  atalhosAbertos: boolean;
  setAtalhosAbertos(v: boolean): void;
}

const AcoesCtx = createContext<Acoes | null>(null);

export function AcoesProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const toast = useToast();
  const [contato, setContato] = useState<ContatoEmAberto | null>(null);
  const [novoLead, setNovoLead] = useState<{ prefill?: Partial<NovoLeadInput> } | null>(null);
  const [perda, setPerda] = useState<Lead | null>(null);
  const [ganho, setGanho] = useState<Lead | null>(null);
  const [confirm, setConfirm] = useState<(ConfirmOpts & { resolve: (b: boolean) => void }) | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [atalhosAbertos, setAtalhosAbertos] = useState(false);

  const dataRef = useRef(data);
  dataRef.current = data;

  // Fecha o mini-popup ao trocar de tela (exceto indo para a ficha do mesmo lead)
  const { pathname } = useLocation();
  const rotaInicial = useRef(pathname);
  useEffect(() => {
    if (!contato) return;
    if (pathname !== rotaInicial.current && pathname !== `/leads/${contato.lead.id}`) setContato(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  useEffect(() => {
    rotaInicial.current = pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contato?.contatoId]);

  const contatoRapido = useCallback<Acoes['contatoRapido']>(
    (lead, canal, opts) => {
      // Precisa ser síncrono no clique para não ser bloqueado como pop-up
      if (canal === 'whatsapp' && opts?.abrir !== false) abrirWhatsApp(lead.telefone, opts?.texto);
      const d = dataRef.current;
      d.registrarContato(lead.id, canal)
        .then(({ contatoId, etapaAvancada, retornosConcluidos }) => {
          setContato({ contatoId, lead, canal, registradoEm: new Date().toISOString() });
          const extras = [
            etapaAvancada && 'movido para a próxima etapa',
            retornosConcluidos > 0 && 'retorno concluído',
          ].filter(Boolean);
          toast(
            `${canal === 'ligacao' ? 'Ligação' : 'WhatsApp'} registrado · ${primeiroNome(lead.nome)}${extras.length ? ` (${extras.join(', ')})` : ''}`,
            {
              acao: {
                label: 'Desfazer',
                onClick: () => {
                  dataRef.current.desfazerContato(contatoId).then(() => toast('Contato desfeito', { tipo: 'info' }));
                  setContato((c) => (c?.contatoId === contatoId ? null : c));
                },
              },
            },
          );
        })
        .catch((e: Error) => toast(e.message, { tipo: 'erro' }));
    },
    [toast],
  );

  const pedirMoverEtapa = useCallback<Acoes['pedirMoverEtapa']>(
    (lead, etapaId) => {
      if (lead.etapaId === etapaId) return;
      const d = dataRef.current;
      const etapa = etapaPorId(d.config, etapaId);
      if (etapa?.tipo === 'perdido') return setPerda(lead);
      if (etapa?.tipo === 'ganho') return setGanho(lead);
      const anterior = lead.etapaId;
      d.moverEtapa(lead.id, etapaId).then(() =>
        toast(`${primeiroNome(lead.nome)} → ${etapa?.nome ?? 'etapa'}`, {
          acao: { label: 'Desfazer', onClick: () => dataRef.current.moverEtapa(lead.id, anterior) },
        }),
      );
    },
    [toast],
  );

  const confirmar = useCallback<Acoes['confirmar']>(
    (opts) => new Promise<boolean>((resolve) => setConfirm({ ...opts, resolve })),
    [],
  );

  const value = useMemo<Acoes>(
    () => ({
      contatoRapido,
      abrirNovoLead: (prefill) => setNovoLead({ prefill }),
      pedirMoverEtapa,
      confirmar,
      buscaAberta,
      setBuscaAberta,
      atalhosAbertos,
      setAtalhosAbertos,
    }),
    [contatoRapido, pedirMoverEtapa, confirmar, buscaAberta, atalhosAbertos],
  );

  return (
    <AcoesCtx.Provider value={value}>
      {children}
      {contato && <ContactOutcomeSheet key={contato.contatoId} contato={contato} onFechar={() => setContato(null)} />}
      <NewLeadModal aberto={!!novoLead} prefill={novoLead?.prefill} onFechar={() => setNovoLead(null)} />
      <LostReasonModal lead={perda} onFechar={() => setPerda(null)} />
      <WonModal lead={ganho} onFechar={() => setGanho(null)} />
      <ConfirmDialog
        opts={confirm}
        onResolver={(ok) => {
          confirm?.resolve(ok);
          setConfirm(null);
        }}
      />
    </AcoesCtx.Provider>
  );
}

export function useAcoes() {
  const ctx = useContext(AcoesCtx);
  if (!ctx) throw new Error('useAcoes fora do AcoesProvider');
  return ctx;
}
