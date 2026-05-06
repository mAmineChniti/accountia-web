import { describe, expect, it } from 'vitest';

import { POST as alertsPOST } from '@/app/api/alerts/route';
import { GET as metricsGET } from '@/app/api/metrics/route';

describe('/api/alerts route', () => {
  it('accepts JSON payloads and returns {received:true}', async () => {
    const req = new Request('http://test/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alert: 'x' }),
    });

    const res = await alertsPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it('accepts non-JSON payloads and still returns {received:true}', async () => {
    const req = new Request('http://test/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not json',
    });

    const res = await alertsPOST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});

describe('/api/metrics route', () => {
  it('returns prometheus metrics text', async () => {
    const res = await metricsGET();
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType).toContain('text/plain');

    const body = await res.text();
    expect(body).toContain('#');
  });
});
