import {
  PathKeys,
  PathArgs,
  KeysToArgs,
  PathArgsAndSearch,
  ShortenPath,
} from '../src/pathTypes';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true
  : false;
// Structural equivalence (handles intersection flattening, e.g. {} & {id: X} ~ {id: X})
type Equiv<A, B> =
  [A] extends [B] ?
    [B] extends [A] ?
      true
    : false
  : false;

// ========== PathKeys ==========

// --- No params ---
type PK_NoParams1 = Expect<Equal<PathKeys<'/users'>, never>>;
type PK_NoParams2 = Expect<Equal<PathKeys<'/'>, never>>;
type PK_NoParams3 = Expect<Equal<PathKeys<'/users/posts'>, never>>;

// --- Basic :name params ---
type PK_Basic1 = Expect<Equal<PathKeys<'/:id'>, 'id'>>;
type PK_Basic2 = Expect<Equal<PathKeys<'/users/:id'>, 'id'>>;
type PK_Basic3 = Expect<
  Equal<PathKeys<'/users/:id/posts/:postId'>, 'id' | 'postId'>
>;
type PK_Basic4 = Expect<Equal<PathKeys<'/:a/:b/:c'>, 'a' | 'b' | 'c'>>;

// --- Wildcards *name ---
type PK_Wild1 = Expect<Equal<PathKeys<'/*path'>, '*path'>>;
type PK_Wild2 = Expect<Equal<PathKeys<'/files/*rest'>, '*rest'>>;
type PK_Wild3 = Expect<Equal<PathKeys<'/:id/*rest'>, 'id' | '*rest'>>;

// --- Optional groups {} ---
// Trailing } in raw key signals optionality
type PK_Opt1 = Expect<Equal<PathKeys<'{/:id}'>, 'id}'>>;
type PK_Opt2 = Expect<Equal<PathKeys<'/users{/:id}'>, 'id}'>>;
type PK_Opt3 = Expect<
  Equal<PathKeys<'{/:attr1}{-:attr2}{-:attr3}'>, 'attr1}' | 'attr2}' | 'attr3}'>
>;
type PK_Opt4 = Expect<Equal<PathKeys<'{/*path}'>, '*path}'>>;
type PK_Opt5 = Expect<
  Equal<PathKeys<'/users/:id{/:action}'>, 'id' | 'action}'>
>;

// --- Quoted parameter names :"name" ---
type PK_Quoted1 = Expect<Equal<PathKeys<'/:"with-dash"'>, '"with-dash"'>>;
type PK_Quoted2 = Expect<Equal<PathKeys<'/*"wild-name"'>, '*"wild-name"'>>;
type PK_Quoted3 = Expect<Equal<PathKeys<'{/:"with-dash"}'>, '"with-dash"}'>>;
type PK_Quoted4 = Expect<Equal<PathKeys<'{/*"wild-name"}'>, '*"wild-name"}'>>;
type PK_Quoted5 = Expect<
  Equal<PathKeys<'/:id/:"with-dash"'>, 'id' | '"with-dash"'>
>;

// --- Escaped characters ---
type PK_Esc1 = Expect<Equal<PathKeys<'/\\:literal/:id'>, 'id'>>;
type PK_Esc2 = Expect<Equal<PathKeys<'/\\*literal/*path'>, '*path'>>;
type PK_Esc3 = Expect<Equal<PathKeys<'/\\}stuff{/:id}'>, 'id}'>>;
type PK_Esc4 = Expect<Equal<PathKeys<'/users/\\:notparam/:real'>, 'real'>>;

// --- Combined patterns ---
type PK_Comb1 = Expect<Equal<PathKeys<'{/*id}:bob'>, '*id}' | 'bob'>>;
type PK_Comb2 = Expect<Equal<PathKeys<'/*id:bob'>, '*id' | 'bob'>>;
type PK_Comb3 = Expect<Equal<PathKeys<'/:id\\,:bob'>, 'id' | 'bob'>>;
type PK_Comb4 = Expect<Equal<PathKeys<'/:id/*bob'>, 'id' | '*bob'>>;

// --- Adjacency edge case (param*wildcard with no separator) ---
type PK_Adj1 = Expect<Equal<PathKeys<'/:a*b:c'>, 'a' | '*b' | 'c'>>;

// --- Generic string path ---
type PK_String = Expect<Equal<PathKeys<string>, string>>;

// ========== PathArgs ==========

// --- No params ---
type PA_NoParams = Expect<Equiv<PathArgs<'/users'>, unknown>>;

// --- Required params ---
type PA_Req1 = Expect<Equiv<PathArgs<'/users/:id'>, { id: string | number }>>;
type PA_Req2 = Expect<
  Equiv<
    PathArgs<'/users/:id/posts/:postId'>,
    { id: string | number; postId: string | number }
  >
>;

// --- Optional params ---
type PA_Opt1 = Expect<Equiv<PathArgs<'{/:id}'>, { id?: string | number }>>;
type PA_Opt2 = Expect<
  Equiv<PathArgs<'/users{/:id}'>, { id?: string | number }>
>;
type PA_Opt3 = Expect<
  Equiv<
    PathArgs<'{/:attr1}{-:attr2}{-:attr3}'>,
    {
      attr1?: string | number;
      attr2?: string | number;
      attr3?: string | number;
    }
  >
