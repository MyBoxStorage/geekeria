/**
 * Security utilities for admin hardening.
 */

/**
 * Introduce a random delay (250–750 ms) before responding to an invalid
 * admin token attempt.  This makes brute-force and timing-oracle attacks
 * significantly harder without impacting legitimate admin usage.
 */
export function adminAuthPenaltyDelay(): Promise<void> {
  const ms = 250 + Math.floor(Math.random() * 501); // 250..750
  return new Promise((resolve) => setTimeout(resolve, ms));
}
