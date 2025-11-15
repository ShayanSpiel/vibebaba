import { type NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.cookies.get('pb_auth')?.value;

    if (!authHeader) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Try to load auth from cookie/header
    const authData = JSON.parse(authHeader);
    pb.authStore.save(authData.token, authData.model);

    if (!pb.authStore.isValid) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: pb.authStore.model });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
