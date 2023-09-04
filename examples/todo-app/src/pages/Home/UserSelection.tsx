import { useSuspense } from '@data-client/react';
import { styled } from '@linaria/react';
import { UserResource } from 'resources/UserResource';

export default function UserSelection({ userId, setUserId }: Props) {
  const users = useSuspense(UserResource.getList).slice(0, 7);
  return (
    <UserWrap>
      {users.map((user) => (
        <UserLink
          key={user.pk()}
          onClick={(e) => {
            e.preventDefault();
            setUserId(user.id);
          }}
          active={user.id === userId}
          href="#"
        >
          {user.name}
        </UserLink>
      ))}
    </UserWrap>
  );
}

interface Props {
  userId: number;
  setUserId: (v: number) => void;
}

const UserLink = styled.a<{ active: boolean }>`
  display: inline-block;
  text-decoration: none;
  margin: 0 7px;
  color: ${(props) => (props.active ? 'red' : 'blue')};
  &:hover {
    text-decoration: underline;
  }
`;

const UserWrap = styled.div`
  margin-bottom: 20px;
`;
