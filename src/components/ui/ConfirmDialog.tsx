import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmOpts {
  titulo: string;
  mensagem?: string;
  confirmarLabel?: string;
  perigo?: boolean;
}

/** Usado apenas para ações destrutivas. */
export function ConfirmDialog({ opts, onResolver }: { opts: ConfirmOpts | null; onResolver: (ok: boolean) => void }) {
  return (
    <Modal
      aberto={!!opts}
      onFechar={() => onResolver(false)}
      tamanho="sm"
      rodape={
        <>
          <Button variante="fantasma" onClick={() => onResolver(false)}>
            Cancelar
          </Button>
          <Button data-autofocus variante={opts?.perigo ? 'perigo' : 'primario'} onClick={() => onResolver(true)}>
            {opts?.confirmarLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 pt-2">
        {opts?.perigo && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">{opts?.titulo}</h2>
          {opts?.mensagem && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{opts.mensagem}</p>}
        </div>
      </div>
    </Modal>
  );
}
