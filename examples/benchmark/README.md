[Progress over time](https://reactive.github.io/data-client/dev/bench/)

### Usage

To run

```bash
yarn start [suite-name]
```

#### Suites

- `entity` - benchmarks various entity-specific operations
- `normalizr` - benchmarks just normalize/denormalize
- `core` - benchmarks entire operations using [Controller](https://dataclient.io/docs/api/Controller)
- `old-normalizr` (runs equivalent benchmarks using the normalizr package)

No argument will run `normalizr` + `core`

### Results

Performance compared to normalizr package (higher is better):

|                     | no cache | with cache |
| ------------------- | -------- | ---------- |
| normalize (long)    | 80%      | 80%        |
| denormalize (long)  | 119%     | 838%       |
| denormalize (short) | 544%     | 2,026%     |

[Comparison done on a Ryzen 7950x; Ubuntu; Node 20.10.0]

Not only is denormalize faster, but it is more feature-rich as well.
