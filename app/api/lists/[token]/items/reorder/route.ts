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

// PATCH /api/lists/[token]/items/reorder — update sort_order for all items
export async function PATCH(
  request: Request,
  { params }: { params: { token: string } }
) {
  const listId = await getListId(params.token);
  if (!listId) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  const { order }: { order: string[] } = await request.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array of item IDs' }, { status: 400 });
  }

  const supabase = createServiceClient();

  await Promise.all(
    order.map((id, index) =>
      supabase
        .from('items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('list_id', listId)
    )
  );

  return NextResponse.json({ success: true });
}
