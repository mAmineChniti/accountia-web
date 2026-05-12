import { NextResponse } from 'next/server';

const logPrefix = '[alertmanager webhook]';

/**
 * Alertmanager notifies this URL — same contract as Nest `AlertsController.receiveAlert`.
 */
export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  try {
    const payload: unknown = raw ? JSON.parse(raw) : {};
    console.warn(`${logPrefix} ${JSON.stringify(payload)}`);
  } catch {
    console.warn(`${logPrefix} (non-JSON body) ${raw.slice(0, 2000)}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
