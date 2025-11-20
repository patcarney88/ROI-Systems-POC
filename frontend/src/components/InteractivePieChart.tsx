import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface InteractivePieChartProps {
  data: DataPoint[];
  colors?: string[];
  onSegmentClick?: (segment: DataPoint, index: number) => void;
  width?: string | number;
  height?: number;
}

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, value
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1f2937" fontSize="14" fontWeight="600">
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="#6b7280" fontSize="24" fontWeight="700">
        {value}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function InteractivePieChart({
  data,
  colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
  onSegmentClick,
  width = '100%',
  height = 250
}: InteractivePieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const handleClick = (entry: any, index: number) => {
    if (onSegmentClick) {
      onSegmentClick(entry, index);
    }
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
