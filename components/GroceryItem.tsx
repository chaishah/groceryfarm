'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Check, Pencil, X } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';

const UNITS = ['each', 'kg', 'g', 'lb', 'oz', 'L', 'mL', 'dozen', 'pack', 'bunch', 'bag'];

interface ItemProps {
  item: GroceryItem;
  token: string;
  onUpdate: (item: GroceryItem) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
}

function formatSubtotal(qty: string | null, price: number | null): string | null {
  if (!price) return null;
  const qtyNum = qty ? parseFloat(qty) : 1;
  if (isNaN(qtyNum)) return null;
  return (qtyNum * price).toFixed(2);
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
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(item.qty ?? '');
  const [editUnit, setEditUnit] = useState(item.unit ?? 'each');
  const [editPrice, setEditPrice] = useState(item.price != null ? String(item.price) : '');
  const [saving, setSaving] = useState(false);

  async function toggleBought() {
    const optimistic = { ...item, bought: !item.bought };
    onUpdate(optimistic);
    const res = await fetch(`/api/lists/${token}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bought: !item.bought }),
    });
    if (res.ok) onUpdate(await res.json());
    else onUpdate(item); // revert on error
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

  function startEdit() {
    setEditName(item.name);
    setEditQty(item.qty ?? '');
    setEditUnit(item.unit ?? 'each');
    setEditPrice(item.price != null ? String(item.price) : '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/lists/${token}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        qty: editQty.trim() || null,
        unit: editQty.trim() ? editUnit : null,
        price: editPrice ? parseFloat(editPrice) : null,
      }),
    });
    if (res.ok) {
      onUpdate(await res.json());
      setEditing(false);
    }
    setSaving(false);
  }

  const subtotal = formatSubtotal(item.qty, item.price);

  if (editing) {
    return (
      <div
        ref={nodeRef}
        style={style}
        className="bg-white border-b border-gray-100 px-4 py-3"
      >
        {/* Edit header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Edit item</span>
          <button
            onClick={() => setEditing(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel edit"
          >
            <X size={16} />
          </button>
        </div>
        {/* Name */}
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          placeholder="Item name"
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
        />
        {/* Qty + Unit + Price */}
        <div className="flex gap-2 mb-2.5">
          <input
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            placeholder="Qty"
            type="number"
            min="0"
            step="any"
            className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <select
            value={editUnit}
            onChange={(e) => setEditUnit(e.target.value)}
            className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-gray-400">$</span>
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Price"
              type="number"
              min="0"
              step="0.01"
              className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={saveEdit}
            disabled={saving || !editName.trim()}
            className="flex-1 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 active:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={nodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 transition-colors ${
        item.bought ? 'opacity-75' : ''
      }`}
    >
      {/* Drag handle */}
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

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm break-words ${
            item.bought ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {item.name}
        </span>
        {(item.qty || item.price != null) && (
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.qty && (
              <span className="text-xs text-gray-400">
                {item.qty}{item.unit && item.unit !== 'each' ? ` ${item.unit}` : ''}
              </span>
            )}
            {item.price != null && (
              <span className="text-xs text-gray-400">
                · ${item.price.toFixed(2)}{item.unit && item.unit !== 'each' ? `/${item.unit}` : ''}
              </span>
            )}
            {subtotal && (
              <span className={`text-xs font-medium ml-auto ${item.bought ? 'text-green-400' : 'text-green-600'}`}>
                ${subtotal}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Edit + Delete */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={startEdit}
          className="p-1.5 text-gray-300 hover:text-blue-400 active:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
          aria-label="Edit item"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-gray-300 hover:text-red-400 active:text-red-500 transition-colors disabled:opacity-40 rounded-lg hover:bg-red-50"
          aria-label="Delete item"
        >
          <Trash2 size={14} />
        </button>
      </div>
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
