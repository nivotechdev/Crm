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
      <div className="absolute inset-0 animate-fade-in bg-slate-950/40 backdrop-blur-sm" onClick={onFechar} />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-[28px] bg-white shadow-pop outline-none dark:bg-slate-900 sm:rounded-[28px]',
          tamanho === 'sm' && 'sm:max-w-md',
          tamanho === 'md' && 'sm:max-w-lg',
          tamanho === 'lg' && 'sm:max-w-2xl',
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" aria-hidden />
        {(titulo || subtitulo) && (
          <div className="flex items-start gap-3 px-6 pb-2 pt-4 sm:pt-6">
            <div className="min-w-0 flex-1">
              {titulo && <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{titulo}</h2>}
              {subtitulo && <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitulo}</div>}
            </div>
            <button
              onClick={onFechar}
              aria-label="Fechar"
              className="-mr-2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {rodape && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
