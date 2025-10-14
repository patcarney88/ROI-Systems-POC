/**
 * AlertStats Component
 * Statistical overview and charts for alert dashboard
 */

import React from 'react';
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { AlertStatistics, AlertType, AlertPriority } from '../types/alert.types';

/**
 * Alert type colors for charts
 */
const alertTypeColors: Record<AlertType, string> = {
  [AlertType.LIKELY_TO_SELL]: '#4caf50',
  [AlertType.LIKELY_TO_BUY]: '#2196f3',
  [AlertType.REFINANCE_OPPORTUNITY]: '#ff9800',
  [AlertType.INVESTMENT_OPPORTUNITY]: '#9c27b0'
};

/**
 * Priority colors for charts
 */
const priorityColors: Record<AlertPriority, string> = {
  [AlertPriority.CRITICAL]: '#f44336',
  [AlertPriority.HIGH]: '#ff9800',
  [AlertPriority.MEDIUM]: '#2196f3',
  [AlertPriority.LOW]: '#9e9e9e'
};

/**
 * AlertStats Props
 */
interface AlertStatsProps {
  statistics: AlertStatistics;
  loading?: boolean;
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend
}) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip
              label={`${trend.positive ? '+' : ''}${trend.value}%`}
              size="small"
              color={trend.positive ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: color,
            width: 56,
            height: 56
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

/**
 * AlertStats Component
 */
export const AlertStats: React.FC<AlertStatsProps> = ({ statistics, loading = false }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography>Loading statistics...</Typography>
      </Box>
    );
  }

  // Prepare data for alert type pie chart
  const alertTypeData = Object.entries(statistics.alertsByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count,
    color: alertTypeColors[type as AlertType]
  }));

  // Prepare data for priority pie chart
  const priorityData = Object.entries(statistics.alertsByPriority).map(
    ([priority, count]) => ({
      name: priority,
      value: count,
      color: priorityColors[priority as AlertPriority]
    })
  );

  // Prepare data for conversion funnel
  const funnelData = [
    { stage: 'New', count: statistics.conversionFunnel.new },
    { stage: 'Acknowledged', count: statistics.conversionFunnel.acknowledged },
    { stage: 'Contacted', count: statistics.conversionFunnel.contacted },
    { stage: 'Converted', count: statistics.conversionFunnel.converted }
  ];

  return (
    <Box>
      {/* Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Alerts"
            value={statistics.totalAlerts}
            icon={<TrendingUpIcon />}
            color="#2196f3"
            subtitle="All time"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Conversion Rate"
            value={`${statistics.conversionRate.toFixed(1)}%`}
            icon={<CheckIcon />}
            color="#4caf50"
            trend={{ value: 12.5, positive: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Avg Confidence"
            value={`${statistics.averageConfidence.toFixed(0)}%`}
            icon={<SpeedIcon />}
            color="#ff9800"
            subtitle="Model accuracy"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Avg Response Time"
            value={`${Math.round(statistics.averageResponseTime)} min`}
            icon={<TimeIcon />}
            color="#9c27b0"
            trend={{ value: -8.3, positive: true }}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Alert Type Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Alerts by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Priority Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Alerts by Priority
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Alert Volume Over Time */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Alert Volume Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.alertVolumeOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2196f3"
                  strokeWidth={2}
                  name="Total Alerts"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Conversion Funnel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Conversion Funnel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Performing Agents */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Top Performing Agents
        </Typography>
        <List>
          {statistics.topPerformingAgents.slice(0, 5).map((agent, index) => (
            <ListItem
              key={agent.agentId}
              sx={{
                borderLeft: index === 0 ? '4px solid #ffd700' : 'none',
                backgroundColor: index === 0 ? '#fffef0' : 'transparent'
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor:
                      index === 0
                        ? '#ffd700'
                        : index === 1
                        ? '#c0c0c0'
                        : index === 2
                        ? '#cd7f32'
                        : '#2196f3'
                  }}
                >
                  {index + 1}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {agent.agentName}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={`${agent.conversionRate.toFixed(1)}% conversion`}
                        size="small"
                        color="success"
                      />
                      <Chip
                        label={`${agent.alertsHandled} handled`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${Math.round(agent.averageResponseTime)} min avg`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AlertStats;
