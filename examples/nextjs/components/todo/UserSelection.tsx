'use client';
import { useSuspense } from '@data-client/react';
import { UserResource } from '../../resources/UserResource';
import Link from 'next/link';
import styles from './UserSelect.module.css';
import clsx from 'clsx';

export default function UserSelection({ userId }: { userId?: number }) {
  const users = useSuspense(UserResource.getList).slice(0, 7);
  return (
    <div className={styles.wrap}>
      {users.map(user => (
        <Link
          key={user.pk()}
          href={`/${user.id === 1 ? '' : user.id}`}
          className={clsx(styles.userLink, {
            [styles.active]: user.id == userId,
          })}
        >
          {user.name}
        </Link>
      ))}
    </div>
  );
}
