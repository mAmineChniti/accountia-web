import { NextResponse } from 'next/server';
import * as client from 'prom-client';

// On utilise le registre par défaut de prom-client
const register = client.register;

export async function GET() {
  try {
    // On lance la collecte si elle n'est pas déjà active
    client.collectDefaultMetrics({ register });

    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    // Si c'est déjà enregistré, on renvoie juste les métriques
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
  }
}
