/**
 * Contact types for Family Hub
 * Location: frontend/src/types/contacts.ts
 *
 * Phase 2 Updates:
 * - User-owned contacts (owner_user_id)
 * - Publish to Family functionality
 * - Smart lookup for invitee selection
 */

// ============ Phone & Email Types ============

export interface ContactPhone {
  id: string;
  phone_type: 'mobile' | 'home' | 'work' | 'other';
  phone_number: string;
  is_primary: boolean;
  created_at: string;
}

export interface ContactPhoneCreate {
  phone_type: 'mobile' | 'home' | 'work' | 'other';
  phone_number: string;
  is_primary?: boolean;
}

export interface ContactEmail {
  id: string;
  email_type: 'personal' | 'work' | 'other';
  email_address: string;
  is_primary: boolean;
  created_at: string;
}

export interface ContactEmailCreate {
  email_type: 'personal' | 'work' | 'other';
  email_address: string;
  is_primary?: boolean;
}

// ============ Owner Info (Phase 2) ============

export interface OwnerInfo {
  id: string;
  name: string;
  color: string | null;
}

// ============ Contact Types ============

export interface ContactSummary {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  birthday: string | null; // ISO date string
  is_favorite: boolean;
  photo_url: string | null;
  // Phase 2: Ownership and sharing
  owner_user_id: string;
  owner: OwnerInfo | null;
  is_published_to_family: boolean;
  source: string;
}

export interface Contact {
  id: string;

  // Core fields
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  nickname: string | null;

  // Primary contact info
  primary_email: string | null;
  primary_phone: string | null;

  // Important dates
  birthday: string | null; // ISO date string
  anniversary: string | null; // ISO date string
  anniversary_type: string | null; // wedding, engagement, friendship, first_met, dating, other

  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;

  // Organization
  company: string | null;
  job_title: string | null;

  // Notes
  notes: string | null;
  photo_url: string | null;

  // Phase 2: Ownership
  owner_user_id: string;
  owner: OwnerInfo | null;

  // Phase 2: Family sharing
  is_published_to_family: boolean;
  published_at: string | null;
  published_by_user_id: string | null;

  // Sync info
  source: string;
  external_id: string | null;
  last_synced_at: string | null;

  // Status
  is_favorite: boolean;
  is_archived: boolean;

  // Related data
  phones: ContactPhone[];
  emails: ContactEmail[];

  // Timestamps
  created_at: string;
  updated_at: string | null;
}

export interface ContactCreate {
  first_name: string;
  last_name?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  anniversary_type?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  country?: string;
  company?: string | null;
  job_title?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  is_favorite?: boolean;
  is_published_to_family?: boolean; // Phase 2
  phones?: ContactPhoneCreate[];
  emails?: ContactEmailCreate[];
}

export interface ContactUpdate {
  first_name?: string;
  last_name?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  anniversary_type?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  country?: string | null;
  company?: string | null;
  job_title?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  is_favorite?: boolean;
  is_archived?: boolean;
}

// ============ List Response ============

export interface ContactListResponse {
  contacts: ContactSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============ Birthday Types ============

export interface UpcomingBirthday {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  birthday: string; // ISO date string
  days_until: number;
  age_turning: number | null;
}

export interface UpcomingBirthdaysResponse {
  birthdays: UpcomingBirthday[];
}

// ============ Publish to Family (Phase 2) ============

export interface PublishToFamilyRequest {
  publish: boolean;
}

export interface PublishToFamilyResponse {
  id: string;
  is_published_to_family: boolean;
  published_at: string | null;
  message: string;
}

// ============ Smart Lookup (Phase 2) ============

export type LookupResultType = 'family_user' | 'contact' | 'email_suggestion';

export interface FamilyUserResult {
  type: 'family_user';
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  color: string | null;
  is_minor: boolean;
}

export interface ContactResult {
  type: 'contact';
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  source: 'personal' | 'family';
  owner_name: string | null;
}

export interface EmailSuggestion {
  type: 'email_suggestion';
  email: string;
  prompt: string;
}

export type LookupResult = FamilyUserResult | ContactResult | EmailSuggestion;

export interface SmartLookupResponse {
  query: string;
  results: LookupResult[];
}

// ============ Email Search (Phase 2) ============

export interface EmailSearchResult {
  id: string;
  display_name: string;
  email: string;
  first_name: string;
  last_name: string | null;
}

export interface EmailSearchResponse {
  query: string;
  contacts: EmailSearchResult[];
}

// ============ Contact View Options (Phase 2) ============

export type ContactView = 'mine' | 'family' | 'all';
