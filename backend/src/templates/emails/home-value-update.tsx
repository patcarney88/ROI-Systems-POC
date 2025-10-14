/**
 * HOME_VALUE_UPDATE Email Template
 *
 * Purpose: Monthly property value updates with market data
 * Target Open Rate: 45-55% (actionable data)
 *
 * Merge Tags Used:
 * - {{subscriber.firstName}}
 * - {{client.propertyAddress}}
 * - {{property.currentValue}}
 * - {{property.valueChange}}
 * - {{property.valueChangePercent}}
 * - {{property.valueDirection}}
 * - {{property.squareFeet}}
 * - {{property.bedrooms}}
 * - {{property.bathrooms}}
 * - {{neighborhood.name}}
 * - {{neighborhood.medianPrice}}
 * - {{neighborhood.averageDaysOnMarket}}
 * - {{agent.name}}
 * - {{agent.phone}}
 * - {{agent.email}}
 * - {{company.name}}
 * - {{company.logo}}
 * - {{month}}
 * - {{year}}
 *
 * Usage:
 * import { render } from '@react-email/render';
 * import { HomeValueUpdateEmail } from './templates/emails/home-value-update';
 *
 * const html = render(<HomeValueUpdateEmail {...data} />);
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface HomeValueUpdateEmailProps {
  subscriberFirstName?: string;
  propertyAddress?: string;
  currentValue?: string;
  valueChange?: string;
  valueChangePercent?: string;
  valueDirection?: string;
  squareFeet?: string;
  bedrooms?: string;
  bathrooms?: string;
  neighborhoodName?: string;
  neighborhoodMedianPrice?: string;
  neighborhoodAverageDaysOnMarket?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  companyName?: string;
  companyLogo?: string;
  month?: string;
  year?: string;
}

export const HomeValueUpdateEmail = ({
  subscriberFirstName = '{{subscriber.firstName}}',
  propertyAddress = '{{client.propertyAddress}}',
  currentValue = '{{property.currentValue}}',
  valueChange = '{{property.valueChange}}',
  valueChangePercent = '{{property.valueChangePercent}}',
  valueDirection = '{{property.valueDirection}}',
  squareFeet = '{{property.squareFeet}}',
  bedrooms = '{{property.bedrooms}}',
  bathrooms = '{{property.bathrooms}}',
  neighborhoodName = '{{neighborhood.name}}',
  neighborhoodMedianPrice = '{{neighborhood.medianPrice}}',
  neighborhoodAverageDaysOnMarket = '{{neighborhood.averageDaysOnMarket}}',
  agentName = '{{agent.name}}',
  agentPhone = '{{agent.phone}}',
  agentEmail = '{{agent.email}}',
  companyName = '{{company.name}}',
  companyLogo = '{{company.logo}}',
  month = '{{month}}',
  year = '{{year}}',
}: HomeValueUpdateEmailProps) => {
  const previewText = `Your ${month} Home Value Report - ${propertyAddress}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src={companyLogo} width="140" height="45" alt={companyName} style={logo} />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Text style={badge}>MONTHLY VALUE REPORT</Text>
            <Heading style={h1}>{month} {year} Home Value Update</Heading>
            <Text style={heroText}>Your Property Investment Report</Text>
          </Section>

          {/* Property Overview */}
          <Section style={propertySection}>
            <Heading style={h2}>Hi {subscriberFirstName},</Heading>
            <Text style={paragraph}>
              Here's your monthly update on <strong>{propertyAddress}</strong>. We monitor your
              home's value so you can stay informed about your largest investment.
            </Text>
          </Section>

          {/* Current Value Card */}
          <Section style={valueCard}>
            <Row>
              <Column style={valueCardLeft}>
                <Text style={valueCardLabel}>Estimated Home Value</Text>
                <Heading style={valueCardAmount}>{currentValue}</Heading>
                <Text
                  style={
                    valueDirection === 'increased' ? valueChangePositive : valueChangeNegative
                  }
                >
                  {valueDirection === 'increased' ? '↑' : '↓'} {valueChangePercent} (
                  {valueChange}) vs. purchase
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Property Details */}
          <Section style={detailsSection}>
            <Heading style={h3}>Property Details</Heading>
            <Row style={detailsRow}>
              <Column style={detailColumn}>
                <Text style={detailLabel}>🏠 Bedrooms</Text>
                <Text style={detailValue}>{bedrooms}</Text>
              </Column>
              <Column style={detailColumn}>
                <Text style={detailLabel}>🛁 Bathrooms</Text>
                <Text style={detailValue}>{bathrooms}</Text>
              </Column>
              <Column style={detailColumn}>
                <Text style={detailLabel}>📏 Sq Feet</Text>
                <Text style={detailValue}>{squareFeet}</Text>
              </Column>
            </Row>
          </Section>

          {/* Market Insights */}
          <Section style={marketSection}>
            <Heading style={h2}>Market Insights: {neighborhoodName}</Heading>
            <Text style={paragraph}>
              Here's what's happening in your neighborhood this month:
            </Text>

            <Section style={insightCard}>
              <Row>
                <Column style={insightColumn}>
                  <Text style={insightIcon}>💰</Text>
                  <Text style={insightLabel}>Median Price</Text>
                  <Text style={insightValue}>{neighborhoodMedianPrice}</Text>
                </Column>
                <Column style={insightColumn}>
                  <Text style={insightIcon}>⏱️</Text>
                  <Text style={insightLabel}>Avg. Days on Market</Text>
                  <Text style={insightValue}>{neighborhoodAverageDaysOnMarket} days</Text>
                </Column>
              </Row>
            </Section>

            <Section style={trendBox}>
              <Text style={trendText}>
                <strong>Market Trend:</strong> The {neighborhoodName} neighborhood is showing{' '}
                {valueDirection === 'increased' ? 'strong growth' : 'steady activity'} this month.
                Properties are selling in an average of {neighborhoodAverageDaysOnMarket} days.
              </Text>
            </Section>
          </Section>

          {/* What This Means */}
          <Section style={meaningSection}>
            <Heading style={h2}>What This Means For You</Heading>
            <ul style={bulletList}>
              <li style={bulletItem}>
                <strong>Equity Growth:</strong> Your home equity has{' '}
                {valueDirection === 'increased' ? 'increased' : 'remained stable'}, building your
                wealth over time
              </li>
              <li style={bulletItem}>
                <strong>Refinancing:</strong>{' '}
                {valueDirection === 'increased'
                  ? 'Increased equity may qualify you for better refinance rates'
                  : 'Contact us to explore current refinancing opportunities'}
              </li>
              <li style={bulletItem}>
                <strong>Future Planning:</strong> Understanding your home's value helps with
                long-term financial planning
              </li>
            </ul>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Heading style={h2}>Want a Detailed Analysis?</Heading>
            <Text style={paragraph}>
              This automated report provides estimates based on market data. For a comprehensive
              valuation and personalized advice, let's connect.
            </Text>
            <Section style={buttonGroup}>
              <Link href={`mailto:${agentEmail}`} style={buttonPrimary}>
                Request Full Valuation
              </Link>
            </Section>
            <Text style={ctaSubtext}>
              Or call me directly at{' '}
              <Link href={`tel:${agentPhone}`} style={phoneLink}>
                {agentPhone}
              </Link>
            </Text>
          </Section>

          {/* Disclaimer */}
          <Section style={disclaimer}>
            <Text style={disclaimerText}>
              <strong>Note:</strong> This estimate is based on automated valuation models (AVM) and
              recent market data. For a precise valuation, we recommend a professional appraisal or
              comparative market analysis (CMA).
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>{agentName}</strong>
              <br />
              {companyName}
              <br />
              <Link href={`tel:${agentPhone}`} style={footerLink}>
                {agentPhone}
              </Link>
              {' | '}
              <Link href={`mailto:${agentEmail}`} style={footerLink}>
                {agentEmail}
              </Link>
            </Text>
            <Hr style={footerHr} />
            <Text style={footerLinks}>
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href="{{preferencesUrl}}" style={footerLink}>
                Email Preferences
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {year} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#ffffff',
  padding: '30px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0e0e0',
};

