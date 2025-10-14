/**
 * Equity Timeline Component
 * Displays equity growth, loan balance, and property value over time
 */

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Box, CircularProgress, Alert, Grid, Card, CardContent, Typography } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EquityTimelineProps {
  propertyId: string;
}

interface FinancialSnapshot {
  snapshotDate: string;
  estimatedValue: number;
  principalBalance: number;
  homeEquity: number;
  equityPercent: number;
  loanToValue: number;
  monthlyPayment: number;
  interestRate: number;
}

const EquityTimeline: React.FC<EquityTimelineProps> = ({ propertyId }) => {
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/properties/${propertyId}/financial-history?limit=12`);

        if (response.data.success) {
          setSnapshots(response.data.data.snapshots);
        } else {
          setError('Failed to load financial history');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load chart data');
        console.error('Financial history fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialHistory();
  }, [propertyId]);

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

  if (snapshots.length === 0) {
    return <Alert severity="info">No financial history available yet</Alert>;
  }

  // Prepare chart data
  const labels = snapshots.map((s) => format(new Date(s.snapshotDate), 'MMM yyyy'));
  const propertyValues = snapshots.map((s) => s.estimatedValue);
  const loanBalances = snapshots.map((s) => s.principalBalance);
  const equityValues = snapshots.map((s) => s.homeEquity);
  const equityPercents = snapshots.map((s) => s.equityPercent);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Property Value',
        data: propertyValues,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
        tension: 0.4
      },
      {
        type: 'line' as const,
        label: 'Loan Balance',
        data: loanBalances,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
        tension: 0.4
      },
      {
        type: 'bar' as const,
        label: 'Home Equity',
        data: equityValues,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line' as const,
        label: 'Equity %',
        data: equityPercents,
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderWidth: 2,
        pointRadius: 3,
        yAxisID: 'y1',
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 3) {
                // Equity % line
                label += context.parsed.y.toFixed(1) + '%';
              } else {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
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
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Calculate statistics
  const currentSnapshot = snapshots[snapshots.length - 1];
  const firstSnapshot = snapshots[0];
  const equityGrowth = currentSnapshot.homeEquity - firstSnapshot.homeEquity;
  const equityGrowthPercent =
    ((currentSnapshot.homeEquity - firstSnapshot.homeEquity) / firstSnapshot.homeEquity) * 100;
  const loanPaydown = firstSnapshot.principalBalance - currentSnapshot.principalBalance;

  return (
    <Box>
      <Box height={400} mb={3}>
        <Chart type="bar" data={chartData} options={options} />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Current Equity
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                ${currentSnapshot.homeEquity.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentSnapshot.equityPercent.toFixed(1)}% of value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Equity Growth
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                +${equityGrowth.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +{equityGrowthPercent.toFixed(1)}% gain
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Loan Paydown
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ${loanPaydown.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Since tracking started
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Current LTV
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {currentSnapshot.loanToValue.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Loan-to-value ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights */}
      <Box mt={3} p={2} bgcolor="rgba(0, 0, 0, 0.02)" borderRadius={2}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          💡 Equity Insights
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          {currentSnapshot.equityPercent >= 20 && (
            <Typography component="li" variant="body2" mb={1}>
              You have {currentSnapshot.equityPercent.toFixed(1)}% equity - you may be eligible to
              remove PMI if applicable
            </Typography>
          )}
          {equityGrowthPercent > 10 && (
            <Typography component="li" variant="body2" mb={1}>
              Your equity has grown {equityGrowthPercent.toFixed(1)}% - great progress!
            </Typography>
          )}
          {currentSnapshot.loanToValue < 80 && (
            <Typography component="li" variant="body2" mb={1}>
              Your LTV is {currentSnapshot.loanToValue.toFixed(1)}% - this may qualify you for
              better refinance rates
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EquityTimeline;
