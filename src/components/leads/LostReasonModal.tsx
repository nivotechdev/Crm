import { useEffect, useState } from 'react';
import type { Lead, MotivoPerda } from '../../types';
import { useData } from '../../store/DataContext';
import { useToast } from '../../store/ToastContext';
import { MOTIVOS_PERDA, opcoes } from '../../lib/labels';
import { etapaPerdido } from '../../lib/etapas';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Field';
import { Modal } from '../ui/Modal';

export function LostReasonModal({ lead, onFechar }: { lead: Lead | null; onFechar: () => void }) {
  const { moverEtapa, config } = useData();
  const toast = useToast();
  const [motivo, setMotivo] = useState<MotivoPerda | null>(null);
  const [detalhe, setDetalhe] = useState('');

  useEffect(() => {
    setMotivo(null);
    setDetalhe('');
  }, [lead]);

  const confirmar = async () => {
    if (!lead || !motivo) return;
    const anterior = lead.etapaId;
    await moverEtapa(lead.id, etapaPerdido(config).id, { motivoPerda: motivo, motivoPerdaDetalhe: detalhe || undefined });
    toast(`${lead.nome} marcado como perdido`, {
      tipo: 'info',
      acao: { label: 'Desfazer', onClick: () => moverEtapa(lead.id, anterior) },
    });
    onFechar();
  };

  return (
    <Modal
      aberto={!!lead}
      onFechar={onFechar}
      titulo="Marcar como perdido"
      subtitulo={lead?.nome}
      tamanho="sm"
      rodape={
        <>
          <Button variante="fantasma" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variante="perigo" disabled={!motivo} onClick={confirmar}>
            Marcar como perdido
          </Button>
        </>
      }
    >
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Qual foi o motivo?</p>
      <div className="grid gap-1.5">
        {opcoes(MOTIVOS_PERDA).map((o, i) => (
          <button
            key={o.value}
            data-autofocus={i === 0 ? true : undefined}
            onClick={() => setMotivo(o.value)}
            aria-pressed={motivo === o.value}
            className={cn(
              'rounded-lg px-3 py-2.5 text-left text-sm font-medium ring-1 ring-inset transition-colors',
              motivo === o.value
                ? 'bg-red-50 text-red-800 ring-red-300 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/40'
                : 'text-slate-700 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        rows={2}
        value={detalhe}
        onChange={(e) => setDetalhe(e.target.value)}
        placeholder={motivo === 'outro' ? 'Descreva o motivo…' : 'Detalhe (opcional)'}
      />
    </Modal>
  );
}
