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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>(lerTema);
  const [sistemaEscuro, setSistemaEscuro] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = (e: MediaQueryListEvent) => setSistemaEscuro(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const escuro = tema === 'escuro' || (tema === 'sistema' && sistemaEscuro);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', escuro);
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
