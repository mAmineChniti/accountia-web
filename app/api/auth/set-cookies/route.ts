import { NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/actions';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // delegate to helper defined in actions.ts
    await setAuthCookies(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
