import { v4 as uuid } from 'uuid';

import PostContainer from './PostContainer';
import { UserResource, PostResource } from './resources';

export default function NewPost({ userId }: { userId: number }) {
  const author = useSuspense(UserResource.get, {
    id: userId,
  });
  const controller = useController();

  return (
    <PostContainer author={author}>
      <input
        type="text"
        onKeyDown={async e => {
          if (e.key === 'Enter') {
            controller.fetch(PostResource.create, {
              id: randomId(),
              userId,
              title: e.currentTarget.value,
            });
            e.currentTarget.value = '';
          }
        }}
      />
    </PostContainer>
  );
}

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
