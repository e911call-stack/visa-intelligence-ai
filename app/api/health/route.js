// app/api/health/route.js
// GET /api/health — Public health check, no auth required

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'visa-intelligence',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
