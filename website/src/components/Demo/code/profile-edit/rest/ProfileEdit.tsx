import { UserResource } from './resources';

export default function ProfileEdit({ userId }: { userId: number }) {
  const user = useSuspense(UserResource.get, { id: userId });
  const controller = useController();
  const handleChange = e =>
    controller.fetch(
      UserResource.partialUpdate,
      { id: userId },
      { name: e.currentTarget.value },
    );
  return (
    <div>
      <label>
        Name:{' '}
        <input
          type="text"
          value={user.name}
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
