import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import styles from './FilterBar.module.css';

export function FilterBar({
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filterDefinitions = [], // [{ key: 'paymentStatus', label: 'Status', options: [{ value: 'ALL', label: 'All' }, ...] }]
  filterValues = {},      // { paymentStatus: 'ALL' }
  onFilterChange,
  sortOptions = [],       // [{ value: 'createdAt_desc', label: 'Newest First' }, ...]
  sortValue = '',
  onSortChange
}) {
  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        {/* Search Bar */}
        {onSearchChange && (
          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <Search size={16} className={styles.searchIcon} />
          </div>
        )}

        {/* Filter Dropdowns */}
        {filterDefinitions.length > 0 && (
          <div className={styles.filterGroup}>
            <SlidersHorizontal size={14} color="var(--color-text-secondary)" />
            {filterDefinitions.map((def) => (
              <select
                key={def.key}
                className={styles.selectInput}
                value={filterValues[def.key] || 'ALL'}
                onChange={(e) => onFilterChange(def.key, e.target.value)}
              >
                {def.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {def.label ? `${def.label}: ${opt.label}` : opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <div className={styles.sortGroup}>
            <ArrowUpDown size={14} color="var(--color-text-secondary)" />
            <select
              className={styles.selectInput}
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
