import { getTransformedImageUrl } from '../../../lib/cloudinary';
import { Utensils, Plus, Minus } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function MenuItemGrid({ menuItems, cart, onAddToCart, onUpdateCartQty, isLoading }) {
  if (isLoading) {
    return <div className={styles.loadingText}>Loading menu items...</div>;
  }

  if (menuItems.length === 0) {
    return <div className={styles.emptyGridText}>No menu items found in this category.</div>;
  }

  return (
    <div className={styles.menuGrid}>
      {menuItems.map((item) => {
        const transformedImage = getTransformedImageUrl(item.imageUrl, 200, 200);
        const cartItem = cart.find((c) => c.menuItem.id === item.id);
        const quantityInCart = cartItem ? cartItem.quantity : 0;

        return (
          <div key={item.id} className={styles.itemCard}>
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
      })}
    </div>
  );
}
