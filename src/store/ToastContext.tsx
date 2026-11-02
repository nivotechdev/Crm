import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/cn';

type TipoToast = 'sucesso' | 'erro' | 'info';
interface Toast {
  id: number;
  mensagem: string;
  tipo: TipoToast;
  acao?: { label: string; onClick: () => void };
}
type ToastFn = (mensagem: string, opts?: { tipo?: TipoToast; acao?: Toast['acao']; duracao?: number }) => void;

const ToastCtx = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const fechar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastFn>(
    (mensagem, opts) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, mensagem, tipo: opts?.tipo ?? 'sucesso', acao: opts?.acao }]);
      setTimeout(() => fechar(id), opts?.duracao ?? (opts?.acao ? 5000 : 2600));
    },
    [fechar],
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-3 md:bottom-6 md:top-auto md:pl-60"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-2xl bg-slate-900 py-3 pl-4 pr-2 text-[13px] font-medium text-white shadow-pop dark:bg-slate-800"
          >
            {t.tipo === 'sucesso' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
            {t.tipo === 'erro' && <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
            {t.tipo === 'info' && <Info className="h-5 w-5 shrink-0 text-slate-400" />}
            <span className="flex-1">{t.mensagem}</span>
            {t.acao && (
              <button
                className="rounded-full px-3 py-1 font-semibold text-brand-300 hover:bg-white/10"
                onClick={() => {
                  t.acao!.onClick();
                  fechar(t.id);
                }}
              >
                {t.acao.label}
              </button>
            )}
            <button aria-label="Fechar aviso" className={cn('rounded p-1 text-slate-400 hover:text-white')} onClick={() => fechar(t.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
