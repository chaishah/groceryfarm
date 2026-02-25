import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center p-6 text-center">
      <ShoppingCart className="text-gray-300 mb-4" size={48} />
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Page not found</h2>
      <p className="text-gray-400 text-sm mb-6">The page you're looking for doesn't exist.</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
