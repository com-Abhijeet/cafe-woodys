import { memo } from 'react';
import { getTransformedImageUrl } from '../../../lib/cloudinary';
import { Utensils, Plus, Minus } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

const MenuItemCard = memo(function MenuItemCard({ item, quantityInCart, onAddToCart, onUpdateCartQty }) {
  const transformedImage = getTransformedImageUrl(item.imageUrl, 200, 200);

  return (
    <div className={styles.itemCard}>
      {/* Dish Photo */}
      <div className={styles.imageContainer}>
        {transformedImage ? (
          <img src={transformedImage} alt={item.name} className={styles.itemImage} />
        ) : (
          <Utensils size={24} color="var(--color-text-secondary)" />
        )}
      </div>

      {/* Info */}
      <div className={styles.itemDetails}>
        <div className={styles.itemName}>{item.name}</div>
        <div className={styles.itemPrice}>₹{(item.price / 100).toFixed(2)}</div>
      </div>

      {/* Action */}
      {quantityInCart === 0 ? (
        <button className={styles.addBtn} onClick={() => onAddToCart(item)}>
          <Plus size={14} /> Add
        </button>
      ) : (
        <div className={styles.qtyStepper}>
          <button className={styles.stepperBtn} onClick={() => onUpdateCartQty(item.id, -1)}>
            <Minus size={12} />
          </button>
          <span className={styles.qtyCount}>{quantityInCart}</span>
          <button className={styles.stepperBtn} onClick={() => onUpdateCartQty(item.id, 1)}>
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.imageUrl === nextProps.item.imageUrl &&
    prevProps.quantityInCart === nextProps.quantityInCart
  );
});

export function MenuItemGrid({ menuItems, cart, onAddToCart, onUpdateCartQty, isLoading, error, onRetry }) {
  if (isLoading) {
    return <div className={styles.loadingText}>Loading menu items...</div>;
  }

  if (error && menuItems.length === 0) {
    return (
      <div className={styles.emptyGridText} style={{ color: 'var(--color-danger)', flexDirection: 'column', gap: '8px' }}>
        <span>{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Retry Loading Menu
          </button>
        )}
      </div>
    );
  }

  if (menuItems.length === 0) {
    return <div className={styles.emptyGridText}>No menu items found in this category.</div>;
  }

  return (
    <div className={styles.menuGrid}>
      {menuItems.map((item) => {
        const cartItem = cart.find((c) => c.menuItem.id === item.id);
        const quantityInCart = cartItem ? cartItem.quantity : 0;

        return (
          <MenuItemCard
            key={item.id}
            item={item}
            quantityInCart={quantityInCart}
            onAddToCart={onAddToCart}
            onUpdateCartQty={onUpdateCartQty}
          />
        );
      })}
    </div>
  );
}

