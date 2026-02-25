'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Share2, Trash2, Wifi, WifiOff } from 'lucide-react';
import type { GroceryList as GroceryListType, GroceryItem, FilterType } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SortableGroceryItem, StaticGroceryItem } from './GroceryItem';
import FilterTabs from './FilterTabs';
import AddItemForm from './AddItemForm';
import BillingSummary from './BillingSummary';

interface GroceryListProps {
  list: GroceryListType;
  initialItems: GroceryItem[];
}

function sortItems(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

type SyncStatus = 'connected' | 'connecting' | 'disconnected';

export default function GroceryList({ list, initialItems }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [filter, setFilter] = useState<FilterType>('all');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Realtime subscription via Supabase with reconnect logic
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const supabase = getSupabaseClient();

    function subscribe() {
      setSyncStatus('connecting');
      channel = supabase
        .channel(`list-${list.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${list.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setItems((prev) => {
                if (prev.some((i: GroceryItem) => i.id === (payload.new as GroceryItem).id)) return prev;
                return sortItems([...prev, payload.new as GroceryItem]);
              });
            } else if (payload.eventType === 'UPDATE') {
              setItems((prev: GroceryItem[]) =>
                prev.map((i) =>
                  i.id === (payload.new as GroceryItem).id ? (payload.new as GroceryItem) : i
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setItems((prev: GroceryItem[]) =>
                prev.filter((i) => i.id !== (payload.old as { id: string }).id)
              );
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') setSyncStatus('connected');
          else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setSyncStatus('disconnected');
            // Attempt reconnect after 3s
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = setTimeout(() => {
              if (channel) supabase.removeChannel(channel);
              subscribe();
            }, 3000);
          }
        });
    }

    subscribe();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [list.id]);

  function handleAdd(item: GroceryItem) {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }

  function handleUpdate(updated: GroceryItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleClearBought() {
    // Optimistic update
    setItems((prev) => prev.filter((i) => !i.bought));
    const res = await fetch(`/api/lists/${list.share_token}/items`, { method: 'DELETE' });
    if (!res.ok) {
      // Re-fetch on failure
      const refetch = await fetch(`/api/lists/${list.share_token}`);
      if (refetch.ok) {
        const data = await refetch.json();
        setItems(data.items ?? []);
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = sortItems(items);
    const oldIndex = sorted.findIndex((i) => i.id === active.id);
    const newIndex = sorted.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      sort_order: idx,
    }));

    setItems(reordered); // optimistic

    await fetch(`/api/lists/${list.share_token}/items/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((i) => i.id) }),
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sorted = sortItems(items);
  const filtered = sorted.filter((item) => {
    if (filter === 'bought') return item.bought;
    if (filter === 'unbought') return !item.bought;
    return true;
  });

  const counts = {
    all: items.length,
    unbought: items.filter((i) => !i.bought).length,
    bought: items.filter((i) => i.bought).length,
  };

  const showDnd = filter === 'all';

  return (
    <div className="flex flex-col h-svh max-w-lg mx-auto bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 truncate leading-tight">{list.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-gray-400">
                {items.length} item{items.length !== 1 ? 's' : ''}
                {counts.bought > 0 && ` · ${counts.bought} in cart`}
              </p>
              {/* Sync indicator */}
              <span
                title={
                  syncStatus === 'connected'
                    ? 'Live sync active'
                    : syncStatus === 'connecting'
                    ? 'Connecting…'
                    : 'Sync disconnected — reconnecting'
                }
              >
                {syncStatus === 'connected' ? (
                  <Wifi size={11} className="text-green-400" />
                ) : syncStatus === 'connecting' ? (
                  <Wifi size={11} className="text-yellow-400 animate-pulse" />
                ) : (
                  <WifiOff size={11} className="text-red-400" />
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {counts.bought > 0 && (
              <button
                onClick={handleClearBought}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear bought</span>
              </button>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              <Share2 size={13} />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </header>

      {/* Billing summary */}
      <BillingSummary items={items} />

      {/* Filter tabs */}
      <FilterTabs filter={filter} onChange={setFilter} counts={counts} />

      {/* Items list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-1">
            <p className="text-gray-400 text-sm">
              {filter === 'all'
                ? 'No items yet'
                : filter === 'bought'
                ? 'Nothing in cart yet'
                : 'All done!'}
            </p>
            {filter === 'all' && (
              <p className="text-gray-300 text-xs">Add something below to get started</p>
            )}
          </div>
        ) : showDnd ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {filtered.map((item) => (
                <SortableGroceryItem
                  key={item.id}
                  item={item}
                  token={list.share_token}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          filtered.map((item) => (
            <StaticGroceryItem
              key={item.id}
              item={item}
              token={list.share_token}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add item form */}
      <div className="flex-shrink-0">
        <AddItemForm token={list.share_token} onAdd={handleAdd} />
      </div>
    </div>
  );
}
