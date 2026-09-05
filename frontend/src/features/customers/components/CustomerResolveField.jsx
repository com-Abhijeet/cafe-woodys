import { useState, useEffect, useRef } from 'react';
import { searchCustomersApi, createCustomerApi } from '../api/customers.api';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { User, Plus, X, Check, UserPlus } from 'lucide-react';

export function CustomerResolveField({ selectedCustomer, onSelectCustomer, onClearCustomer }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Quick Inline Create state if no match found
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Handle live debounced search as user types
  useEffect(() => {
    if (!query.trim() || selectedCustomer) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCustomersApi(query.trim());
        setSuggestions(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Customer lookup error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, selectedCustomer]);

  // Hide dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleImplicitCreate = (inputVal) => {
    setIsCreating(true);
    setShowDropdown(false);
    const trimmed = inputVal.trim();
    if (/^\d{10}$/.test(trimmed)) {
      setNewPhone(trimmed);
      setNewName('');
    } else {
      setNewName(trimmed);
      setNewPhone('');
    }
  };

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newName.trim() || !newPhone.trim()) {
      setCreateError('Customer Name and Phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCustomerApi({
        name: newName.trim(),
        phone: newPhone.trim()
      });
      onSelectCustomer(created);
      setIsCreating(false);
      setNewName('');
      setNewPhone('');
      setQuery('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedCustomer) {
    return (
      <div style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid var(--color-success)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
          <User size={16} color="var(--color-success)" />
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>{selectedCustomer.name}</strong>
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px' }}>({selectedCustomer.phone})</span>
          </div>
        </div>
        <button
          onClick={onClearCustomer}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
          title="Detach Customer"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {!isCreating ? (
        <div>
          <div style={{ position: 'relative' }}>
            <Input
              label="Customer Search & Attach (Name or Mobile #)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              placeholder="Type name or 10-digit mobile number..."
            />
            {isSearching && (
              <span style={{ position: 'absolute', right: '12px', top: '34px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                Searching...
              </span>
            )}
          </div>

          {/* Search Results Dropdown (Step 7: onMouseDown prevents blur race condition) */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 100,
              marginTop: '4px'
            }}>
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((c) => (
                    <div
                      key={c.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(c);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <strong style={{ color: 'var(--color-brand)' }}>{c.name}</strong>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px' }}>{c.phone}</span>
                      </div>
                      <Check size={14} color="var(--color-success)" />
                    </div>
                  ))}

                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleImplicitCreate(query);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      color: 'var(--color-brand)',
                      fontWeight: 700,
                      backgroundColor: 'rgba(59, 110, 201, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <UserPlus size={14} /> + Create new customer for "{query}"
                  </div>
                </>
              ) : (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleImplicitCreate(query);
                  }}
                  style={{
                    padding: '10px 12px',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    color: 'var(--color-brand)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <UserPlus size={14} /> No match found. Tap to create & attach "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Inline Quick Customer Create Form */
        <form onSubmit={handleCreateNewCustomer} style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-brand)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Register & Attach New Customer</span>
            <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          {createError && <div style={{ color: 'var(--color-danger)', fontSize: '11px', marginBottom: '6px' }}>{createError}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            <Input
              placeholder="Customer Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Input
              placeholder="Phone Number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreating(false)} style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
              {isSubmitting ? 'Saving...' : 'Save & Attach'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
