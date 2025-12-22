/**
 * Contact types for Family Hub
 * Location: frontend/src/types/contacts.ts
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

  // Sync info
  external_source: string | null;
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
