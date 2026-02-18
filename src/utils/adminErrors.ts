/**
 * Pure utility for admin error messages and status checks.
 * No side effects — callers handle token clearing themselves.
 */

/** Return a safe, user-facing error message based on HTTP status. */
export function getAdminErrorMessage(status?: number): string {
  if (!status) return 'Erro de conexão. Verifique sua internet e tente novamente.';
  if (status === 401 || status === 403) return 'Sessão expirada. Faça login novamente.';
  if (status === 429) return 'Muitas requisições. Aguarde 1 minuto e tente novamente.';
  if (status === 503) return 'Serviço temporariamente indisponível. Tente mais tarde.';
  if (status >= 500) return 'Erro interno. Tente novamente.';
  if (status === 400) return 'Dados inválidos. Verifique e tente novamente.';
  if (status === 404) return 'Recurso não encontrado.';
  return 'Erro inesperado. Tente novamente.';
}

/** Check if the error status means the admin session is invalid. */
export function isAdminAuthError(status?: number): boolean {
  return status === 401 || status === 403;
}

export interface AdminApiErrorResult {
  message: string;
  shouldClearToken: boolean;
  status?: number;
}

/**
 * Extract status from a thrown error object and return a safe message
 * plus a flag indicating whether the admin token should be cleared.
 * Pure function — does NOT clear the token itself.
 */
export function handleAdminApiError(error: unknown): AdminApiErrorResult {
  const status =
    error && typeof error === 'object' && 'status' in error
      ? (error as { status?: number }).status
      : undefined;

  return {
    message: getAdminErrorMessage(status),
    shouldClearToken: isAdminAuthError(status),
    status,
  };
}
