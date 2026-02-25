import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

async function getListId(token: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('lists')
    .select('id')
    .eq('share_token', token)
    .single();
  return data?.id ?? null;
}

// POST /api/lists/[token]/items — add item
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const listId = await getListId(params.token);
  if (!listId) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const body = await request.json();
  const name = body?.name?.trim();
  const qty = body?.qty?.trim() || null;
  const unit = body?.unit?.trim() || null;
  const price = body?.price != null && body.price !== '' ? parseFloat(body.price) : null;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = createServiceClient();

  // Get current max sort_order
  const { data: maxItem } = await supabase
    .from('items')
    .select('sort_order')
    .eq('list_id', listId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxItem?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('items')
    .insert({ list_id: listId, name, qty, unit, price, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/lists/[token]/items — clear all bought items
export async function DELETE(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const listId = await getListId(params.token);
  if (!listId) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('list_id', listId)
    .eq('bought', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
