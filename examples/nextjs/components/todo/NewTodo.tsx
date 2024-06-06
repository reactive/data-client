import { useController } from '@data-client/react';
import { memo, useCallback } from 'react';
import { TodoResource } from 'resources/TodoResource';
import styles from './NewTodo.module.css'

function NewTodo({ userId }: { userId?: number }) {
  const ctrl = useController();

  const handlePress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(TodoResource.getList.push, {
          userId,
          title: e.currentTarget.value,
        });
        e.currentTarget.value = '';
      }
    },
    [ctrl, userId],
  );

  return (
    <div className={styles.todoBox}>
      <input type="checkbox" name="new" checked={false} disabled />{' '}
      <input className={styles.titleInput} type="text" onKeyDown={handlePress} />
    </div>
  );
}
export default memo(NewTodo);
