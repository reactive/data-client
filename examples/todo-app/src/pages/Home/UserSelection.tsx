import { useSuspense } from '@data-client/react';
import { styled } from '@linaria/react';
import { UserResource } from 'resources/UserResource';

export default function UserSelection({ userId, setUserId }: Props) {
  const users = useSuspense(UserResource.getList);
  return (
    <NavUsers>
      <UserLinks>
        {users.map((user) => (
          <UserLink
            key={user.pk()}
            onClick={(e) => {
              e.preventDefault();
              setUserId(user.id);
            }}
            active={user.id === userId}
            href="#"
            title={user.name}
          >
            <UserAvatar
              src={user.profileImage}
              alt={user.name}
              active={user.id === userId}
            />
            <UserLinkText>{user.name}</UserLinkText>
          </UserLink>
        ))}
      </UserLinks>
    </NavUsers>
  );
}

interface Props {
  userId: number;
  setUserId: (v: number) => void;
}

const NavUsers = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow: hidden;
`;

const UserLinks = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  padding: 4px 0;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const UserLink = styled.a<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${(props) =>
    props.active ? 'white' : 'rgba(255, 255, 255, 0.15)'};
  border: 2px solid ${(props) => (props.active ? 'white' : 'transparent')};
  border-radius: 20px;
  color: ${(props) => (props.active ? '#667eea' : 'white')};
  text-decoration: none;
  font-size: 14px;
  font-weight: ${(props) => (props.active ? '600' : '500')};
  white-space: nowrap;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: ${(props) =>
      props.active ? 'white' : 'rgba(255, 255, 255, 0.25)'};
    transform: translateY(-1px);
  }
`;

const UserAvatar = styled.img<{ active: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid
    ${(props) => (props.active ? '#667eea' : 'rgba(255, 255, 255, 0.5)')};
`;

const UserLinkText = styled.span`
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    display: none;
  }
`;
