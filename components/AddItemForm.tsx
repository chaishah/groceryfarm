'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';

interface AddItemFormProps {
  token: string;
  onAdd: (item: GroceryItem) => void;
}

export default function AddItemForm({ token, onAdd }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
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
        body: JSON.stringify({ name, qty }),
      });
      if (res.ok) {
        const item = await res.json();
        onAdd(item);
        setName('');
        setQty('');
        nameRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-3 bg-white border-t border-gray-100 safe-area-bottom"
    >
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item…"
        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        disabled={loading}
        autoComplete="off"
      />
      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="w-16 px-2 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
        disabled={loading}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-3 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Add item"
      >
        <Plus size={20} />
      </button>
    </form>
  );
}
