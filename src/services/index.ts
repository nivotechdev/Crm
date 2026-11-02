/** Ponto único de acesso à camada de dados. */
export { leadService } from './leadService';
export { contactService } from './contactService';
export { taskService } from './taskService';
export { clientService } from './clientService';
export { simulationService, calcularParcela } from './simulationService';
export { settingsService } from './settingsService';
export { inicializarSeNecessario, restaurarExemplo, apagarTudo, exportarTudo } from './seed';
export { CONFIG_PADRAO } from './defaults';
