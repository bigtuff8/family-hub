/**
 * Contacts API service
 * Location: frontend/src/services/contacts.ts
 *
 * Phase 2 Updates:
 * - User-owned contacts
 * - My Contacts vs Family Contacts
 * - Publish to Family
 * - Smart lookup for invitee selection
 */

import { api } from './auth';
import type {
  Contact,
  ContactSummary,
  ContactCreate,
  ContactUpdate,
  ContactListResponse,
  ContactPhone,
  ContactPhoneCreate,
  ContactEmail,
  ContactEmailCreate,
  UpcomingBirthdaysResponse,
  PublishToFamilyResponse,
  SmartLookupResponse,
  ContactView,
  EmailSearchResponse,
} from '../types/contacts';

export interface ContactsQueryParams {
  search?: string;
  favorites_only?: boolean;
  include_archived?: boolean;
  view?: ContactView;
  page?: number;
  page_size?: number;
}

export const contactsApi = {
  // ============ Contact Lists ============

  // Get contacts with flexible filtering (Phase 2)
  getContacts: async (params: ContactsQueryParams = {}): Promise<ContactListResponse> => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  // Get only my contacts (Phase 2)
  getMyContacts: async (params: Omit<ContactsQueryParams, 'view'> = {}): Promise<ContactListResponse> => {
    const response = await api.get('/contacts/mine', { params });
    return response.data;
  },

  // Get family contacts (published by others) (Phase 2)
  getFamilyContacts: async (params: Pick<ContactsQueryParams, 'search' | 'page' | 'page_size'> = {}): Promise<ContactListResponse> => {
    const response = await api.get('/contacts/family', { params });
    return response.data;
  },

  // ============ Single Contact CRUD ============

  // Get a single contact by ID
  getContact: async (contactId: string): Promise<Contact> => {
    const response = await api.get(`/contacts/${contactId}`);
    return response.data;
  },

  // Create a new contact (owned by current user)
  createContact: async (contact: ContactCreate): Promise<Contact> => {
    const response = await api.post('/contacts', contact);
    return response.data;
  },

  // Update a contact (must own it)
  updateContact: async (contactId: string, updates: ContactUpdate): Promise<Contact> => {
    const response = await api.put(`/contacts/${contactId}`, updates);
    return response.data;
  },

  // Delete a contact (must own it)
  deleteContact: async (contactId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}`);
  },

  // ============ Contact Actions ============

  // Toggle favorite status (must own it)
  toggleFavorite: async (contactId: string): Promise<ContactSummary> => {
    const response = await api.post(`/contacts/${contactId}/favorite`);
    return response.data;
  },

  // Toggle archive status (must own it)
  toggleArchive: async (contactId: string): Promise<ContactSummary> => {
    const response = await api.post(`/contacts/${contactId}/archive`);
    return response.data;
  },

  // Publish or unpublish contact to family (Phase 2)
  publishToFamily: async (contactId: string, publish: boolean = true): Promise<PublishToFamilyResponse> => {
    const response = await api.post(`/contacts/${contactId}/publish`, { publish });
    return response.data;
  },

  // ============ Search & Lookup ============

  // Quick search for autocomplete (own + family contacts)
  searchContacts: async (query: string, limit: number = 10): Promise<ContactSummary[]> => {
    const response = await api.get('/contacts/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Smart lookup for event invitations (Phase 2)
  // Returns: family users -> personal contacts -> family contacts -> email suggestion
  smartLookup: async (query: string, limit: number = 10): Promise<SmartLookupResponse> => {
    const response = await api.get('/contacts/lookup', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Search contacts by email only (for event email input field)
  searchByEmail: async (query: string, limit: number = 10): Promise<EmailSearchResponse> => {
    const response = await api.get('/contacts/search-by-email', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // ============ Birthdays ============

  // Get upcoming birthdays (own + family contacts)
  getUpcomingBirthdays: async (daysAhead: number = 30): Promise<UpcomingBirthdaysResponse> => {
    const response = await api.get('/contacts/birthdays/upcoming', {
      params: { days_ahead: daysAhead }
    });
    return response.data;
  },

  // ============ Phone Operations ============

  addPhone: async (contactId: string, phone: ContactPhoneCreate): Promise<ContactPhone> => {
    const response = await api.post(`/contacts/${contactId}/phones`, phone);
    return response.data;
  },

  deletePhone: async (contactId: string, phoneId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}/phones/${phoneId}`);
  },

  // ============ Email Operations ============

  addEmail: async (contactId: string, email: ContactEmailCreate): Promise<ContactEmail> => {
    const response = await api.post(`/contacts/${contactId}/emails`, email);
    return response.data;
  },

  deleteEmail: async (contactId: string, emailId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}/emails/${emailId}`);
  },
};
