import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('share_token', params.token)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', list.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ list, items: items ?? [] });
}
