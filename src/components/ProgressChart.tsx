import { useState, useMemo } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 48 };
const GRID_LINES = 3;

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

function formatValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export function ProgressChart({
  data,
  color = colors.chart.line,
  height = 180,
  showArea = false,
}: ProgressChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const { minValue, maxValue, points, linePath, areaPath } = useMemo(() => {
    if (data.length === 0 || chartWidth <= 0 || chartHeight <= 0) {
      return { minValue: 0, maxValue: 0, points: [], linePath: '', areaPath: '' };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add 10% padding to the range
    const rangePadding = (max - min) * 0.1 || 1;
    const yMin = Math.max(0, min - rangePadding);
    const yMax = max + rangePadding;
    const yRange = yMax - yMin;

    const computedPoints = data.map((d, i) => {
      const x =
        PADDING.left + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth);
      const y = PADDING.top + chartHeight - ((d.value - yMin) / yRange) * chartHeight;
      return { x, y, date: d.date, value: d.value };
    });

    const linePathStr = computedPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaPathStr =
      data.length > 0
        ? `${linePathStr} L ${computedPoints[computedPoints.length - 1].x} ${PADDING.top + chartHeight} L ${computedPoints[0].x} ${PADDING.top + chartHeight} Z`
        : '';

    return {
      minValue: yMin,
      maxValue: yMax,
      points: computedPoints,
      linePath: linePathStr,
      areaPath: areaPathStr,
    };
  }, [data, chartWidth, chartHeight]);

  if (data.length === 0) {
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onLayout={handleLayout}
        accessibilityLabel="Chart with no data"
      >
        <Text style={{ color: colors.text.tertiary, fontSize: 14 }}>No data</Text>
      </View>
    );
  }

  if (containerWidth === 0) {
    return <View style={{ height }} onLayout={handleLayout} />;
  }

  const gridLines = Array.from({ length: GRID_LINES }, (_, i) => {
    const ratio = (i + 1) / (GRID_LINES + 1);
    const y = PADDING.top + chartHeight * (1 - ratio);
    const value = minValue + (maxValue - minValue) * ratio;
    return { y, value };
  });

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  return (
    <View onLayout={handleLayout} accessibilityLabel={`Chart with ${data.length} data points`}>
      <Svg width={containerWidth} height={height}>
        {/* Horizontal grid lines */}
        {gridLines.map((line, i) => (
          <Line
            key={`grid-${i}`}
            x1={PADDING.left}
            y1={line.y}
            x2={PADDING.left + chartWidth}
            y2={line.y}
            stroke={colors.chart.grid}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Y-axis labels */}
        {gridLines.map((line, i) => (
          <SvgText
            key={`y-label-${i}`}
            x={PADDING.left - 8}
            y={line.y + 4}
            fill={colors.chart.label}
            fontSize={10}
            textAnchor="end"
          >
            {formatValue(line.value)}
          </SvgText>
        ))}

        {/* Area fill */}
        {showArea && areaPath && <Path d={areaPath} fill={colors.chart.area} />}

        {/* Line */}
        {linePath && (
          <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
        )}

        {/* Data point dots */}
        {points.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}

        {/* X-axis: first and last date labels */}
        {data.length >= 1 && (
          <SvgText
            x={PADDING.left}
            y={height - 4}
            fill={colors.chart.label}
            fontSize={10}
            textAnchor="start"
          >
            {formatDate(firstDate)}
          </SvgText>
        )}
        {data.length > 1 && (
          <SvgText
            x={PADDING.left + chartWidth}
            y={height - 4}
            fill={colors.chart.label}
            fontSize={10}
            textAnchor="end"
          >
            {formatDate(lastDate)}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}
