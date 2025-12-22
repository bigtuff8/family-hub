/**
 * Contacts API service
 * Location: frontend/src/services/contacts.ts
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
} from '../types/contacts';

export interface ContactsQueryParams {
  search?: string;
  favorites_only?: boolean;
  include_archived?: boolean;
  page?: number;
  page_size?: number;
}

export const contactsApi = {
  // Get all contacts with optional filtering
  getContacts: async (params: ContactsQueryParams = {}): Promise<ContactListResponse> => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  // Get a single contact by ID
  getContact: async (contactId: string): Promise<Contact> => {
    const response = await api.get(`/contacts/${contactId}`);
    return response.data;
  },

  // Create a new contact
  createContact: async (contact: ContactCreate): Promise<Contact> => {
    const response = await api.post('/contacts', contact);
    return response.data;
  },

  // Update a contact
  updateContact: async (contactId: string, updates: ContactUpdate): Promise<Contact> => {
    const response = await api.put(`/contacts/${contactId}`, updates);
    return response.data;
  },

  // Delete a contact
  deleteContact: async (contactId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}`);
  },

  // Toggle favorite status
  toggleFavorite: async (contactId: string): Promise<ContactSummary> => {
    const response = await api.post(`/contacts/${contactId}/favorite`);
    return response.data;
  },

  // Toggle archive status
  toggleArchive: async (contactId: string): Promise<ContactSummary> => {
    const response = await api.post(`/contacts/${contactId}/archive`);
    return response.data;
  },

  // Quick search for autocomplete
  searchContacts: async (query: string, limit: number = 10): Promise<ContactSummary[]> => {
    const response = await api.get('/contacts/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Get upcoming birthdays
  getUpcomingBirthdays: async (daysAhead: number = 30): Promise<UpcomingBirthdaysResponse> => {
    const response = await api.get('/contacts/birthdays/upcoming', {
      params: { days_ahead: daysAhead }
    });
    return response.data;
  },

  // Phone operations
  addPhone: async (contactId: string, phone: ContactPhoneCreate): Promise<ContactPhone> => {
    const response = await api.post(`/contacts/${contactId}/phones`, phone);
    return response.data;
  },

  deletePhone: async (contactId: string, phoneId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}/phones/${phoneId}`);
  },

  // Email operations
  addEmail: async (contactId: string, email: ContactEmailCreate): Promise<ContactEmail> => {
    const response = await api.post(`/contacts/${contactId}/emails`, email);
    return response.data;
  },

  deleteEmail: async (contactId: string, emailId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}/emails/${emailId}`);
  },
};
