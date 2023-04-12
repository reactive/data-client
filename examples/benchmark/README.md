[Progress over time](https://data-client.github.io/rest-hooks/dev/bench/)

### Usage

To run

```bash
yarn start [suite-name]
```

#### Suites

- `entity` - benchmarks various entity-specific operations
- `normalizr` - benchmarks just normalize/denormalize
- `core` - benchmarks entire operations using Controller
- `old-normalizr` (runs equivalent benchmarks using the normalizr package)

No argument will run `normalizr` + `core`

### Results

Performance compared to normalizr package (higher is better):

|                     | no cache | with cache |
|---------------------|----------|------------|
| normalize (long)    | 72%      | 72%        |
| denormalize (long)  | 100%     | 830%       |
| denormalize (short) | 600%     | 1120%      |

[Comparison done on a Ryzen 7950x; Ubuntu; Node 18.15.0]

Our normalize is slower due to handling much more features like metadata. Denormalize
is even more feature rich, but significantly faster.