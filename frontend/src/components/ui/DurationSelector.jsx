import React, { useState } from 'react';
import styles from './DurationSelector.module.css';

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 }
];

export default function DurationSelector({ value, onChange }) {
  const [customValue, setCustomValue] = useState(
    PRESETS.some((p) => p.minutes === value) ? '' : value || ''
  );

  const handleSelectPreset = (minutes) => {
    setCustomValue('');
    onChange(minutes);
  };

  const handleCustomChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setCustomValue(e.target.value);
    if (!isNaN(val) && val > 0) {
      onChange(val);
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>Select Duration</label>
      <div className={styles.presetsGrid}>
        {PRESETS.map((p) => {
          const isSelected = value === p.minutes && !customValue;
          return (
            <button
              key={p.minutes}
              type="button"
              className={`${styles.presetBtn} ${isSelected ? styles.active : ''}`}
              onClick={() => handleSelectPreset(p.minutes)}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className={styles.customGroup}>
        <span className={styles.customLabel}>Or enter custom minutes:</span>
        <input
          type="number"
          min="1"
          placeholder="e.g. 75"
          className={styles.customInput}
          value={customValue}
          onChange={handleCustomChange}
        />
      </div>
    </div>
  );
}
