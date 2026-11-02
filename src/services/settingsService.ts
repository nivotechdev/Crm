import type { Configuracoes } from '../types';
import { CONFIG_PADRAO } from './defaults';
import { db } from './storage';

export const settingsService = {
  obter(): Promise<Configuracoes> {
    return db.lerConfig(CONFIG_PADRAO);
  },
  salvar(cfg: Configuracoes): Promise<Configuracoes> {
    return db.gravarConfig(cfg);
  },
};
