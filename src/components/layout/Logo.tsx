import { cn } from '../../lib/cn';

/** Marca: dois arcos (cotas do grupo) num quadrado laranja. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white', className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 15a7 7 0 0 1 14 0" />
        <path d="M9 15a3 3 0 0 1 6 0" />
        <circle cx="12" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
