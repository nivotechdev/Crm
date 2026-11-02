import { useEffect, useRef } from 'react';

type Mapa = Record<string, (e: KeyboardEvent) => void>;

export function isDigitando(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Atalhos simples. Teclas: "n", "/", "mod+k", "g d" (sequência), "shift+?".
 * Ignora quando o foco está em um campo de texto (exceto "mod+..." e "escape").
 */
export function useHotkeys(mapa: Mapa, ativo = true) {
  const ref = useRef(mapa);
  ref.current = mapa;
  const anterior = useRef<{ tecla: string; t: number } | null>(null);

  useEffect(() => {
    if (!ativo) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const combos: string[] = [];
      if (mod) combos.push(`mod+${k}`);
      if (k === 'escape') combos.push('escape');
      const digitando = isDigitando(e);
      if (!mod && !digitando && !e.altKey) {
        const prev = anterior.current;
        if (prev && Date.now() - prev.t < 1000) combos.push(`${prev.tecla} ${k}`);
        if (e.shiftKey) combos.push(`shift+${k}`);
        combos.push(k);
      }
      for (const c of combos) {
        const fn = ref.current[c];
        if (fn) {
          if (digitando && !c.startsWith('mod+') && c !== 'escape') continue;
          e.preventDefault();
          fn(e);
          anterior.current = null;
          return;
        }
      }
      if (!mod && !digitando) anterior.current = { tecla: k, t: Date.now() };
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ativo]);
}
