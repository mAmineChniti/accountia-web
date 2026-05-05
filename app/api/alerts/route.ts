import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => {});

  console.log('Alertmanager webhook received:', JSON.stringify(payload));

  return NextResponse.json({ received: true });
}
