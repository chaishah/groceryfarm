import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-700 mb-1">List not found</h2>
      <p className="text-gray-400 text-sm mb-6">
        This link may be invalid or the list was deleted.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
      >
        Create a new list
      </Link>
    </main>
  );
}