const logo = {
  maxWidth: '140px',
  height: 'auto',
};

const heroSection = {
  backgroundColor: '#0066cc',
  padding: '40px 30px',
  textAlign: 'center' as const,
};

const badge = {
  display: 'inline-block',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  padding: '6px 12px',
  borderRadius: '3px',
  margin: '0 0 15px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 10px',
};

const heroText = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  margin: '0',
};

const propertySection = {
  padding: '30px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 15px',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 15px',
};

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const valueCard = {
  backgroundColor: '#f8f9fa',
  border: '3px solid #0066cc',
  borderRadius: '8px',
  padding: '30px',
  margin: '0 30px 30px',
};

const valueCardLeft = {
  textAlign: 'center' as const,
};

const valueCardLabel = {
  color: '#666666',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 10px',
};

const valueCardAmount = {
  color: '#0066cc',
  fontSize: '42px',
  fontWeight: '700',
  margin: '0 0 10px',
  lineHeight: '1',
};

const valueChangePositive = {
  color: '#28a745',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const valueChangeNegative = {
  color: '#666666',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const detailsSection = {
  padding: '0 30px 30px',
};

const detailsRow = {
  marginTop: '20px',
};

const detailColumn = {
  width: '33.33%',
  textAlign: 'center' as const,
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  margin: '0 5px',
};

const detailLabel = {
  color: '#666666',
  fontSize: '13px',
  margin: '0 0 8px',
};

const detailValue = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
};

const marketSection = {
  padding: '30px',
  backgroundColor: '#f8f9fa',
};

const insightCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '25px',
  marginBottom: '20px',
};

