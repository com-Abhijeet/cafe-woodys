import { Building2, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import styles from './AboutSection.module.css';

export function AboutSection() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ShieldCheck size={28} color="var(--color-brand)" />
        <div>
          <h3 className={styles.title}>Café Woody's POS & Gaming System</h3>
          <p className={styles.subtitle}>Version 1.0.0 • Production Build</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.infoRow}>
          <Building2 size={18} color="var(--color-brand)" />
          <span className={styles.infoLabel}>Developer:</span>
          <span className={styles.infoValue}>Kosh Technologies, Jalna</span>
        </div>

        <div className={styles.infoRow}>
          <User size={18} color="var(--color-brand)" />
          <span className={styles.infoLabel}>Contact:</span>
          <span className={styles.infoValue}>Abhijeet Shinde</span>
        </div>

        <div className={styles.infoRow}>
          <Phone size={18} color="var(--color-brand)" />
          <span className={styles.infoLabel}>Phone:</span>
          <a href="tel:9370294078" className={styles.infoValue} style={{ textDecoration: 'none' }}>
            +91 93702 94078
          </a>
        </div>

        <div className={styles.infoRow}>
          <Mail size={18} color="var(--color-brand)" />
          <span className={styles.infoLabel}>Email:</span>
          <a href="mailto:contact@getkosh.co.in" className={styles.infoValue} style={{ textDecoration: 'none' }}>
            contact@getkosh.co.in
          </a>
        </div>
      </div>

      <div className={styles.footerNote}>
        Custom engineered for Café Woody's • All Rights Reserved © {new Date().getFullYear()} Kosh Technologies
      </div>
    </div>
  );
}
