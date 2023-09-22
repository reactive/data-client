import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import styles from './GithubStarsButton.module.css';

export function GithubStarsButton({ className }: Props) {
  const [stars, setStars] = useState<string>();

  const fetchStars = async () => {
    const res = await fetch(
      'https://api.github.com/repos/reactive/data-client',
    );
    const data = (await res.json()) as { stargazers_count: number };
    if (typeof data?.stargazers_count === 'number') {
      setStars(new Intl.NumberFormat().format(data.stargazers_count));
    }
  };

  useEffect(() => {
    fetchStars().catch(console.error);
  }, []);

  return (
    <a
      href="https://github.com/reactive/data-client/stargazers"
      target="_blank"
      className={clsx(
        'button button--secondary',
        className,
        styles.GithubStars,
      )}
      rel="noreferrer"
    >
      <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="3"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        height="18"
        width="18"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>Star</span>
      <span
        style={{ transition: 'max-width 1s, opacity 1s' }}
        className={clsx(stars ? styles.done : styles.loading, styles.count)}
      >
        {stars}
      </span>
    </a>
  );
}

type Props = {
  className?: string;
};
