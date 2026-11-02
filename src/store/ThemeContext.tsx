import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Tema = 'claro' | 'escuro' | 'sistema';
const KEY = 'crm-consorcio:tema';

const ThemeCtx = createContext<{ tema: Tema; setTema: (t: Tema) => void; escuro: boolean }>({
  tema: 'sistema',
  setTema: () => {},
  escuro: false,
});

function lerTema(): Tema {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'claro' || t === 'escuro' ? t : 'sistema';
  } catch {
    return 'sistema';
  }
}

/** Tema do sistema: atributo data-theme do host (se houver) ou prefers-color-scheme. */
function sistemaEstaEscuro(): boolean {
  const dt = document.documentElement.getAttribute('data-theme');
  if (dt === 'dark') return true;
  if (dt === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(lerTema);
  const [sistemaEscuro, setSistemaEscuro] = useState(sistemaEstaEscuro);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = () => setSistemaEscuro(sistemaEstaEscuro());
    mq.addEventListener('change', fn);
    const obs = new MutationObserver(fn);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', fn);
      obs.disconnect();
    };
  }, []);

  const escuro = tema === 'escuro' || (tema === 'sistema' && sistemaEscuro);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', escuro);
    document.documentElement.classList.toggle('light', !escuro);
  }, [escuro]);

  const setTema = (t: Tema) => {
    setTemaState(t);
    try {
      if (t === 'sistema') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
  };

  return <ThemeCtx.Provider value={{ tema, setTema, escuro }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
