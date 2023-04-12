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

Normalize (long) - 72% (we also handle meta-data)
Denormalize (long) without cache - 100% (same speed)
Denormalize (short) without cache - 600% (6x faster)
Denormalize (long) with cache - 830% (6x faster)
Denormalize (short) with cache - 1120% (11x faster)