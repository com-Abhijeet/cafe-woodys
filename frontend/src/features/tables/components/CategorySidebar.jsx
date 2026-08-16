import styles from './TableWorkspaceModal.module.css';

export function CategorySidebar({ categories, selectedCategory, onSelectCategory, totalItemsCount }) {
  return (
    <div className={styles.categorySidebar}>
      <div className={styles.sidebarTitle}>Categories</div>
      <button
        className={`${styles.categoryBtn} ${selectedCategory === 'ALL' ? styles.activeCategoryBtn : ''}`}
        onClick={() => onSelectCategory('ALL')}
      >
        All Items ({totalItemsCount})
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.activeCategoryBtn : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
