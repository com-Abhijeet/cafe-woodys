import { useState } from 'react';
import { useRecipe } from '../hooks/useRecipe';
import { useInventory } from '../../inventory/hooks/useInventory';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { X, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import styles from './RecipeBuilderModal.module.css';

export function RecipeBuilderModal({ menuItem, onClose }) {
  const { ingredients, isLoading, error, addIngredient, removeIngredient } = useRecipe(menuItem.id);
  const { items: inventoryItems } = useInventory();

  const [selectedInvId, setSelectedInvId] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInventoryItem = inventoryItems.find((i) => i.id === selectedInvId);

  const handleAddLine = async (e) => {
    e.preventDefault();
    setActionError('');

    if (!selectedInvId) {
      setActionError('Please select a raw material ingredient');
      return;
    }

    const qtyVal = parseFloat(qtyInput);
    if (!qtyVal || qtyVal <= 0) {
      setActionError('Quantity per portion sold must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await addIngredient(selectedInvId, qtyVal);
      setSelectedInvId('');
      setQtyInput('');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLine = async (id, name) => {
    if (!confirm(`Remove ${name} from this recipe?`)) return;
    try {
      await removeIngredient(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen color="var(--color-brand)" size={20} />
            <h2 className={styles.title}>Recipe Builder — {menuItem.name}</h2>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {actionError && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', backgroundColor: 'rgba(196,57,43,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              {actionError}
            </div>
          )}

          {/* Current Recipe Ingredients List */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Ingredients Consumed Per Portion Sold:
            </div>

            {isLoading ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading recipe...</p>
            ) : error ? (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{error}</p>
            ) : ingredients.length === 0 ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px dashed var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                <AlertCircle size={16} style={{ marginBottom: '4px' }} />
                <div>No raw material ingredients configured for this item.</div>
                <div style={{ marginTop: '2px', fontWeight: 600 }}>Items without a recipe are sold as-is without raw material stock deduction.</div>
              </div>
            ) : (
              <div className={styles.ingredientList}>
                {ingredients.map((ing) => (
                  <div key={ing.id} className={styles.ingredientRow}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                        {ing.inventoryItem?.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand)', fontWeight: 700 }}>
                        Consumes: {ing.quantity} {ing.inventoryItem?.unit} per portion
                      </div>
                    </div>

                    <Button
                      variant="danger"
                      onClick={() => handleRemoveLine(ing.id, ing.inventoryItem?.name)}
                      style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                    >
                      <Trash2 size={14} /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Ingredient Form */}
          <form onSubmit={handleAddLine} className={styles.addForm}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
              Add Raw Material Ingredient Line
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Select Raw Material
              </label>
              <select
                value={selectedInvId}
                onChange={(e) => setSelectedInvId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '4px' }}
              >
                <option value="">-- Choose Raw Material --</option>
                {inventoryItems.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.unit})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={`Quantity Consumed Per Portion ${selectedInventoryItem ? `(${selectedInventoryItem.unit})` : ''}`}
              type="number"
              step="0.001"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              placeholder="e.g. 0.02 for 20g or 0.20 for 200ml"
            />

            <Button type="submit" disabled={isSubmitting} fullWidth>
              <Plus size={16} /> Add Ingredient to Recipe
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
