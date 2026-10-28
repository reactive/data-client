import { RestEndpoint } from '@data-client/rest';

const validator = (
  address: string,
  moniker: string,
  website: string,
  details: string,
  tokens: string,
) => ({
  operator_address: `cosmosvaloper1${address}`,
  consensus_pubkey: {
    '@type': '/cosmos.crypto.ed25519.PubKey',
    key: 'bW9ja0NvbnNlbnN1c1B1YktleUZvckRvY3NEZW1vcz0=',
  },
  jailed: false,
  status: 'BOND_STATUS_BONDED',
  tokens,
  delegator_shares: `${tokens}.000000000000000000`,
  description: {
    moniker,
    identity: '',
    website,
    security_contact: '',
    details,
  },
  unbonding_height: '0',
  unbonding_time: '1970-01-01T00:00:00Z',
  commission: {
    commission_rates: {
      rate: '0.050000000000000000',
      max_rate: '0.200000000000000000',
      max_change_rate: '0.010000000000000000',
    },
    update_time: '2025-06-12T16:04:21.093482Z',
  },
  min_self_delegation: '1',
});

// Made-up validators in the Cosmos Hub's response shape
const validators = [
  validator(
    'a2kq7zm9d4xw3h8r5t6y0p2s4f7j9l3c8v5b1n',
    'Northwind Staking',
    'https://northwind-staking.example',
    'Bare-metal validators in three regions since 2019.',
    '4821930000000',
  ),
  validator(
    'c7fh2kd9w3m5q8r1t4y6u0p2s5x8z3b7n1v4g6',
    'Lumen Nodes',
    'https://lumen-nodes.example',
    'Carbon-neutral infrastructure for proof-of-stake networks.',
    '3190455000000',
  ),
  validator(
    'e3xp9m2k7d5w1q8h4r6t0y3s9f2j5l7c1v8b4n',
    'Harbor Validator',
    'https://harbor-validator.example',
    'Community-run node. Half of all commission goes to public goods.',
    '2764012000000',
  ),
  validator(
    'g8tq4r1m6k2d9w5h3x7y0p8s1f4j6l2c9v3b5n',
    'Basalt',
    'https://basalt.example',
    'Run by a small team of SREs. Secure, reliable, transparent.',
    '2210378000000',
  ),
  validator(
    'j5nz8w3k1m7d2q9h6r4t0y5s3f8j1l6c4v2b7x',
    'Orbit Labs',
    'https://orbit-labs.example',
    'Validator and relayer operator funding open-source tooling.',
    '1987640000000',
  ),
  validator(
    'm2rv6d9k4w8q1h5t3y7u0p4s6f9j2l8c3v1b5n',
    'Kestrel',
    'https://kestrel.example',
    'Sentry architecture with hardware security modules.',
    '1543209000000',
  ),
  validator(
    'q9wd1k5m3h7r2t8y4u6p0s1f5j3l9c2v6b8n4x',
    'Tidepool',
    'https://tidepool.example',
    'Independent operator. Votes on every governance proposal.',
    '1102786000000',
  ),
  validator(
    't4hm7q2k9d1w6r3y8u5p0s7f2j4l1c6v9b3n8x',
    'Granite Stake',
    'https://granite-stake.example',
    'Enterprise-grade staking with 24/7 on-call monitoring.',
    '894331000000',
  ),
  validator(
    'x6kd3w8m1q5h9r2t7y4u0p6s8f1j3l5c7v2b9n',
    'Fieldstone',
    'https://fieldstone.example',
    'Solo validator from Lisbon. Small, steady, always online.',
    '512870000000',
  ),
];

/** Pages of `pagination.limit` validators, continued from `pagination.key`
 * (the previous page's `next_key`). The endpoint must match `getValidators`
 * in docs/rest/guides/pagination.md */
export const validatorFixtures = [
  {
    endpoint: new RestEndpoint({
      urlPrefix: 'https://rest.cosmos.directory',
      path: '/cosmoshub/cosmos/staking/v1beta1/validators',
    }),
    response({
      'pagination.limit': limit = '100',
      'pagination.key': key,
    }: {
      'pagination.limit'?: string;
      'pagination.key'?: string;
    }) {
      const start = key ? Number(atob(key)) : 0;
      const end = start + Number(limit);
      return {
        validators: validators.slice(start, end),
        pagination: {
          next_key: end < validators.length ? btoa(String(end)) : null,
          total: String(validators.length),
        },
      };
    },
    delay: 300,
  },
];
