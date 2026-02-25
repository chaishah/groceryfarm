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

// PATCH /api/lists/[token]/items/[id] — update item (bought, name, qty)
export async function PATCH(
  request: Request,
  { params }: { params: { token: string; id: string } }
) {
  const listId = await getListId(params.token);
  if (!listId) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('items')
    .update(body)
    .eq('id', params.id)
    .eq('list_id', listId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE /api/lists/[token]/items/[id] — delete item
export async function DELETE(
  _request: Request,
  { params }: { params: { token: string; id: string } }
) {
  const listId = await getListId(params.token);
  if (!listId) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', params.id)
    .eq('list_id', listId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
