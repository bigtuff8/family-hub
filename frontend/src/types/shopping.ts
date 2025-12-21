/**
 * Shopping list types
 * Location: frontend/src/types/shopping.ts
 */

export interface ShoppingItemUser {
  id: string;
  name: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  checked: boolean;
  checked_at: string | null;
  source: string;
  recipe_id: string | null;
  added_by: ShoppingItemUser | null;
  created_at: string;
  updated_at: string;
  merged?: boolean;
  previous_quantity?: number;
}

export interface ShoppingListSummary {
  id: string;
  name: string;
  is_default: boolean;
  item_count: number;
  checked_count: number;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  is_default: boolean;
  items: ShoppingItem[];
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface ShoppingItemCreate {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  source?: string;
  recipe_id?: string;
  force_add?: boolean;
}

export interface RecentlyCompletedDuplicate {
  id: string;
  name: string;
  checked_at: string;
  hours_ago: number;
}

export interface AddItemResponse {
  item: ShoppingItem | null;
  merged: boolean;
  previous_quantity: number | null;
  duplicate_detected: boolean;
  recently_completed: RecentlyCompletedDuplicate | null;
}

export interface ShoppingItemUpdate {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

export interface ToggleResponse {
  id: string;
  checked: boolean;
  checked_at: string | null;
}

export interface CompleteShopResponse {
  message: string;
  items_cleared: number;
  items_remaining: number;
}

// Category types
export interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ShoppingCategoryCreate {
  name: string;
  icon?: string;
  color?: string;
  keywords?: string[];
}

export interface ShoppingCategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
  keywords?: string[];
}
