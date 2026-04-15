import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';
import { Temporal } from 'temporal-polyfill';

import { schema, Entity, EntityMixin } from '../..';

describe('Entity.process nested schema via normalize', () => {
  describe('direct entity schema', () => {
    class ChildEntity extends IDEntity {
      readonly slug: string = '';
      static process(input: any): any {
        return { ...input, slug: `child-${input.id}` };
      }
    }
    class Parent extends IDEntity {
      readonly child: ChildEntity = ChildEntity.fromJS({});
      static schema = { child: ChildEntity };
    }

    it('calls nested entity process', () => {
      const result = normalize(Parent, { id: '1', child: { id: '2' } });
      expect(result.entities.ChildEntity?.['2']?.slug).toBe('child-2');
    });

    it('preserves null nested value', () => {
      const result = normalize(Parent, { id: '1', child: null } as any);
      expect(result.entities.Parent?.['1']?.child).toBeNull();
    });

    it('does not touch keys absent from input', () => {
      const result = normalize(Parent, { id: '1' } as any);
      expect(result.entities.Parent?.['1']).toBeDefined();
    });
  });

  describe('array schema', () => {
    class ChildEntity extends IDEntity {
      readonly slug: string = '';
      static process(input: any): any {
        return { ...input, slug: `child-${input.id}` };
      }
    }
    class Parent extends IDEntity {
      readonly children: ChildEntity[] = [];
      static schema = { children: [ChildEntity] };
    }

    it('maps entity process over array items', () => {
      const result = normalize(Parent, {
        id: '1',
        children: [{ id: '2' }, { id: '3' }],
      });
      expect(result.entities.ChildEntity?.['2']?.slug).toBe('child-2');
      expect(result.entities.ChildEntity?.['3']?.slug).toBe('child-3');
    });

    it('handles empty array', () => {
      const result = normalize(Parent, { id: '1', children: [] });
      expect(result.entities.Parent?.['1']?.children).toEqual([]);
    });
  });

  describe('deep chain (3 levels)', () => {
    class GrandchildEntity extends IDEntity {
      readonly tag: string = '';
      static process(input: any): any {
        return { ...input, tag: `gc-${input.id}` };
      }
    }
    class MidEntity extends IDEntity {
      readonly slug: string = '';
      readonly grandchild: GrandchildEntity = GrandchildEntity.fromJS({});
      static schema = { grandchild: GrandchildEntity };
      static process(
        input: any,
        parent: any,
        key: string | undefined,
        args: any[],
      ): any {
        return {
          ...super.process(input, parent, key, args),
          slug: `mid-${input.id}`,
        };
      }
    }
    class Root extends IDEntity {
      readonly mid: MidEntity = MidEntity.fromJS({});
      static schema = { mid: MidEntity };
    }

    it('recursively processes all levels', () => {
      const result = normalize(Root, {
        id: '1',
        mid: { id: '2', grandchild: { id: '3' } },
      });
      expect(result.entities.MidEntity?.['2']?.slug).toBe('mid-2');
      expect(result.entities.GrandchildEntity?.['3']?.tag).toBe('gc-3');
    });
  });

  describe('non-entity schemas', () => {
    it('function/serializable schema stores normalized form', () => {
      class Parent extends IDEntity {
        readonly createdAt: any;
        static schema = { createdAt: Temporal.Instant.from };
      }
      const result = normalize(Parent, {
        id: '1',
        createdAt: '2020-06-07T02:00:15.000Z',
      });
      expect(result.entities.Parent?.['1']?.createdAt).toBe(
        '2020-06-07T02:00:15.000Z',
      );
    });

    it('Collection schema normalizes', () => {
      class Todo extends IDEntity {
        readonly title: string = '';
      }
      class Parent extends IDEntity {
        readonly todos: any;
        static schema = { todos: new schema.Collection([Todo]) };
      }
      const result = normalize(Parent, {
        id: '1',
        todos: [{ id: '10', title: 'hi' }],
      });
      expect(result.entities.Todo?.['10']?.title).toBe('hi');
    });

    it('Values schema normalizes', () => {
      class Todo extends IDEntity {
        readonly title: string = '';
      }
      class Parent extends IDEntity {
        readonly todosById: any;
        static schema = { todosById: new schema.Values(Todo) };
      }
      const result = normalize(Parent, {
        id: '1',
        todosById: { a: { id: '10', title: 'hi' } },
      });
      expect(result.entities.Todo?.['10']?.title).toBe('hi');
    });
  });

  describe('entity with empty schema', () => {
    class Leaf extends IDEntity {
      readonly name: string = '';
    }
    it('shallow copies in process', () => {
      const input = { id: '1', name: 'test' };
      const result = Leaf.process(input, undefined, undefined, []);
      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });
  });
});

