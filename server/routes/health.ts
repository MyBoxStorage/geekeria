import { Request, Response } from 'express';

export async function healthCheck(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GEEKERIA API',
    buildSha: process.env.BUILD_SHA ?? null,
  });
}
