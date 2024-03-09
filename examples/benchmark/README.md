[Progress over time](https://reactive.github.io/data-client/dev/bench/)

### Usage

To run

```bash
yarn start [suite-name]
```

#### Suites

- `entity` - benchmarks various entity-specific operations
- `core` - benchmarks entire operations using [Controller](https://dataclient.io/docs/api/Controller)
- `normalizr` - benchmarks just normalize/denormalize
- `old-normalizr` (runs equivalent benchmarks using the normalizr package)

No argument will run `normalizr` + `core`

### Results

Performance compared to normalizr package (higher is better):

|                     | no cache | with cache |
| ------------------- | -------- | ---------- |
| normalize (long)    | 113%     | 113%       |
| denormalize (long)  | 158%     | 1262%      |
| denormalize (short) | 676%     | 2,367%     |

[Comparison done on a Ryzen 7950x; Ubuntu; Node 20.10.0]

Not only is denormalize faster, but it is more feature-rich as well.
