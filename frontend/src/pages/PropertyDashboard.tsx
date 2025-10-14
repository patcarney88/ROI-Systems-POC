/**
 * Property Intelligence Dashboard
 * Comprehensive property insights with valuation, equity, market activity, and maintenance
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Home,
  AttachMoney,
  Build,
  Notifications,
  Refresh
} from '@mui/icons-material';
import PropertyValueChart from '../components/PropertyValueChart';
import EquityTimeline from '../components/EquityTimeline';
import NeighborhoodMap from '../components/NeighborhoodMap';
import ComparablesTable from '../components/ComparablesTable';
import MaintenanceCalendar from '../components/MaintenanceCalendar';
import AlertsList from '../components/AlertsList';
import RefinanceCard from '../components/RefinanceCard';
import axios from 'axios';

interface PropertyDashboardData {
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    yearBuilt: number;
    squareFeet: number;
    bedrooms: number;
    bathrooms: number;
  };
  valuation: {
    estimatedValue: number;
    lowEstimate: number;
    highEstimate: number;
    confidenceScore: number;
    sources: any[];
    factors: {
      comparableCount: number;
      averageDaysOnMarket: number;
      pricePerSqFt: number;
      quarterOverQuarter: number;
      yearOverYear: number;
      neighborhoodTrend: number;
    };
  };
  equity: {
    propertyValue: number;
    loanBalance: number;
    homeEquity: number;
    equityPercent: number;
    loanToValue: number;
    monthlyPayment: number;
    interestRate: number;
  };
  refinance: {
    currentRate: number;
    currentPayment: number;
    recommendedRate: number;
    newPayment: number;
    monthlySavings: number;
    lifetimeSavings: number;
    breakEvenMonths: number;
    isRecommended: boolean;
    rationale: string;
  };
  neighborhood: {
    zipCode: string;
    newListings: number;
    recentSales: number;
    marketMetrics: {
      activeListings: number;
      averageListPrice: number;
      averageDaysOnMarket: number;
      inventoryMonths: number;
    };
    priceTrends: {
      medianHomePrice: number;
      priceChangeQoQ: number;
      priceChangeYoY: number;
      appreciationRate: number;
    };
  };
  maintenance: {
    upcoming: number;
    overdue: number;
    totalEstimatedCost: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
}

const PropertyDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PropertyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/properties/${id}/dashboard`);

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while loading dashboard');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshValuation = async () => {
    try {
      setRefreshing(true);
      await axios.get(`/api/properties/${id}/valuation?refresh=true`);
      await fetchDashboardData();
    } catch (err: any) {
      setError('Failed to refresh valuation');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDashboardData();
    }
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Property not found'}</Alert>
      </Container>
    );
  }

  const valueChange = data.valuation.factors.yearOverYear;
  const valueChangeColor = valueChange >= 0 ? 'success' : 'error';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
              {data.property.address}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {data.property.city}, {data.property.state} {data.property.zipCode}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefreshValuation}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Valuation'}
          </Button>
        </Box>

        {/* Property Details */}
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip label={`${data.property.propertyType.replace('_', ' ')}`} />
          <Chip label={`${data.property.bedrooms} bed • ${data.property.bathrooms} bath`} />
          <Chip label={`${data.property.squareFeet?.toLocaleString()} sq ft`} />
          <Chip label={`Built ${data.property.yearBuilt}`} />
        </Box>
      </Box>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <Box mb={3}>
          <AlertsList alerts={data.alerts} propertyId={id!} />
        </Box>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Property Value Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="text.secondary">
                  Property Value
                </Typography>
                {valueChange >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
              </Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                ${data.valuation.estimatedValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Range: ${data.valuation.lowEstimate.toLocaleString()} - $
                {data.valuation.highEstimate.toLocaleString()}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={`${valueChange >= 0 ? '+' : ''}${valueChange.toFixed(1)}% YoY`}
                  color={valueChangeColor}
                  size="small"
                />
                <Chip
                  label={`${data.valuation.confidenceScore}% Confidence`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Home Equity Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="text.secondary">
                  Home Equity
                </Typography>
                <AttachMoney color="primary" />
              </Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                ${data.equity.homeEquity.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {data.equity.equityPercent.toFixed(1)}% of property value
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Loan Balance: ${data.equity.loanBalance.toLocaleString()}
                </Typography>
                <Chip
                  label={`${data.equity.loanToValue.toFixed(1)}% LTV`}
                  color="default"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="text.secondary">
                  Maintenance
                </Typography>
                <Build color="action" />
              </Box>
              <Box display="flex" alignItems="baseline" mb={2}>
                <Typography variant="h3" fontWeight="bold">
                  {data.maintenance.upcoming + data.maintenance.overdue}
                </Typography>
                <Typography variant="body1" color="text.secondary" ml={1}>
                  items
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Est. Cost: ${data.maintenance.totalEstimatedCost.toLocaleString()}
              </Typography>
              <Box display="flex" gap={1}>
                {data.maintenance.upcoming > 0 && (
                  <Chip
                    label={`${data.maintenance.upcoming} upcoming`}
                    color="warning"
                    size="small"
                  />
                )}
                {data.maintenance.overdue > 0 && (
                  <Chip
                    label={`${data.maintenance.overdue} overdue`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Refinance Opportunity Card */}
      {data.refinance.isRecommended && (
        <Box mb={4}>
          <RefinanceCard refinance={data.refinance} propertyId={id!} />
        </Box>
      )}

      {/* Tabs Section */}
      <Card elevation={2}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Value & Comparables" />
          <Tab label="Equity & Finances" />
          <Tab label="Neighborhood" />
          <Tab label="Maintenance" />
        </Tabs>

        <CardContent>
          {/* Tab 0: Value & Comparables */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Property Value History
              </Typography>
              <PropertyValueChart propertyId={id!} />

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Comparable Sales
                </Typography>
                <ComparablesTable propertyId={id!} />
              </Box>
            </Box>
          )}

          {/* Tab 1: Equity & Finances */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Equity Timeline
              </Typography>
              <EquityTimeline propertyId={id!} />

              <Box mt={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Monthly Payment Breakdown
                        </Typography>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>Principal & Interest:</Typography>
                          <Typography fontWeight="bold">
                            ${data.equity.monthlyPayment.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>Interest Rate:</Typography>
                          <Typography fontWeight="bold">
                            {data.equity.interestRate.toFixed(2)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Refinance Analysis
                        </Typography>
                        {data.refinance.isRecommended ? (
                          <Alert severity="success">
                            You could save ${data.refinance.monthlySavings.toLocaleString()}/month
                          </Alert>
                        ) : (
                          <Alert severity="info">No refinance opportunity at this time</Alert>
                        )}
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          {data.refinance.rationale}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* Tab 2: Neighborhood */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Neighborhood Activity
              </Typography>
              <NeighborhoodMap propertyId={id!} />

              <Box mt={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recent Activity (30 days)
                        </Typography>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>New Listings:</Typography>
                          <Typography fontWeight="bold">
                            {data.neighborhood.newListings}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>Recent Sales:</Typography>
                          <Typography fontWeight="bold">
                            {data.neighborhood.recentSales}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Market Trends
                        </Typography>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>Median Price:</Typography>
                          <Typography fontWeight="bold">
                            ${data.neighborhood.priceTrends.medianHomePrice.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1}>
                          <Typography>Appreciation (YoY):</Typography>
                          <Chip
                            label={`${data.neighborhood.priceTrends.priceChangeYoY > 0 ? '+' : ''}${data.neighborhood.priceTrends.priceChangeYoY.toFixed(1)}%`}
                            color={
                              data.neighborhood.priceTrends.priceChangeYoY >= 0
                                ? 'success'
                                : 'error'
                            }
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* Tab 3: Maintenance */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Maintenance Schedule
              </Typography>
              <MaintenanceCalendar propertyId={id!} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PropertyDashboard;
