/**
 * Property Value Chart Component
 * Displays historical property valuations with confidence intervals
 */

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Box, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PropertyValueChartProps {
  propertyId: string;
}

interface ValuationData {
  date: string;
  value: number;
  lowEstimate: number;
  highEstimate: number;
  confidenceScore: number;
  source: string;
  quarterOverQuarter?: number;
  yearOverYear?: number;
}

const PropertyValueChart: React.FC<PropertyValueChartProps> = ({ propertyId }) => {
  const [valuations, setValuations] = useState<ValuationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(20); // Default 20 data points

  useEffect(() => {
    const fetchValuationHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `/api/properties/${propertyId}/valuation-history?limit=${timeRange}`
        );

        if (response.data.success) {
          setValuations(response.data.data.valuations);
        } else {
          setError('Failed to load valuation history');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load chart data');
        console.error('Valuation history fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchValuationHistory();
  }, [propertyId, timeRange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (valuations.length === 0) {
    return <Alert severity="info">No valuation history available yet</Alert>;
  }

  // Prepare chart data
  const labels = valuations.map((v) => format(new Date(v.date), 'MMM yyyy'));
  const values = valuations.map((v) => v.value);
  const lowEstimates = valuations.map((v) => v.lowEstimate);
  const highEstimates = valuations.map((v) => v.highEstimate);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Estimated Value',
        data: values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4
      },
      {
        label: 'Low Estimate',
        data: lowEstimates,
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
        fill: false
      },
      {
        label: 'High Estimate',
        data: highEstimates,
        borderColor: 'rgba(54, 162, 235, 0.5)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.4,
        fill: '-1' // Fill between this line and previous
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }

            // Add confidence score for estimated value line
            if (context.datasetIndex === 0 && valuations[context.dataIndex]) {
              const confidence = valuations[context.dataIndex].confidenceScore;
              label += ` (${confidence}% confidence)`;
            }

            return label;
          },
          afterLabel: function (context: any) {
            // Add YoY change for estimated value line
            if (context.datasetIndex === 0 && valuations[context.dataIndex].yearOverYear) {
              const yoy = valuations[context.dataIndex].yearOverYear!;
              return `YoY Change: ${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <MenuItem value={5}>Last 5 quarters</MenuItem>
            <MenuItem value={10}>Last 10 quarters</MenuItem>
            <MenuItem value={20}>Last 20 quarters</MenuItem>
            <MenuItem value={40}>All history</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box height={400}>
        <Line data={chartData} options={options} />
      </Box>

      {/* Summary Statistics */}
      <Box
        display="flex"
        justifyContent="space-around"
        mt={3}
        p={2}
        bgcolor="rgba(0, 0, 0, 0.02)"
        borderRadius={2}
      >
        <Box textAlign="center">
          <Box fontSize="0.875rem" color="text.secondary" mb={0.5}>
            Current Value
          </Box>
          <Box fontSize="1.25rem" fontWeight="bold">
            ${values[values.length - 1]?.toLocaleString()}
          </Box>
        </Box>

        <Box textAlign="center">
          <Box fontSize="0.875rem" color="text.secondary" mb={0.5}>
            Total Change
          </Box>
          <Box
            fontSize="1.25rem"
            fontWeight="bold"
            color={
              values[values.length - 1] > values[0] ? 'success.main' : 'error.main'
            }
          >
            {values[values.length - 1] > values[0] ? '+' : ''}$
            {(values[values.length - 1] - values[0]).toLocaleString()}
          </Box>
        </Box>

        <Box textAlign="center">
          <Box fontSize="0.875rem" color="text.secondary" mb={0.5}>
            Percent Change
          </Box>
          <Box
            fontSize="1.25rem"
            fontWeight="bold"
            color={
              values[values.length - 1] > values[0] ? 'success.main' : 'error.main'
            }
          >
            {values[values.length - 1] > values[0] ? '+' : ''}
            {(
              ((values[values.length - 1] - values[0]) / values[0]) *
              100
            ).toFixed(1)}
            %
          </Box>
        </Box>

        <Box textAlign="center">
          <Box fontSize="0.875rem" color="text.secondary" mb={0.5}>
            Avg Confidence
          </Box>
          <Box fontSize="1.25rem" fontWeight="bold" color="primary.main">
            {Math.round(
              valuations.reduce((sum, v) => sum + v.confidenceScore, 0) /
                valuations.length
            )}
            %
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PropertyValueChart;
