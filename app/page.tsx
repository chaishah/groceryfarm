'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!name.trim()) {
      setError('Please enter a list name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const list = await res.json();
        router.push(`/list/${list.share_token}`);
      } else {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <ShoppingCart className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GroceryFarm</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Shared grocery lists — no sign-up needed
          </p>
        </div>

        {/* Create form */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="list-name">
            List name
          </label>
          <input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekly Shop"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            autoFocus
            autoComplete="off"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              'Creating…'
            ) : (
              <>
                Create list
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          You'll get a shareable link — anyone with it can edit
        </p>
      </div>
    </main>
  );
}
