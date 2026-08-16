import styles from './Input.module.css';

export function Input({
  label,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  className = '',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
