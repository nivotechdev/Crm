import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
  tamanho?: 'sm' | 'md' | 'lg';
  /** No celular vira "bottom sheet" (padrão). */
  className?: string;
}

/** Modal acessível: centralizado no desktop, bottom sheet no celular. Fecha com Esc e clique fora. */
export function Modal({ aberto, onFechar, titulo, subtitulo, children, rodape, tamanho = 'md', className }: ModalProps) {
  const painel = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        fecharRef.current();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    // foca o primeiro campo, se houver; senão o painel
    requestAnimationFrame(() => {
      const el = painel.current?.querySelector<HTMLElement>('[data-autofocus], input:not([type=hidden]), textarea, select');
      (el ?? painel.current)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-[2px]" onClick={onFechar} />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-slate-900 sm:rounded-2xl',
          tamanho === 'sm' && 'sm:max-w-md',
          tamanho === 'md' && 'sm:max-w-lg',
          tamanho === 'lg' && 'sm:max-w-2xl',
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" aria-hidden />
        {(titulo || subtitulo) && (
          <div className="flex items-start gap-3 border-b border-slate-100 px-5 pb-3 pt-3 dark:border-slate-800 sm:pt-4">
            <div className="min-w-0 flex-1">
              {titulo && <h2 className="text-base font-semibold text-slate-900 dark:text-white">{titulo}</h2>}
              {subtitulo && <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitulo}</div>}
            </div>
            <button
              onClick={onFechar}
              aria-label="Fechar"
              className="-mr-2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-slate-800">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
