import { UserResource } from './resources';

export default function ProfileEdit({ id }: { id: number }) {
  const { user } = useSuspense(UserResource.get, { id });

  const controller = useController();
  const handleChange = ({ currentTarget: { value: name } }) =>
    controller.fetch(UserResource.update, { id, name });

  return (
    <label>
      Name:{' '}
      <input type="text" value={user.name} onChange={handleChange} />
    </label>
  );
}