const insightColumn = {
  width: '50%',
  textAlign: 'center' as const,
  padding: '0 10px',
};

const insightIcon = {
  fontSize: '32px',
  margin: '0 0 10px',
};

const insightLabel = {
  color: '#666666',
  fontSize: '13px',
  margin: '0 0 8px',
};

const insightValue = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
};

const trendBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '6px',
  padding: '20px',
};

const trendText = {
  color: '#856404',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const meaningSection = {
  padding: '30px',
};

const bulletList = {
  margin: '20px 0',
  paddingLeft: '20px',
};

const bulletItem = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.8',
  marginBottom: '15px',
};

const ctaSection = {
  padding: '40px 30px',
  backgroundColor: '#f8f9fa',
  textAlign: 'center' as const,
};

const buttonGroup = {
  margin: '25px 0',
};

const buttonPrimary = {
  backgroundColor: '#0066cc',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const ctaSubtext = {
  color: '#666666',
  fontSize: '14px',
  margin: '15px 0 0',
};

const phoneLink = {
  color: '#0066cc',
  textDecoration: 'none',
  fontWeight: '600',
};

const disclaimer = {
  padding: '20px 30px',
  backgroundColor: '#fffbf0',
  borderLeft: '4px solid #ffc107',
};

const disclaimerText = {
  color: '#666666',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const hr = {
  borderColor: '#e0e0e0',
  margin: '0',
};

const footer = {
  padding: '30px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 15px',
};

const footerHr = {
  borderColor: '#e0e0e0',
  margin: '15px 0',
};

const footerLinks = {
  color: '#666666',
  fontSize: '12px',
  margin: '0 0 10px',
};

const footerLink = {
  color: '#0066cc',
  textDecoration: 'underline',
};

const footerCopyright = {
  color: '#999999',
  fontSize: '11px',
  margin: '0',
};

export default HomeValueUpdateEmail;
