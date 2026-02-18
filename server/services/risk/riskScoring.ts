/**
 * Simple, explainable risk scoring for orders (MVP).
 * Does NOT block purchases. No PII in reasons. No external APIs.
 */

import type { Request } from 'express';
import type { PrismaClient } from '@prisma/client';
import { resolveClientIp } from '../../utils/rateLimiter.js';

/**
 * Get client IP for DB storage. Delegates to resolveClientIp (which
 * respects Express trust proxy + Fly.io headers), then truncates to 255.
 * Returns null only when resolveClientIp returns 'unknown'.
 */
export function getClientIp(req: Request): string | null {
  const ip = resolveClientIp(req);
  if (ip === 'unknown') return null;
  return truncateForDb(ip);
}

/** Get user-agent, truncated to 255. */
export function getClientUserAgent(req: Request): string | null {
  const ua = req.headers['user-agent'];
  return truncateForDb(ua ?? null);
}

const MAX_STRING_LEN = 255;
const IP_BURST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_FAIL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const IP_BURST_THRESHOLD = 3;
const IP_BURST_POINTS = 2;
const EMAIL_FAIL_THRESHOLD = 2;
const EMAIL_FAIL_POINTS = 2;
const ADDRESS_SANITY_POINTS = 1;
const RISK_FLAG_THRESHOLD = 3;

export interface ComputeOrderRiskInput {
  ipAddress: string | null;
  email: string;
  state: string | null;
  zip: string | null;
  userAgent: string | null;
}

export interface ComputeOrderRiskResult {
  score: number;
  flag: boolean;
  reasons: string[];
}

export async function computeOrderRisk(
  input: ComputeOrderRiskInput,
  prisma: PrismaClient
): Promise<ComputeOrderRiskResult> {
  const reasons: string[] = [];
  let score = 0;

  // 1) Many orders from same IP in last 10 minutes
  if (input.ipAddress && input.ipAddress.trim()) {
    const since = new Date(Date.now() - IP_BURST_WINDOW_MS);
    const count = await prisma.order.count({
      where: {
        ipAddress: input.ipAddress.trim(),
        createdAt: { gte: since },
      },
    });
    if (count >= IP_BURST_THRESHOLD) {
      score += IP_BURST_POINTS;
      reasons.push('IP_BURST_10M');
    }
  }

  // 2) Many failed/canceled orders for same email in last 24h
  const emailSince = new Date(Date.now() - EMAIL_FAIL_WINDOW_MS);
  const failCount = await prisma.order.count({
    where: {
      payerEmail: input.email,
      createdAt: { gte: emailSince },
      OR: [
        { status: { in: ['FAILED', 'CANCELED'] } },
        { mpStatus: { in: ['rejected', 'cancelled'] } },
      ],
    },
  });
  if (failCount >= EMAIL_FAIL_THRESHOLD) {
    score += EMAIL_FAIL_POINTS;
    reasons.push('EMAIL_FAIL_24H');
  }

  // 3) Zip vs state sanity (format only)
  if (input.zip != null && input.zip.trim() !== '' && input.state != null && input.state.trim() !== '') {
    const zip = input.zip.trim();
    const state = input.state.trim();
    if (zip.length < 8 || state.length !== 2) {
      score += ADDRESS_SANITY_POINTS;
      reasons.push('ADDRESS_SANITY');
    }
  }

  const flag = score >= RISK_FLAG_THRESHOLD;

  return {
    score,
    flag,
    reasons,
  };
}

export function truncateForDb(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (s.length <= MAX_STRING_LEN) return s;
  return s.slice(0, MAX_STRING_LEN);
}

// --- Heuristic scoring (sync, no DB, no PII) ---
const SIMPLE_MISSING_IP = 30;
const SIMPLE_MISSING_UA = 20;
const SIMPLE_MISSING_STATE = 15;
const SIMPLE_MISSING_CEP = 10;
const SIMPLE_MISSING_CPF = 15;
const SIMPLE_UA_MIN_LEN = 10;
const SIMPLE_RISK_FLAG_THRESHOLD = 60;
const SIMPLE_SCORE_MAX = 100;

export interface ComputeOrderRiskSimpleInput {
  ipAddress: string | null;
  userAgent: string | null;
  payerCpf?: string | null;
  shippingCep?: string | null;
  shippingState?: string | null;
}

export interface ComputeOrderRiskSimpleResult {
  riskScore: number;
  riskFlag: boolean;
  riskReasons: string | null;
}

/**
 * Deterministic heuristic risk (no DB, no PII). Use in try/catch; on error persist null/false/null.
 */
export function computeOrderRiskSimple(
  input: ComputeOrderRiskSimpleInput
): ComputeOrderRiskSimpleResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.ipAddress == null || String(input.ipAddress).trim() === '') {
    score += SIMPLE_MISSING_IP;
    reasons.push('MISSING_IP');
  }

  const ua = input.userAgent == null ? '' : String(input.userAgent).trim();
  if (ua.length < SIMPLE_UA_MIN_LEN) {
    score += SIMPLE_MISSING_UA;
    reasons.push('MISSING_UA');
  }

  const state = input.shippingState == null ? '' : String(input.shippingState).trim();
  if (state === '') {
    score += SIMPLE_MISSING_STATE;
    reasons.push('MISSING_STATE');
  }

  const cep = input.shippingCep == null ? '' : String(input.shippingCep).trim();
  if (cep === '') {
    score += SIMPLE_MISSING_CEP;
    reasons.push('MISSING_CEP');
  }

  const cpf = input.payerCpf == null ? '' : String(input.payerCpf).trim();
  if (cpf === '') {
    score += SIMPLE_MISSING_CPF;
    reasons.push('MISSING_CPF');
  }

  const riskScore = Math.min(SIMPLE_SCORE_MAX, Math.max(0, Math.round(score)));
  const riskFlag = riskScore >= SIMPLE_RISK_FLAG_THRESHOLD;

  return {
    riskScore,
    riskFlag,
    riskReasons: reasons.length > 0 ? reasons.join(';') : null,
  };
}
