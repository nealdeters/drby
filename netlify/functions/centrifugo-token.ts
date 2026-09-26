import { Handler, HandlerEvent } from '@netlify/functions';
import crypto from 'node:crypto';

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function mintToken(secret: string, raceId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64Url({
    sub: `drby-spectator-${crypto.randomUUID()}`,
    iat: now,
    exp: now + 180,
    channels: [`house:race:${raceId}`],
  });
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const raceId = event.queryStringParameters?.raceId?.trim() || '';
  const secret = process.env.CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY || process.env.CENTRIFUGO_TOKEN_SECRET || '';
  if (!raceId || !/^[A-Za-z0-9._:-]{1,120}$/.test(raceId)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid raceId' }) };
  }
  if (!secret) {
    return { statusCode: 503, body: JSON.stringify({ error: 'House bus token signing is not configured' }) };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ token: mintToken(secret, raceId), ttlSec: 180 }),
  };
};
