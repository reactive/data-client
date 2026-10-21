'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

const transform = require('../v0.15');

describe('v0.15 codemod', () => {
  // ── useDebounce ──────────────────────────────────────────────────────

  describe('transformUseDebounce', () => {
    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/react';
const x = useDebounce(val, 100);
      `,
      `
import { useDebounce } from '@data-client/react';
const [x] = useDebounce(val, 100);
      `,
      'transforms plain binding to array destructuring with @data-client/react import',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/react';
const [x] = useDebounce(val, 100);
      `,
      `
import { useDebounce } from '@data-client/react';
const [x] = useDebounce(val, 100);
      `,
      'skips already-destructured useDebounce',
    );

    defineInlineTest(
      transform,
      {},
      `
function useDebounce(val, delay) { return val; }
const x = useDebounce(val, 100);
      `,
      `
function useDebounce(val, delay) { return val; }
const x = useDebounce(val, 100);
      `,
      'skips useDebounce without @data-client import',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/vue';
const x = useDebounce(val, 100);
      `,
      `
import { useDebounce } from '@data-client/vue';
const [x] = useDebounce(val, 100);
      `,
      'transforms useDebounce with @data-client/vue import',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/react';
const x = useDebounce(val, 100);
const y = useDebounce(other, 200);
      `,
      `
import { useDebounce } from '@data-client/react';
const [x] = useDebounce(val, 100);
const [y] = useDebounce(other, 200);
      `,
      'transforms multiple useDebounce calls in one file',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/react/next';
const x = useDebounce(val, 100);
      `,
      `
import { useDebounce } from '@data-client/react/next';
const x = useDebounce(val, 100);
      `,
      'skips useDebounce imported from @data-client/react/next',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce as useMyDebounce } from '@data-client/react';
const x = useMyDebounce(val, 100);
      `,
      `
import { useDebounce as useMyDebounce } from '@data-client/react';
const [x] = useMyDebounce(val, 100);
      `,
      'handles aliased useDebounce import',
    );

    defineInlineTest(
      transform,
      {},
      `
import { useDebounce } from '@data-client/react';
const x: T = useDebounce(val, 100);
      `,
      `
import { useDebounce } from '@data-client/react';
const [x] = useDebounce(val, 100);
      `,
      'drops explicit identifier annotation when converting to array destructuring',
    );
  });

  // ── entityMeta ───────────────────────────────────────────────────────

  describe('transformEntityMeta', () => {
    defineInlineTest(
      transform,
      {},
      `
const meta = state.entityMeta;
      `,
      `
const meta = state.entitiesMeta;
      `,
      'renames .entityMeta to .entitiesMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { 'entityMeta': value };
      `,
      `
const obj = { 'entitiesMeta': value };
      `,
      'renames string literal key entityMeta to entitiesMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { entityMeta: value };
      `,
      `
const obj = { entitiesMeta: value };
      `,
      'renames identifier key entityMeta to entitiesMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const { entityMeta } = state;
      `,
      `
const { entitiesMeta: entityMeta } = state;
      `,
      'renames object pattern key entityMeta while preserving local binding',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { entityMeta };
      `,
      `
const obj = { entitiesMeta: entityMeta };
      `,
      'renames shorthand object literal key while preserving local binding',
    );

    defineInlineTest(
      transform,
      {},
      `
const x = state.entities;
const y = state.indexes;
      `,
      `
const x = state.entities;
const y = state.indexes;
      `,
      'does not touch files without entityMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const meta = state?.entityMeta;
      `,
      `
const meta = state?.entitiesMeta;
      `,
      'renames optional chaining state?.entityMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const entityMeta = 'entityMeta';
const meta = state[entityMeta];
      `,
      `
const entityMeta = 'entityMeta';
const meta = state[entityMeta];
      `,
      'does not rewrite computed member state[entityMeta]',
    );

    defineInlineTest(
      transform,
      {},
      `
const entityMeta = 'entityMeta';
const meta = state?.[entityMeta];
      `,
      `
const entityMeta = 'entityMeta';
const meta = state?.[entityMeta];
      `,
      'does not rewrite computed optional member state?.[entityMeta]',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { entityMeta: value };
      `,
      `
const obj = { entitiesMeta: value };
      `,
      'renames identifier key entityMeta to entitiesMeta in object literal',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { entityMeta };
      `,
      `
const obj = { entitiesMeta: entityMeta };
      `,
      'expands shorthand entityMeta in object literal',
    );

    defineInlineTest(
      transform,
      {},
      `
const { entityMeta } = state;
      `,
      `
const { entitiesMeta: entityMeta } = state;
      `,
      'renames shorthand destructuring key to entitiesMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const { entityMeta: meta } = state;
      `,
      `
const { entitiesMeta: meta } = state;
      `,
      'renames non-shorthand destructuring key to entitiesMeta',
    );

    defineInlineTest(
      transform,
      {},
      `
const obj = { [entityMeta]: value };
      `,
      `
const obj = { [entityMeta]: value };
      `,
      'does not rewrite computed identifier property key',
    );
  });

  // ── MemoCache state consolidation ────────────────────────────────────

  describe('transformMemoCacheState', () => {
    defineInlineTest(
      transform,
      {},
      `
memo.buildQueryKey(schema, args, state.entities, state.indexes, key);
      `,
      `
memo.buildQueryKey(schema, args, state, key);
      `,
      'consolidates buildQueryKey state.entities/state.indexes into state with trailing args',
    );

    defineInlineTest(
      transform,
      {},
      `
memo.query(schema, args, state.entities, state.indexes);
      `,
      `
memo.query(schema, args, state);
      `,
      'consolidates query state.entities/state.indexes into state',
    );

    defineInlineTest(
      transform,
      {},
      `
memo.buildQueryKey(schema, args, state.entities, other.indexes, key);
      `,
      `
memo.buildQueryKey(schema, args, state.entities, other.indexes, key);
      `,
      'skips when base objects differ (state vs other)',
    );

    defineInlineTest(
      transform,
      {},
      `
this.memo.buildQueryKey(schema, args, state.entities, state.indexes, key);
      `,
      `
this.memo.buildQueryKey(schema, args, state, key);
      `,
      'handles this.memo.buildQueryKey pattern',
    );
  });

  // ── INVALID import → delegate.INVALID ────────────────────────────────

  describe('transformInvalid', () => {
    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
if (result === INVALID) {}
      `,
      `
if (result === delegate.INVALID) {}
      `,
      'removes INVALID import and replaces usage with delegate.INVALID',
    );

    defineInlineTest(
      transform,
      {},
      `
import { Entity, INVALID } from '@data-client/endpoint';
const x = INVALID;
      `,
      `
import { Entity } from '@data-client/endpoint';
const x = delegate.INVALID;
      `,
      'removes only INVALID specifier when other specifiers exist',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
if (a === INVALID) {}
if (b === INVALID) {}
      `,
      `
if (a === delegate.INVALID) {}
if (b === delegate.INVALID) {}
      `,
      'replaces multiple INVALID usages in same file',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
delegate.setEntity(this, pk, INVALID);
      `,
      `
delegate.invalidate(this, pk);
      `,
      'transforms delegate.setEntity(schema, pk, INVALID) to delegate.invalidate(schema, pk)',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
delegate.setEntity(this, pk, INVALID);
if (!found) return INVALID;
      `,
      `
delegate.invalidate(this, pk);
if (!found) return delegate.INVALID;
      `,
      'handles both setEntity and return INVALID in same file',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
const x = obj.INVALID;
      `,
      `
const x = obj.INVALID;
      `,
      'does not replace INVALID in member expression property position',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from '@data-client/endpoint';
export { INVALID };
      `,
      `
import { INVALID } from '@data-client/endpoint';
export { INVALID };
      `,
      'keeps INVALID import for local export specifier',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID } from "@data-client/endpoint";
export { INVALID };
      `,
      `
import { INVALID } from "@data-client/endpoint";
export { INVALID };
      `,
      'does not rewrite file when INVALID import is only used by local export',
    );

    defineInlineTest(
      transform,
      {},
      `
import { INVALID as BAD } from '@data-client/endpoint';
const x = BAD;
export { BAD as INVALID };
      `,
      `
import { INVALID as BAD } from '@data-client/endpoint';
const x = delegate.INVALID;
export { BAD as INVALID };
      `,
      'does not rewrite export specifier identifiers when local is aliased',
    );
  });

  // ── No-op ────────────────────────────────────────────────────────────

  describe('no-op', () => {
    defineInlineTest(
      transform,
      {},
      `
const x = 1;
      `,
      `
const x = 1;
      `,
      'returns unchanged source when no relevant patterns found',
    );
  });
});