>;

// --- Mixed required and optional ---
type PA_Mix1 = Expect<
  Equiv<
    PathArgs<'/users/:id{/:action}'>,
    { action?: string | number } & { id: string | number }
  >
>;
type PA_Mix2 = Expect<
  Equiv<PathArgs<'{/*id}:bob'>, { id?: string[] } & { bob: string | number }>
>;

// --- Wildcards ---
type PA_Wild1 = Expect<Equiv<PathArgs<'/*path'>, { path: string[] }>>;
type PA_Wild2 = Expect<Equiv<PathArgs<'{/*path}'>, { path?: string[] }>>;
type PA_Wild3 = Expect<
  Equiv<PathArgs<'/:id/*rest'>, { id: string | number; rest: string[] }>
>;

// --- Quoted parameter names ---
type PA_Quote1 = Expect<
  Equiv<PathArgs<'/:"with-dash"'>, { 'with-dash': string | number }>
>;
type PA_Quote2 = Expect<
  Equiv<PathArgs<'{/:"with-dash"}'>, { 'with-dash'?: string | number }>
>;
type PA_Quote3 = Expect<
  Equiv<PathArgs<'/*"wild-name"'>, { 'wild-name': string[] }>
>;
type PA_Quote4 = Expect<
  Equiv<PathArgs<'{/*"wild-name"}'>, { 'wild-name'?: string[] }>
>;
type PA_Quote5 = Expect<
  Equiv<
    PathArgs<'/:id/:"with-dash"'>,
    { id: string | number; 'with-dash': string | number }
  >
>;
type PA_Quote6 = Expect<
  Equiv<
    PathArgs<'/:"first-part"{-:"second-part"}'>,
    { 'first-part': string | number } & { 'second-part'?: string | number }
  >
>;

// --- Escaped characters ---
type PA_Esc1 = Expect<
  Equiv<PathArgs<'/\\:literal/:id'>, { id: string | number }>
>;
type PA_Esc2 = Expect<Equiv<PathArgs<'/\\*literal/*path'>, { path: string[] }>>;

// --- All required (multiple) ---
type PA_AllReq = Expect<
  Equiv<PathArgs<'/*id:bob'>, { id: string[]; bob: string | number }>
>;
type PA_AllReq2 = Expect<
  Equiv<PathArgs<'/:id\\,:bob'>, { id: string | number; bob: string | number }>
>;

// --- Adjacency edge case ---
type PA_Adj1 = Expect<
  Equiv<
    PathArgs<'/:a*b:c'>,
    { a: string | number; b: string[]; c: string | number }
  >
>;

// ========== ShortenPath ==========

type SP1 = Expect<Equal<ShortenPath<'/users/:id'>, '/users/'>>;
type SP2 = Expect<
  Equal<ShortenPath<'/users/:id/posts/:postId'>, '/users/:id/posts/'>
>;
type SP3 = Expect<Equal<ShortenPath<'/:id'>, '/'>>;
type SP4 = Expect<Equal<ShortenPath<string>, string>>;

// --- Wildcards ---
type SP_W1 = Expect<Equal<ShortenPath<'/files/*path'>, '/files/'>>;
type SP_W2 = Expect<Equal<ShortenPath<'/*path'>, '/'>>;
type SP_W3 = Expect<
  Equal<ShortenPath<'/repos/:owner/*path'>, '/repos/:owner/'>
>;
type SP_W4 = Expect<
  Equal<ShortenPath<'/api/:version/files/*path'>, '/api/:version/files/'>
>;

// --- Escaped colon/star should not affect result ---
type SP_E1 = Expect<
  Equal<ShortenPath<'http\\://test.com/users/:id'>, 'http\\://test.com/users/'>
>;
type SP_E2 = Expect<Equal<ShortenPath<'/\\*literal/*path'>, '/\\*literal/'>>;

// ========== PathArgsAndSearch ==========

// All-optional path -> Record | undefined
type PAS_AllOpt = Expect<
  Equiv<
    PathArgsAndSearch<'{/:id}'>,
    Record<string, number | string | boolean> | undefined
  >
>;
type PAS_NoParams = Expect<
  Equiv<
    PathArgsAndSearch<'/users'>,
    Record<string, number | string | boolean> | undefined
  >
>;

// Required params -> merged with Record
type PAS_Required = Expect<
  Equiv<
    PathArgsAndSearch<'/users/:id'>,
    { id: string | number } & Record<string, number | string | string[]>
  >
>;
type PAS_Mixed = Expect<
  Equiv<
    PathArgsAndSearch<'/users/:id{/:action}'>,
    { id: string | number } & Record<string, number | string | string[]>
  >
>;

// --- Wildcard params ---
type PAS_Wild = Expect<
  Equiv<
    PathArgsAndSearch<'/*path'>,
    { path: string[] } & Record<string, number | string | string[]>
  >
>;
type PAS_WildMixed = Expect<
  Equiv<
    PathArgsAndSearch<'/users/:id/*rest'>,
    { id: string | number; rest: string[] } & Record<
      string,
      number | string | string[]
    >
  >
>;
type PAS_WildOpt = Expect<
  Equiv<
    PathArgsAndSearch<'{/*path}'>,
    Record<string, number | string | boolean> | undefined
  >
>;
