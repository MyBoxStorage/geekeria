/**
 * Configuração da API Backend
 *
 * Resolução de URL:
 * 1. Se VITE_API_URL estiver definida (ex: em .env.production), usa ela.
 * 2. Senão, em DEV → backend local (localhost:3000).
 * 3. Senão, em PROD → backend Fly.
 */

const ENV_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

const DEV_BACKEND_URL = 'http://localhost:3000';
const PROD_FALLBACK_URL = 'https://bravosbackend.fly.dev';

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const API_URL: string = ENV_URL
  ? ENV_URL
  : IS_DEV
    ? DEV_BACKEND_URL
    : PROD_FALLBACK_URL;

/** Alias para compatibilidade — todos os arquivos que usam apiConfig.baseURL continuam funcionando */
export const apiConfig = { baseURL: API_URL } as const;
