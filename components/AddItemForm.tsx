'use client';

import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';

const UNITS = ['each', 'kg', 'g', 'lb', 'oz', 'L', 'mL', 'dozen', 'pack', 'bunch', 'bag'];

interface AddItemFormProps {
  token: string;
  onAdd: (item: GroceryItem) => void;
}

export default function AddItemForm({ token, onAdd }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('each');
  const [price, setPrice] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${token}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          qty: qty.trim() || null,
          unit: qty.trim() ? unit : null,
          price: price ? parseFloat(price) : null,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        onAdd(item);
        setName('');
        setQty('');
        setPrice('');
        nameRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-t border-gray-100 safe-area-bottom"
    >
      {/* Expanded detail row */}
      {expanded && (
        <div className="flex gap-2 px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-1 flex-1">
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Qty"
              type="number"
              min="0"
              step="any"
              className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={loading}
              autoComplete="off"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              disabled={loading}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-gray-400 font-medium pl-1">$</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price/unit"
              type="number"
              min="0"
              step="0.01"
              className="flex-1 px-2 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={loading}
              autoComplete="off"
            />
          </div>
        </div>
      )}

      {/* Main row */}
      <div className="flex gap-2 px-3 py-2.5">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add item…"
          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2.5 py-2.5 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
          aria-label={expanded ? 'Hide qty and price' : 'Add qty and price'}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-3 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Add item"
        >
          <Plus size={20} />
        </button>
      </div>
    </form>
  );
}