describe('process → pk dependency: pk computed from process output', () => {
  it('pk derived from args via process', () => {
    class Stream extends Entity {
      username = '';
      title = '';
      pk() {
        return this.username;
      }

      static key = 'Stream';
      static process(
        input: any,
        _parent: any,
        _key: string | undefined,
        args: any[],
      ): any {
        return { ...input, username: args[0]?.username };
      }
    }
    class Channel extends IDEntity {
      readonly stream: Stream = Stream.fromJS({});
      static schema = { stream: Stream };
    }

    const result = normalize(
      Channel,
      { id: 'ch1', stream: { title: 'Live now' } },
      [{ username: 'alice' }],
    );
    expect(result.entities.Stream?.['alice']).toBeDefined();
    expect(result.entities.Stream?.['alice']?.title).toBe('Live now');
    expect(result.entities.Stream?.['alice']?.username).toBe('alice');
  });

  it('pk derived from parent via process', () => {
    class Comment extends Entity {
      index = 0;
      postId = '';
      pk() {
        return `${this.postId}-${this.index}`;
      }

      static key = 'Comment';
      static process(
        input: any,
        parent: any,
        _key: string | undefined,
        _args: any[],
      ): any {
        return { ...input, postId: parent?.id ?? '' };
      }
    }
    class Post extends IDEntity {
      readonly comments: Comment[] = [];
      static schema = { comments: [Comment] };
    }

    const result = normalize(Post, {
      id: 'p1',
      comments: [
        { index: 1, text: 'first' },
        { index: 2, text: 'second' },
      ],
    });
    expect(result.entities.Comment?.['p1-1']).toBeDefined();
    expect(result.entities.Comment?.['p1-2']).toBeDefined();
    expect(result.entities.Post?.['p1']?.comments).toEqual(['p1-1', 'p1-2']);
  });

  it('pk derived from input transformation in process', () => {
    class Issue extends Entity {
      number = 0;
      owner = '';
      repo = '';
      repositoryUrl = '';
      pk() {
        return `${this.owner}/${this.repo}/${this.number}`;
      }

      static key = 'Issue';
      static process(
        input: any,
        _parent: any,
        _key: string | undefined,
        args: any[],
      ): any {
        const match = input.repositoryUrl?.match(/repos\/([^/]+)\/([^/]+)/);
        return {
          ...input,
          owner: args[0]?.owner ?? match?.[1] ?? '',
          repo: args[0]?.repo ?? match?.[2] ?? '',
        };
      }
    }
    class Repo extends IDEntity {
      readonly issues: Issue[] = [];
      static schema = { issues: [Issue] };
    }

    const result = normalize(Repo, {
      id: 'r1',
      issues: [
        {
          number: 42,
          repositoryUrl: 'https://api.github.com/repos/reactive/data-client',
        },
      ],
    });
    expect(result.entities.Issue?.['reactive/data-client/42']).toBeDefined();
    expect(result.entities.Issue?.['reactive/data-client/42']?.owner).toBe(
      'reactive',
    );
  });

  it('pk derived from combined parent + args + input in process', () => {
    class Cell extends Entity {
      row = 0;
      col = 0;
      sheetId = '';
      workbookId = '';
      pk() {
        return `${this.workbookId}:${this.sheetId}:${this.row},${this.col}`;
      }

      static key = 'Cell';
      static process(
        input: any,
        parent: any,
        _key: string | undefined,
        args: any[],
      ): any {
        return {
          ...input,
          sheetId: parent?.id ?? '',
          workbookId: args[0]?.workbookId ?? '',
        };
      }
    }
    class Sheet extends IDEntity {
      readonly cells: Cell[] = [];
      static schema = { cells: [Cell] };
    }

    const result = normalize(
      Sheet,
      {
        id: 's1',
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
      [{ workbookId: 'wb1' }],
    );
    expect(result.entities.Cell?.['wb1:s1:0,0']).toBeDefined();
    expect(result.entities.Cell?.['wb1:s1:0,1']).toBeDefined();
    expect(result.entities.Sheet?.['s1']?.cells).toEqual([
      'wb1:s1:0,0',
      'wb1:s1:0,1',
    ]);
  });
});

describe('process → invalidation: process returns undefined', () => {
  it('nested entity invalidated when process returns undefined', () => {
    class PriceLevel extends Entity {
      price = 0;
      amount = 0;
      pk() {
        return `${this.price}`;
      }

      static key = 'PriceLevel';
      static process(input: any): any {
        const [price, amount] = input;
        if (amount === 0) return undefined;
        return { price, amount };
      }
    }
    class OrderBook extends IDEntity {
      readonly bids: PriceLevel[] = [];
      static schema = { bids: [PriceLevel] };
    }

    const result = normalize(OrderBook, {
      id: 'ob1',
      bids: [
        [100, 5],
        [200, 0],
        [300, 10],
      ],
    });
    expect(result.entities.PriceLevel?.['100']?.amount).toBe(5);
    expect(result.entities.PriceLevel?.['300']?.amount).toBe(10);
    expect(result.entities.OrderBook?.['ob1']?.bids).toContain('100');
    expect(result.entities.OrderBook?.['ob1']?.bids).toContain('300');
  });
});

describe('process → validate dependency: validate sees process output', () => {
  it('validate passes when process adds required fields', () => {
    class Item extends Entity {
      itemId = '';
      source = '';
      pk() {
        return this.itemId;
      }

      static key = 'Item';
      static process(
        input: any,
        _parent: any,
        _key: string | undefined,
        args: any[],
      ): any {
        return { ...input, source: args[0]?.source ?? 'unknown' };
      }

      static validate(processedEntity: any): string | undefined {
        if (!processedEntity.source || processedEntity.source === 'unknown')
          return 'source is required';
        return;
      }
    }
    class Container extends IDEntity {
      readonly items: Item[] = [];
      static schema = { items: [Item] };
    }

    expect(() =>
      normalize(Container, { id: 'c1', items: [{ itemId: 'i1' }] }, [
        { source: 'api' },
      ]),
    ).not.toThrow();

    const result = normalize(
      Container,
      { id: 'c1', items: [{ itemId: 'i1' }] },
      [{ source: 'api' }],
    );
    expect(result.entities.Item?.['i1']?.source).toBe('api');
  });

  it('validate fails when process does not provide required field', () => {
    class StrictItem extends Entity {
      itemId = '';
      source = '';
      pk() {
        return this.itemId;
      }

      static key = 'StrictItem';
      static process(input: any): any {
        return { ...input };
      }

      static validate(processedEntity: any): string | undefined {
        if (!processedEntity.source) return 'source is required';
        return;
      }
    }
    class Container extends IDEntity {
      readonly items: StrictItem[] = [];
      static schema = { items: [StrictItem] };
    }

    expect(() =>
      normalize(Container, { id: 'c1', items: [{ itemId: 'i1' }] }),
    ).toThrow('source is required');
  });
});

describe('deep nesting: grandchild pk depends on process from args', () => {
  class Metric extends Entity {
    name = '';
    env = '';
    pk() {
      return `${this.env}:${this.name}`;
    }

    static key = 'Metric';
    static process(
      input: any,
      _parent: any,
      _key: string | undefined,
      args: any[],
    ): any {
      return { ...input, env: args[0]?.env ?? 'prod' };
    }
  }
  class Dashboard extends IDEntity {
    readonly metrics: Metric[] = [];
    static schema = { metrics: [Metric] };
  }
  class Workspace extends IDEntity {
    readonly dashboard: Dashboard = Dashboard.fromJS({});
    static schema = { dashboard: Dashboard };
  }

  it('args reach 3rd-level entity and affect its pk', () => {
    const result = normalize(
      Workspace,
      {
        id: 'w1',
        dashboard: {
          id: 'd1',
          metrics: [{ name: 'cpu' }, { name: 'mem' }],
        },
      },
      [{ env: 'staging' }],
    );
    expect(result.entities.Metric?.['staging:cpu']).toBeDefined();
    expect(result.entities.Metric?.['staging:mem']).toBeDefined();
    expect(result.entities.Metric?.['staging:cpu']?.env).toBe('staging');
  });
});

describe('parent is the processed parent entity', () => {
  it('child process sees fields added by parent process', () => {
    class Tag extends Entity {
      label = '';
      parentSlug = '';
      pk() {
        return `${this.parentSlug}:${this.label}`;
      }

      static key = 'Tag';
      static process(
        input: any,
        parent: any,
        _key: string | undefined,
        _args: any[],
      ): any {
        return { ...input, parentSlug: parent?.slug ?? '' };
      }
    }
    class Article extends Entity {
      title = '';
      slug = '';
      pk() {
        return this.slug;
      }

      static key = 'Article';
      static schema = { tags: [Tag] };
      static process(input: any): any {
        return {
          ...input,
          slug: input.title?.toLowerCase().replace(/\s+/g, '-') ?? '',
        };
      }
    }

    const result = normalize(Article, {
      title: 'Hello World',
      tags: [{ label: 'news' }, { label: 'tech' }],
    });
    expect(result.entities.Article?.['hello-world']).toBeDefined();
    expect(result.entities.Tag?.['hello-world:news']).toBeDefined();
    expect(result.entities.Tag?.['hello-world:tech']).toBeDefined();
  });
});

describe('circular references handled by normalize', () => {
  it('normalizes self-referential entities without infinite recursion', () => {
    class User extends IDEntity {
      readonly friends: User[] = [];
      static schema = { friends: [User] };
    }
    const input: any = { id: '123', friends: [] };
    input.friends.push(input);

    const result = normalize(User, input);
    expect(result.result).toBe('123');
    expect(result.entities.User?.['123']?.friends).toEqual(['123']);
  });
});

describe('EntityMixin.process via normalize', () => {
  class ChildData {
    id = '';
    readonly slug: string = '';
  }
  class MixinChild extends EntityMixin(ChildData) {
    static process(input: any): any {
      return { ...input, slug: `child-${input.id}` };
    }
  }

  it('works with EntityMixin the same as Entity', () => {
    class ParentData {
      id = '';
      readonly child: MixinChild = MixinChild.fromJS({});
    }
    class MixinParent extends EntityMixin(ParentData, {
      schema: { child: MixinChild },
    }) {}

    const result = normalize(MixinParent, { id: '1', child: { id: '2' } });
    expect(result.entities.MixinChild?.['2']?.slug).toBe('child-2');
  });

  it('works with array schema via options', () => {
    class ParentData {
      id = '';
      readonly children: MixinChild[] = [];
    }
    class MixinParent extends EntityMixin(ParentData, {
      schema: { children: [MixinChild] },
    }) {}

    const result = normalize(MixinParent, {
      id: '1',
      children: [{ id: '2' }, { id: '3' }],
    });
    expect(result.entities.MixinChild?.['2']?.slug).toBe('child-2');
    expect(result.entities.MixinChild?.['3']?.slug).toBe('child-3');
  });
});
