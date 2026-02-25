'use client';

import type { FilterType } from '@/lib/types';

interface FilterTabsProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
  counts: { all: number; unbought: number; bought: number };
}

const TABS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unbought', value: 'unbought' },
  { label: 'Bought', value: 'bought' },
];

export default function FilterTabs({ filter, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex gap-1 px-3 py-2 bg-white border-b border-gray-100">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filter === tab.value
              ? 'bg-green-500 text-white'
              : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'
          }`}
        >
          {tab.label}{' '}
          <span className={filter === tab.value ? 'opacity-80' : 'opacity-60'}>
            ({counts[tab.value]})
          </span>
        </button>
      ))}
    </div>
  );
}
