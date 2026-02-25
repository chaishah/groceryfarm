'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Check } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';

interface ItemProps {
  item: GroceryItem;
  token: string;
  onUpdate: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
}

function ItemRow({
  item,
  token,
  onUpdate,
  onDelete,
  draggable,
  dragHandleProps,
  style,
  nodeRef,
}: ItemProps & {
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  style?: React.CSSProperties;
  nodeRef?: (node: HTMLElement | null) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function toggleBought() {
    const res = await fetch(`/api/lists/${token}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bought: !item.bought }),
    });
    if (res.ok) onUpdate(await res.json());
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/lists/${token}/items/${item.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDelete(item.id);
    } else {
      setDeleting(false);
    }
  }

  return (
    <div
      ref={nodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50"
    >
      {/* Drag handle — only shown when draggable */}
      {draggable ? (
        <button
          {...dragHandleProps}
          style={{ touchAction: 'none' }}
          className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
      ) : (
        <span className="w-[18px] flex-shrink-0" />
      )}

      {/* Bought toggle */}
      <button
        onClick={toggleBought}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          item.bought
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        }`}
        aria-label={item.bought ? 'Mark as unbought' : 'Mark as bought'}
      >
        {item.bought && <Check size={13} strokeWidth={3} />}
      </button>

      {/* Name + qty */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm break-words ${
            item.bought ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {item.name}
        </span>
        {item.qty && (
          <span className="ml-2 text-xs text-gray-400 font-medium">{item.qty}</span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-300 hover:text-red-400 active:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
        aria-label="Delete item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// Sortable version (inside DndContext)
export function SortableGroceryItem(props: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };

  return (
    <ItemRow
      {...props}
      nodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
      draggable
    />
  );
}

// Static version (filtered view — no drag)
export function StaticGroceryItem(props: ItemProps) {
  return <ItemRow {...props} />;
}
