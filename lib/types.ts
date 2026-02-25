export interface GroceryList {
  id: string;
  name: string;
  share_token: string;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  qty: string | null;
  bought: boolean;
  sort_order: number;
  created_at: string;
}

export type FilterType = 'all' | 'unbought' | 'bought';
