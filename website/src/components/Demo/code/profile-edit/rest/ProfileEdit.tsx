import { UserResource } from './resources';

export default function ProfileEdit({ userId }: { userId: number }) {
  const user = useSuspense(UserResource.get, {
    id: userId,
  });
  const controller = useController();
  return (
    <div>
      <label>
        Name:{' '}
        <input
          type="text"
          value={user.name}
          onChange={e =>
            controller.fetch(
              UserResource.partialUpdate,
              { id: userId },
              { name: e.currentTarget.value },
            )
          }
        />
      </label>
    </div>
  );
}
