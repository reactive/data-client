import { scaleLinear, scaleTime, line, extent, max, min } from 'd3';
import { memo, useMemo } from 'react';

import { formatPrice } from '../../components/formatPrice';

const TICK_LENGTH = 5;
const AXIS_HEIGHT = 20;

function LineChart({ data, width = 500, height = 400 }: Props) {
  const graphDetails = {
    xScale: scaleTime().range([0, width]),
    yScale: scaleLinear().range([height - AXIS_HEIGHT, 0]),
    lineGenerator: line<{ timestamp: number; price_open: number }>(),
  };
  const xRange: [number, number] = extent(
    data,
    candle => new Date(1000 * candle.timestamp),
  ) as any;
  const yExtent = [
    min(data, candle => candle.price_open),
    max(data, candle => candle.price_open),
  ] as [number, number];
  graphDetails.xScale.domain(xRange);
  graphDetails.yScale.domain(yExtent);
  graphDetails.lineGenerator.x((d, i) =>
    graphDetails.xScale(new Date(1000 * d.timestamp)),
  );
  graphDetails.lineGenerator.y(d => graphDetails.yScale(d.price_open));
  const path = graphDetails.lineGenerator(data);

  const ticks = useMemo(() => {
    const pixelsPerTick = 5000;
    const width = xRange[1] - xRange[0];
    const numberOfTicksTarget = 5;

    return graphDetails.xScale.ticks(numberOfTicksTarget).map(value => ({
      value,
      xOffset: graphDetails.xScale(value),
    }));
  }, [graphDetails.xScale]);

  if (!path) return <div>Failed to generate path</div>;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {/* <text
        stroke="#fff"
        style={{
          fontSize: '10px',
          textAnchor: 'middle',
          transform: 'translate(30px,10px)',
        }}
      >
        {formatPrice.format(yExtent[1])}
      </text>
      <text
        stroke="#fff"
        style={{
          fontSize: '10px',
          textAnchor: 'middle',
          transform: `translate(30px,${height - AXIS_HEIGHT}px)`,
        }}
      >
        {formatPrice.format(yExtent[0])}
      </text> */}
      {ticks.map(({ value, xOffset }, i) => (
        <g key={i} transform={`translate(${xOffset}, ${height - AXIS_HEIGHT})`}>
          <line y2={TICK_LENGTH} stroke="currentColor" />
          <text
            stroke="currentColor"
            style={{
              fontSize: '10px',
              textAnchor: 'middle',
              transform: 'translateY(20px)',
            }}
          >
            {formatter.format(value)}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface Props {
  data: { timestamp: number; price_open: number }[];
  width?: number;
  height?: number;
}

const formatter = new Intl.DateTimeFormat('en-US', {
  timeStyle: 'medium',
});

export default memo(LineChart);
