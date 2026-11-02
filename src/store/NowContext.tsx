import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Relógio global: re-renderiza datas relativas ("Há 3 dias") a cada 30s. */
const NowCtx = createContext<Date>(new Date());

export function NowProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return <NowCtx.Provider value={now}>{children}</NowCtx.Provider>;
}

export const useNow = () => useContext(NowCtx);
