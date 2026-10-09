import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_VAPID_PUBLIC_KEY = 'BMRNMFiG_3S0Qs85Lz2PofYfTIeHcmXeMF1jF77ZoHCIUMKntke9iFPc0wTG2-574IEj20Zkvm998k3-kTEb6Lo';

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  return NextResponse.json({
    success: true,
    publicKey
  });
}
