import { UserResource } from './resources';

export default function ProfileEdit({ userId }: { userId: number }) {
  const user = useSuspense(UserResource.get, { id: userId });
  const controller = useController();
  const handleChange = ({ currentTarget: { value } }) =>
    controller.fetch(
      UserResource.partialUpdate,
      { id: userId },
      { name: value },
    );
  return (
    <label>
      Name:{' '}
      <input type="text" value={user.name} onChange={handleChange} />
    </label>
  );
}
