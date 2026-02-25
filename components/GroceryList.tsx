'use client';

import { useState, useEffect } from 'react';
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
import { Share2, Trash2 } from 'lucide-react';
import type { GroceryList as GroceryListType, GroceryItem, FilterType } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SortableGroceryItem, StaticGroceryItem } from './GroceryItem';
import FilterTabs from './FilterTabs';
import AddItemForm from './AddItemForm';

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

export default function GroceryList({ list, initialItems }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [filter, setFilter] = useState<FilterType>('all');
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Realtime subscription via Supabase
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`list-${list.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${list.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => {
              if (prev.some((i) => i.id === (payload.new as GroceryItem).id)) return prev;
              return sortItems([...prev, payload.new as GroceryItem]);
            });
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) =>
                i.id === (payload.new as GroceryItem).id ? (payload.new as GroceryItem) : i
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    const res = await fetch(`/api/lists/${list.share_token}/items`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((i) => !i.bought));
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
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-gray-900 truncate max-w-[200px]">{list.name}</h1>
          <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          {counts.bought > 0 && (
            <button
              onClick={handleClearBought}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
              Clear bought
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
      </header>

      {/* Filter tabs */}
      <FilterTabs filter={filter} onChange={setFilter} counts={counts} />

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            {filter === 'all'
              ? 'No items yet — add something below!'
              : filter === 'bought'
              ? 'Nothing bought yet.'
              : 'All done!'}
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
