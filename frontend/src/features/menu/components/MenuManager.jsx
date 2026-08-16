import { useState } from 'react';
import { useMenu } from '../hooks/useMenu';
import { RecipeBuilderModal } from '../../recipes/components/RecipeBuilderModal';
import { getTransformedImageUrl } from '../../../lib/cloudinary';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, BookOpen, Image, Upload, Utensils } from 'lucide-react';
import styles from './MenuManager.module.css';

export function MenuManager() {
  const { items, isLoading, error, addMenuItem, editMenuItem, removeMenuItem, uploadImage, refreshMenu } = useMenu();

  const [selectedCat, setSelectedCat] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [recipeMenuItem, setRecipeMenuItem] = useState(null);
  const [actionError, setActionError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Beverages');
  const [priceRs, setPriceRs] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  const filteredItems = selectedCat === 'ALL'
    ? items
    : items.filter((i) => i.category === selectedCat);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Beverages');
    setPriceRs('');
    setDescription('');
    setIsAvailable(true);
    setSelectedFile(null);
    setActionError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPriceRs((item.price / 100).toString());
    setDescription(item.description || '');
    setIsAvailable(item.isAvailable);
    setSelectedFile(null);
    setActionError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);

    const pricePaise = Math.round(parseFloat(priceRs) * 100);
    const payload = {
      name,
      category,
      price: pricePaise,
      description,
      isAvailable
    };

    try {
      let savedItem;
      if (editingItem) {
        savedItem = await editMenuItem(editingItem.id, payload);
      } else {
        savedItem = await addMenuItem(payload);
      }

      // If an image file was selected, upload it
      if (selectedFile && savedItem?.id) {
        await uploadImage(savedItem.id, selectedFile);
      }

      setShowModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await editMenuItem(item.id, { isAvailable: !item.isAvailable });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await removeMenuItem(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Menu Management</h2>
          <p className={styles.subtitle}>Manage café food & drink offerings, photos, and raw material recipes</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Menu Item
        </Button>
      </div>

      {/* Category Bar */}
      <div className={styles.categoryBar}>
        <button
          className={`${styles.catButton} ${selectedCat === 'ALL' ? styles.activeCat : ''}`}
          onClick={() => setSelectedCat('ALL')}
        >
          All Items ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.catButton} ${selectedCat === cat ? styles.activeCat : ''}`}
            onClick={() => setSelectedCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      {isLoading ? (
        <p>Loading menu items...</p>
      ) : error ? (
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => {
            const transformedImage = getTransformedImageUrl(item.imageUrl, 400, 400);
            return (
              <div key={item.id} className={styles.itemCard}>
                <div>
                  {/* Photo or Placeholder */}
                  <div style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {transformedImage ? (
                      <img src={transformedImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                        <Utensils size={24} />
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>No Photo Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>₹{(item.price / 100).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', fontWeight: 600, marginTop: '2px' }}>
                    {item.category}
                  </div>
                  {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                </div>

                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {item.isAvailable ? (
                      <span className={styles.availableBadge}><CheckCircle size={14} /> Available</span>
                    ) : (
                      <span className={styles.unavailableBadge}><XCircle size={14} /> Unavailable</span>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button variant="secondary" onClick={() => setRecipeMenuItem(item)} style={{ padding: '4px 8px', minHeight: '36px', fontSize: 'var(--text-xs)' }} title="Configure Raw Material Recipe">
                      <BookOpen size={14} /> Recipe
                    </Button>
                    <Button variant="secondary" onClick={() => openEditModal(item)} style={{ padding: '4px 8px', minHeight: '36px' }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(item.id)} style={{ padding: '4px 8px', minHeight: '36px' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Edit / Create Menu Item */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
            {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{actionError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Iced Cold Coffee" />
              <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Beverages, Snacks, Burgers" />
              <Input label="Price (₹)" type="number" step="0.5" value={priceRs} onChange={(e) => setPriceRs(e.target.value)} required placeholder="e.g. 120" />
              <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short item description" />

              {/* Photo Upload Field */}
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Dish Photo Upload (Cloudinary)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="avail" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
                <label htmlFor="avail" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Available for Order</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading & Saving...' : 'Save Item'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Recipe Builder */}
      {recipeMenuItem && (
        <RecipeBuilderModal
          menuItem={recipeMenuItem}
          onClose={() => setRecipeMenuItem(null)}
        />
      )}
    </div>
  );
}
