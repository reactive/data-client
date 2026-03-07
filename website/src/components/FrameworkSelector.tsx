import { useStorageSlot } from '@docusaurus/theme-common';
import React, { useCallback, useState, useRef, useEffect } from 'react';

import styles from './FrameworkSelector.module.css';

export type Framework = 'react' | 'vue';

const STORAGE_KEY = 'docusaurus.tab.framework';

// React logo SVG
const ReactLogo = () => (
  <svg viewBox="0 0 24 24" className={styles.logo}>
    <path
      fill="currentColor"
      d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85S10.13 13 10.13 12c0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9s-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03s1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26s-1.18-1.63-3.28-2.26c-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26s1.18 1.63 3.28 2.26c.25-.76.55-1.51.89-2.26m9 2.26-.3.51c.31-.05.61-.1.88-.16-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7.64-.35.83-1.82.32-3.96-.77.16-1.58.28-2.4.36-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 0 1 2.4-.36c.48-.67.99-1.31 1.51-1.9z"
    />
  </svg>
);

// Vue logo SVG
const VueLogo = () => (
  <svg viewBox="0 0 24 24" className={styles.logo}>
    <path
      fill="currentColor"
      d="M2 3h3.5L12 15l6.5-12H22L12 21 2 3m4.5 0h3L12 7.58 14.5 3h3L12 13.08 6.5 3z"
    />
  </svg>
);

const frameworks: { value: Framework; label: string; Logo: React.FC }[] = [
  { value: 'react', label: 'React', Logo: ReactLogo },
  { value: 'vue', label: 'Vue', Logo: VueLogo },
];

export function useFrameworkStorage() {
  const [value, storageSlot] = useStorageSlot(STORAGE_KEY);

  const setValue = useCallback(
    (newValue: Framework) => {
      storageSlot.set(newValue);
    },
    [storageSlot],
  );

  // Default to 'react' if no value is set
  const framework: Framework = value === 'vue' ? 'vue' : 'react';

  return [framework, setValue] as const;
}

export default function FrameworkSelector() {
  const [framework, setFramework] = useFrameworkStorage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentFramework = frameworks.find(f => f.value === framework)!;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: Framework) => {
    setFramework(value);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select framework"
        aria-expanded={isOpen}
      >
        <currentFramework.Logo />
        <span>{currentFramework.label}</span>
        <svg className={styles.chevron} viewBox="0 0 12 12">
          <path
            fill="currentColor"
            d="M2.22 4.47a.75.75 0 0 1 1.06 0L6 7.19l2.72-2.72a.75.75 0 0 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L2.22 5.53a.75.75 0 0 1 0-1.06z"
          />
        </svg>
      </button>
      {isOpen && (
        <ul className={styles.dropdown}>
          {frameworks.map(({ value, label, Logo }) => (
            <li key={value}>
              <button
                className={`${styles.option} ${framework === value ? styles.selected : ''}`}
                onClick={() => handleSelect(value)}
              >
                <Logo />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
