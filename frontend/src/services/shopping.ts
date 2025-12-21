/**
 * Shopping list API service
 * Location: frontend/src/services/shopping.ts
 */

import { api } from './auth';
import type {
  ShoppingList,
  ShoppingListSummary,
  ShoppingItem,
  ShoppingItemCreate,
  ShoppingItemUpdate,
  ToggleResponse,
  CompleteShopResponse,
  ShoppingCategory,
  ShoppingCategoryCreate,
  ShoppingCategoryUpdate,
  AddItemResponse,
} from '../types/shopping';

export const shoppingApi = {
  // Get all shopping lists
  getLists: async (): Promise<ShoppingListSummary[]> => {
    const response = await api.get('/shopping/lists');
    return response.data;
  },

  // Get default shopping list
  getDefaultList: async (): Promise<ShoppingList> => {
    const response = await api.get('/shopping/default');
    return response.data;
  },

  // Get a specific list
  getList: async (listId: string): Promise<ShoppingList> => {
    const response = await api.get(`/shopping/lists/${listId}`);
    return response.data;
  },

  // Add item to list
  addItem: async (listId: string, item: ShoppingItemCreate): Promise<AddItemResponse> => {
    const response = await api.post(`/shopping/lists/${listId}/items`, item);
    return response.data;
  },

  // Update an item
  updateItem: async (listId: string, itemId: string, updates: ShoppingItemUpdate): Promise<ShoppingItem> => {
    const response = await api.put(`/shopping/lists/${listId}/items/${itemId}`, updates);
    return response.data;
  },

  // Delete an item
  deleteItem: async (listId: string, itemId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/shopping/lists/${listId}/items/${itemId}`);
    return response.data;
  },

  // Toggle item checked state
  toggleItem: async (listId: string, itemId: string): Promise<ToggleResponse> => {
    const response = await api.post(`/shopping/lists/${listId}/items/${itemId}/toggle`);
    return response.data;
  },

  // Complete shopping (clear checked items)
  completeShop: async (listId: string): Promise<CompleteShopResponse> => {
    const response = await api.post(`/shopping/lists/${listId}/complete`);
    return response.data;
  },

  // Get item name suggestions for autocomplete
  getSuggestions: async (): Promise<string[]> => {
    const response = await api.get('/shopping/suggestions');
    return response.data;
  },

  // Get available categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/shopping/categories');
    return response.data;
  },

  // Get available units
  getUnits: async (): Promise<string[]> => {
    const response = await api.get('/shopping/units');
    return response.data;
  },

  // ============ Category Management ============

  // Get all categories with full details
  getCategoriesFull: async (): Promise<ShoppingCategory[]> => {
    const response = await api.get('/shopping/categories/full');
    return response.data;
  },

  // Create a new category
  createCategory: async (category: ShoppingCategoryCreate): Promise<ShoppingCategory> => {
    const response = await api.post('/shopping/categories', category);
    return response.data;
  },

  // Update a category
  updateCategory: async (id: string, updates: ShoppingCategoryUpdate): Promise<ShoppingCategory> => {
    const response = await api.put(`/shopping/categories/${id}`, updates);
    return response.data;
  },

  // Delete a category
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/shopping/categories/${id}`);
    return response.data;
  },

  // Reorder categories
  reorderCategories: async (categoryIds: string[]): Promise<ShoppingCategory[]> => {
    const response = await api.put('/shopping/categories/reorder', { category_ids: categoryIds });
    return response.data;
  },

  // Add keyword to category
  addKeyword: async (categoryId: string, keyword: string): Promise<ShoppingCategory> => {
    const response = await api.post(`/shopping/categories/${categoryId}/keywords`, { keyword });
    return response.data;
  },

  // Remove keyword from category
  removeKeyword: async (categoryId: string, keyword: string): Promise<ShoppingCategory> => {
    const response = await api.delete(`/shopping/categories/${categoryId}/keywords/${encodeURIComponent(keyword)}`);
    return response.data;
  },
};
