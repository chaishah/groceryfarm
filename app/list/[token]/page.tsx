import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

// Always fetch fresh data — list content changes frequently
export const dynamic = 'force-dynamic';
import GroceryList from '@/components/GroceryList';
import type { GroceryList as GroceryListType, GroceryItem } from '@/lib/types';

interface PageProps {
  params: { token: string };
}

export default async function ListPage({ params }: PageProps) {
  const supabase = createServiceClient();

  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('share_token', params.token)
    .single();

  if (!list) notFound();

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', list.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <GroceryList
      list={list as GroceryListType}
      initialItems={(items ?? []) as GroceryItem[]}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServiceClient();
  const { data: list } = await supabase
    .from('lists')
    .select('name')
    .eq('share_token', params.token)
    .single();

  return {
    title: list ? `${list.name} — GroceryFarm` : 'List not found',
  };
}
