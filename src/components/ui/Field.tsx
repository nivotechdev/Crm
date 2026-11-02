import {
  cloneElement, forwardRef, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

export const inputBase =
  'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

export function Label({ children, htmlFor, obrigatorio }: { children: ReactNode; htmlFor?: string; obrigatorio?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
      {children}
      {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(inputBase, 'h-11', className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...p },
  ref,
) {
  return <textarea ref={ref} className={cn(inputBase, 'min-h-[72px] resize-y', className)} {...p} />;
});

export function Select({
  className,
  opcoes,
  vazio,
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { opcoes: Array<{ value: string; label: string }>; vazio?: string }) {
  return (
    <select className={cn(inputBase, 'h-11 pr-9', className)} {...p}>
      {vazio !== undefined && <option value="">{vazio}</option>}
      {opcoes.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Field({
  label,
  obrigatorio,
  children,
  dica,
  className,
}: {
  label: string;
  obrigatorio?: boolean;
  children: ReactNode;
  dica?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  // Liga o <label> ao primeiro elemento filho (acessibilidade / leitores de tela)
  let id: string | undefined;
  const filhos = Array.isArray(children) ? children : [children];
  const conteudo = filhos.map((c, i) => {
    if (i === 0 && isValidElement(c)) {
      const el = c as ReactElement<{ id?: string }>;
      id = el.props.id ?? autoId;
      return cloneElement(el, { id, key: i });
    }
    return c;
  });
  return (
    <div className={className}>
      <Label htmlFor={id} obrigatorio={obrigatorio}>
        {label}
      </Label>
      {conteudo}
      {dica && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dica}</p>}
    </div>
  );
}
