/**
 * SmartContactSearch - Typeahead search for invitee selection
 * Location: frontend/src/components/SmartContactSearch.tsx
 *
 * Usage: When creating calendar events, use this to search for invitees.
 * Results show: family users -> personal contacts -> family contacts -> email suggestion
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Spin, Avatar, Tag, Empty } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ContactsOutlined,
  MailOutlined,
  SearchOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { contactsApi } from '../services/contacts';
import type {
  LookupResult,
  FamilyUserResult,
  ContactResult,
  EmailSuggestion,
} from '../types/contacts';
import './SmartContactSearch.css';

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export interface SelectedInvitee {
  type: 'family_user' | 'contact' | 'email';
  id?: string;
  email: string;
  display_name: string;
  color?: string | null;
  is_minor?: boolean;
}

interface SmartContactSearchProps {
  onSelect: (invitee: SelectedInvitee) => void;
  selectedInvitees?: SelectedInvitee[];
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const SmartContactSearch: React.FC<SmartContactSearchProps> = ({
  onSelect,
  selectedInvitees = [],
  placeholder = 'Search by name or email...',
  disabled = false,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if an invitee is already selected
  const isAlreadySelected = useCallback((result: LookupResult): boolean => {
    if (result.type === 'email_suggestion') {
      return selectedInvitees.some(inv => inv.email === result.email);
    }
    if (result.type === 'family_user') {
      return selectedInvitees.some(inv => inv.type === 'family_user' && inv.id === result.id);
    }
    if (result.type === 'contact') {
      return selectedInvitees.some(inv => inv.type === 'contact' && inv.id === result.id);
    }
    return false;
  }, [selectedInvitees]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await contactsApi.smartLookup(searchQuery, 10);
      setResults(response.results);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Smart lookup failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string) => performSearch(q), 300),
    [performSearch]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle selection
  const handleSelect = (result: LookupResult) => {
    if (isAlreadySelected(result)) return;

    let invitee: SelectedInvitee;

    if (result.type === 'family_user') {
      invitee = {
        type: 'family_user',
        id: result.id,
        email: result.email || '',
        display_name: result.display_name,
        color: result.color,
        is_minor: result.is_minor,
      };
    } else if (result.type === 'contact') {
      invitee = {
        type: 'contact',
        id: result.id,
        email: result.email || '',
        display_name: result.display_name,
      };
    } else {
      // email_suggestion
      invitee = {
        type: 'email',
        email: result.email,
        display_name: result.email,
      };
    }

    onSelect(invitee);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) {
      // If user presses Enter with a valid email and no results, suggest it
      if (e.key === 'Enter' && query.includes('@') && query.includes('.')) {
        e.preventDefault();
        const emailResult: EmailSuggestion = {
          type: 'email_suggestion',
          email: query,
          prompt: `Invite ${query} as guest`,
        };
        handleSelect(emailResult);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for result type
  const getResultIcon = (result: LookupResult) => {
    if (result.type === 'family_user') {
      return <TeamOutlined style={{ color: result.color || '#1890ff' }} />;
    }
    if (result.type === 'contact') {
      return <ContactsOutlined style={{ color: result.source === 'personal' ? '#52c41a' : '#722ed1' }} />;
    }
    return <MailOutlined style={{ color: '#8c8c8c' }} />;
  };

  // Get tag for result type
  const getResultTag = (result: LookupResult) => {
    if (result.type === 'family_user') {
      const r = result as FamilyUserResult;
      return (
        <Tag color={r.color || 'blue'} style={{ marginLeft: 8 }}>
          {r.is_minor ? 'Child' : 'Family'}
        </Tag>
      );
    }
    if (result.type === 'contact') {
      const r = result as ContactResult;
      return (
        <Tag color={r.source === 'personal' ? 'green' : 'purple'} style={{ marginLeft: 8 }}>
          {r.source === 'personal' ? 'My Contact' : `Shared by ${r.owner_name}`}
        </Tag>
      );
    }
    return (
      <Tag color="default" style={{ marginLeft: 8 }}>
        New Guest
      </Tag>
    );
  };

  // Render result item
  const renderResult = (result: LookupResult, index: number) => {
    const isSelected = isAlreadySelected(result);
    const isHighlighted = index === highlightedIndex;

    return (
      <div
        key={result.type === 'email_suggestion' ? result.email : result.id}
        className={`smart-search-result ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'disabled' : ''}`}
        onClick={() => !isSelected && handleSelect(result)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <div className="result-avatar">
          {result.type === 'family_user' && (result as FamilyUserResult).avatar_url ? (
            <Avatar src={(result as FamilyUserResult).avatar_url} size={32} />
          ) : result.type === 'contact' && (result as ContactResult).avatar_url ? (
            <Avatar src={(result as ContactResult).avatar_url} size={32} />
          ) : (
            <Avatar
              size={32}
              icon={getResultIcon(result)}
              style={{
                backgroundColor:
                  result.type === 'family_user'
                    ? (result as FamilyUserResult).color || '#1890ff'
                    : '#f0f0f0',
              }}
            />
          )}
        </div>
        <div className="result-info">
          <div className="result-name">
            {result.type === 'email_suggestion'
              ? (result as EmailSuggestion).prompt
              : result.display_name}
            {getResultTag(result)}
          </div>
          {result.type !== 'email_suggestion' && result.email && (
            <div className="result-email">{result.email}</div>
          )}
        </div>
        {isSelected && (
          <div className="result-selected">
            <Tag color="default">Already added</Tag>
          </div>
        )}
      </div>
    );
  };

  // Group results by type
  const groupedResults = {
    family: results.filter(r => r.type === 'family_user'),
    personal: results.filter(r => r.type === 'contact' && (r as ContactResult).source === 'personal'),
    shared: results.filter(r => r.type === 'contact' && (r as ContactResult).source === 'family'),
    email: results.filter(r => r.type === 'email_suggestion'),
  };

  return (
    <div className="smart-contact-search">
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query && setShowDropdown(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        prefix={<SearchOutlined />}
        suffix={
          loading ? (
            <Spin size="small" />
          ) : query ? (
            <CloseCircleOutlined
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowDropdown(false);
              }}
              style={{ cursor: 'pointer', color: '#8c8c8c' }}
            />
          ) : null
        }
        allowClear={false}
      />

      {showDropdown && (
        <div ref={dropdownRef} className="smart-search-dropdown">
          {results.length === 0 && !loading ? (
            <div className="smart-search-empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  query.includes('@')
                    ? 'Press Enter to invite as guest'
                    : 'No matches found'
                }
              />
            </div>
          ) : (
            <>
              {groupedResults.family.length > 0 && (
                <div className="result-group">
                  <div className="result-group-header">
                    <TeamOutlined /> Family Members
                  </div>
                  {groupedResults.family.map((r, i) =>
                    renderResult(r, results.indexOf(r))
                  )}
                </div>
              )}

              {groupedResults.personal.length > 0 && (
                <div className="result-group">
                  <div className="result-group-header">
                    <UserOutlined /> My Contacts
                  </div>
                  {groupedResults.personal.map((r, i) =>
                    renderResult(r, results.indexOf(r))
                  )}
                </div>
              )}

              {groupedResults.shared.length > 0 && (
                <div className="result-group">
                  <div className="result-group-header">
                    <ContactsOutlined /> Family Contacts
                  </div>
                  {groupedResults.shared.map((r, i) =>
                    renderResult(r, results.indexOf(r))
                  )}
                </div>
              )}

              {groupedResults.email.length > 0 && (
                <div className="result-group">
                  <div className="result-group-header">
                    <MailOutlined /> Invite by Email
                  </div>
                  {groupedResults.email.map((r, i) =>
                    renderResult(r, results.indexOf(r))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartContactSearch;
