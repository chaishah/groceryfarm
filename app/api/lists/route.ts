import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

function generateToken(): string {
  // 16 hex chars = 64 bits of randomness
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const share_token = generateToken();

  const { data, error } = await supabase
    .from('lists')
    .insert({ name, share_token })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
