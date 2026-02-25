'use client';

import { useState } from 'react';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import type { GroceryItem } from '@/lib/types';

interface BillingSummaryProps {
  items: GroceryItem[];
}

function calcSubtotal(item: GroceryItem): number {
  if (item.price == null) return 0;
  const qty = item.qty ? parseFloat(item.qty) : 1;
  return isNaN(qty) ? 0 : qty * item.price;
}

export default function BillingSummary({ items }: BillingSummaryProps) {
  const [open, setOpen] = useState(false);

  const pricedItems = items.filter((i) => i.price != null);
  if (pricedItems.length === 0) return null;

  const totalAll = pricedItems.reduce((sum, i) => sum + calcSubtotal(i), 0);
  const totalBought = pricedItems
    .filter((i) => i.bought)
    .reduce((sum, i) => sum + calcSubtotal(i), 0);
  const totalUnbought = pricedItems
    .filter((i) => !i.bought)
    .reduce((sum, i) => sum + calcSubtotal(i), 0);

  const boughtCount = items.filter((i) => i.bought).length;
  const unboughtCount = items.filter((i) => !i.bought).length;

  return (
    <div className="bg-green-50 border-b border-green-100">
      {/* Summary toggle row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Receipt size={15} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800">
            Bill estimate:{' '}
            <span className="font-bold">${totalAll.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalBought > 0 && (
            <span className="text-xs text-green-600 font-medium">
              ${totalBought.toFixed(2)} in cart
            </span>
          )}
          {open ? (
            <ChevronUp size={15} className="text-green-500" />
          ) : (
            <ChevronDown size={15} className="text-green-500" />
          )}
        </div>
      </button>

      {/* Expanded breakdown */}
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-green-100">
          <div className="pt-2 grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-2.5 text-center border border-green-100">
              <div className="text-xs text-gray-500 mb-0.5">Total</div>
              <div className="text-sm font-bold text-gray-800">${totalAll.toFixed(2)}</div>
              <div className="text-xs text-gray-400">{pricedItems.length} priced</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center border border-green-100">
              <div className="text-xs text-gray-500 mb-0.5">In cart</div>
              <div className="text-sm font-bold text-green-600">${totalBought.toFixed(2)}</div>
              <div className="text-xs text-gray-400">{boughtCount} item{boughtCount !== 1 ? 's' : ''}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center border border-green-100">
              <div className="text-xs text-gray-500 mb-0.5">Remaining</div>
              <div className="text-sm font-bold text-orange-500">${totalUnbought.toFixed(2)}</div>
              <div className="text-xs text-gray-400">{unboughtCount} item{unboughtCount !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Per-item breakdown */}
          {pricedItems.length > 0 && (
            <div className="space-y-1 pt-1">
              {pricedItems.map((item) => {
                const sub = calcSubtotal(item);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between text-xs py-1 ${
                      item.bought ? 'text-gray-400 line-through' : 'text-gray-600'
                    }`}
                  >
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="ml-2 text-gray-400">
                      {item.qty ? `${item.qty}${item.unit && item.unit !== 'each' ? ` ${item.unit}` : ''} × ` : ''}
                      ${item.price!.toFixed(2)}
                    </span>
                    <span className={`ml-2 font-medium min-w-[50px] text-right ${item.bought ? '' : 'text-gray-700'}`}>
                      ${sub.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
