/**
 * MAINTENANCE_TIPS Email Template
 *
 * Purpose: Seasonal home maintenance advice
 * Target Open Rate: 40-50% (practical value)
 *
 * Merge Tags Used:
 * - {{subscriber.firstName}}
 * - {{client.propertyAddress}}
 * - {{property.yearBuilt}}
 * - {{client.yearsOwned}}
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
 * import { MaintenanceTipsEmail } from './templates/emails/maintenance-tips';
 *
 * const html = render(<MaintenanceTipsEmail {...data} season="winter" />);
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

interface MaintenanceTipsEmailProps {
  subscriberFirstName?: string;
  propertyAddress?: string;
  yearBuilt?: string;
  yearsOwned?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  companyName?: string;
  companyLogo?: string;
  month?: string;
  year?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

const seasonalContent = {
  spring: {
    icon: '🌸',
    color: '#28a745',
    title: 'Spring Home Maintenance Checklist',
    intro: 'Spring is the perfect time to refresh your home after winter and prepare for warmer weather.',
    tasks: [
      { icon: '🌧️', title: 'Clean Gutters & Downspouts', description: 'Remove debris and check for proper drainage to prevent water damage.' },
      { icon: '🪟', title: 'Inspect Windows & Screens', description: 'Check for drafts, repair screens, and clean windows inside and out.' },
      { icon: '❄️', title: 'Service AC System', description: 'Change filters and schedule professional HVAC inspection before summer.' },
      { icon: '🏡', title: 'Inspect Roof & Siding', description: 'Look for winter damage, missing shingles, or cracks that need repair.' },
      { icon: '🌳', title: 'Landscape Cleanup', description: 'Trim trees/shrubs away from house, refresh mulch, and check irrigation.' },
      { icon: '🚪', title: 'Check Exterior Doors', description: 'Inspect weather stripping and door sweeps for proper seal.' },
    ],
  },
  summer: {
    icon: '☀️',
    color: '#ffc107',
    title: 'Summer Home Maintenance Checklist',
    intro: 'Keep your home cool and efficient during the hot summer months with these essential tasks.',
    tasks: [
      { icon: '❄️', title: 'Maintain AC System', description: 'Replace filters monthly and keep outdoor unit clear of debris.' },
      { icon: '💧', title: 'Check for Leaks', description: 'Inspect plumbing, faucets, and hoses for leaks that waste water.' },
      { icon: '🌲', title: 'Tree & Shrub Care', description: 'Water deeply, prune dead branches, and check for pest damage.' },
      { icon: '🪵', title: 'Inspect Deck & Patio', description: 'Check for rot, splinters, loose boards, and apply sealant if needed.' },
      { icon: '🏠', title: 'Clean Dryer Vent', description: 'Remove lint buildup to prevent fire hazards and improve efficiency.' },
      { icon: '💡', title: 'Inspect Attic Ventilation', description: 'Ensure proper airflow to prevent heat buildup and moisture.' },
    ],
  },
  fall: {
    icon: '🍂',
    color: '#ff6b35',
    title: 'Fall Home Maintenance Checklist',
    intro: 'Prepare your home for winter with these important fall maintenance tasks.',
    tasks: [
      { icon: '🍃', title: 'Clean Gutters Again', description: 'Remove fallen leaves before winter to prevent ice dams.' },
      { icon: '🔥', title: 'Inspect Heating System', description: 'Service furnace, replace filters, and test thermostat before cold weather.' },
      { icon: '🪟', title: 'Seal Air Leaks', description: 'Caulk around windows/doors and add weatherstripping where needed.' },
      { icon: '🚰', title: 'Winterize Outdoor Plumbing', description: 'Drain and shut off outdoor faucets, disconnect hoses, drain sprinklers.' },
      { icon: '🧱', title: 'Check Chimney & Fireplace', description: 'Have chimney cleaned and inspected before using fireplace.' },
      { icon: '🌳', title: 'Trim Trees Near House', description: 'Remove dead branches that could fall during winter storms.' },
    ],
  },
  winter: {
    icon: '❄️',
    color: '#0066cc',
    title: 'Winter Home Maintenance Checklist',
    intro: 'Keep your home safe and warm during the cold winter months with these critical tasks.',
    tasks: [
      { icon: '🔥', title: 'Monitor Heating System', description: 'Change filters monthly and ensure vents are unblocked.' },
      { icon: '🧊', title: 'Prevent Frozen Pipes', description: 'Insulate exposed pipes and let faucets drip during extreme cold.' },
      { icon: '☃️', title: 'Remove Snow & Ice', description: 'Clear walkways, roof snow buildup, and check for ice dams.' },
      { icon: '🚨', title: 'Test Safety Devices', description: 'Check smoke/CO detectors and replace batteries if needed.' },
      { icon: '💨', title: 'Check Insulation', description: 'Inspect attic and crawl space insulation for gaps or damage.' },
      { icon: '🚪', title: 'Reverse Ceiling Fans', description: 'Run fans clockwise to push warm air down and improve heating efficiency.' },
    ],
  },
};

export const MaintenanceTipsEmail = ({
  subscriberFirstName = '{{subscriber.firstName}}',
  propertyAddress = '{{client.propertyAddress}}',
  yearBuilt = '{{property.yearBuilt}}',
  yearsOwned = '{{client.yearsOwned}}',
  agentName = '{{agent.name}}',
  agentPhone = '{{agent.phone}}',
  agentEmail = '{{agent.email}}',
  companyName = '{{company.name}}',
  companyLogo = '{{company.logo}}',
  month = '{{month}}',
  year = '{{year}}',
  season = 'spring',
}: MaintenanceTipsEmailProps) => {
  const content = seasonalContent[season];
  const previewText = `${content.title} for Your Home`;

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
          <Section style={{ ...heroSection, backgroundColor: content.color }}>
            <Text style={heroIcon}>{content.icon}</Text>
            <Heading style={h1}>{content.title}</Heading>
            <Text style={heroSubtext}>{month} {year}</Text>
          </Section>

          {/* Introduction */}
          <Section style={introSection}>
            <Heading style={h2}>Hi {subscriberFirstName},</Heading>
            <Text style={paragraph}>
              {content.intro} Here's your personalized maintenance checklist for{' '}
              <strong>{propertyAddress}</strong>.
            </Text>
            {yearBuilt && (
              <Text style={propertyNote}>
                <strong>💡 Pro Tip:</strong> Built in {yearBuilt}, your home is {new Date().getFullYear() - parseInt(yearBuilt)} years old.
                Homes of this age benefit greatly from regular maintenance to preserve value.
              </Text>
            )}
          </Section>

          {/* Maintenance Tasks */}
          <Section style={tasksSection}>
            <Heading style={h2}>Your {season.charAt(0).toUpperCase() + season.slice(1)} Checklist</Heading>

            {content.tasks.map((task, index) => (
              <Section key={index} style={taskCard}>
                <Row>
                  <Column style={taskIconColumn}>
                    <Text style={taskIcon}>{task.icon}</Text>
                  </Column>
                  <Column style={taskContentColumn}>
                    <Heading style={taskTitle}>{task.title}</Heading>
                    <Text style={taskDescription}>{task.description}</Text>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          {/* Safety Reminders */}
          <Section style={safetySection}>
            <Heading style={h2}>🚨 Safety Reminders</Heading>
            <Section style={safetyBox}>
              <ul style={safetyList}>
                <li style={safetyItem}>Test smoke and carbon monoxide detectors monthly</li>
                <li style={safetyItem}>Replace detector batteries at least annually</li>
                <li style={safetyItem}>Keep fire extinguishers accessible and charged</li>
                <li style={safetyItem}>Review family emergency exit plan</li>
                <li style={safetyItem}>Update emergency contact information</li>
              </ul>
            </Section>
          </Section>

          {/* When to Call a Professional */}
          <Section style={proSection}>
            <Heading style={h2}>When to Call a Professional</Heading>
            <Text style={paragraph}>
              While many maintenance tasks are DIY-friendly, don't hesitate to call professionals for:
            </Text>
            <Row>
              <Column style={proColumn}>
                <Text style={proItem}>⚡ Electrical work</Text>
                <Text style={proItem}>🔧 Plumbing issues</Text>
                <Text style={proItem}>🏠 Roof repairs</Text>
              </Column>
              <Column style={proColumn}>
                <Text style={proItem}>❄️ HVAC servicing</Text>
                <Text style={proItem}>🌳 Tree removal</Text>
                <Text style={proItem}>🧱 Foundation work</Text>
              </Column>
            </Row>
          </Section>

          {/* Maintenance Budget Tip */}
          <Section style={budgetSection}>
            <Heading style={budgetTitle}>💰 Maintenance Budget Tip</Heading>
            <Text style={budgetText}>
              Financial experts recommend setting aside <strong>1-3% of your home's value annually</strong> for
              maintenance and repairs. For older homes, budget closer to 3-4% to stay ahead of wear and tear.
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Heading style={h2}>Need Contractor Recommendations?</Heading>
            <Text style={paragraph}>
              I have a network of trusted, reliable contractors who can help with any home maintenance
              or repair needs. Just reach out!
            </Text>
            <Section style={buttonGroup}>
              <Link href={`mailto:${agentEmail}?subject=Contractor Recommendations`} style={button}>
                Get Recommendations
              </Link>
            </Section>
            <Text style={ctaSubtext}>
              Or call me at{' '}
              <Link href={`tel:${agentPhone}`} style={phoneLink}>
                {agentPhone}
              </Link>
            </Text>
          </Section>

          {/* Printable Checklist */}
          <Section style={printSection}>
            <Text style={printText}>
              📋 <strong>Pro Tip:</strong> Print this email and check off tasks as you complete them.
              Regular maintenance protects your investment and can prevent costly repairs.
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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
  padding: '50px 30px',
  textAlign: 'center' as const,
};

const heroIcon = {
  fontSize: '56px',
  margin: '0 0 20px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 10px',
};

const heroSubtext = {
  color: 'rgba(255, 255, 255, 0.95)',
  fontSize: '16px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0',
};

const introSection = {
  padding: '30px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '22px',
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

const propertyNote = {
  backgroundColor: '#e7f3ff',
  border: '1px solid #0066cc',
  borderRadius: '6px',
  padding: '15px',
  color: '#004085',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '20px 0 0',
};

const tasksSection = {
  padding: '0 30px 30px',
};

const taskCard = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '12px',
};

const taskIconColumn = {
  width: '60px',
  textAlign: 'center' as const,
};

const taskContentColumn = {
  paddingLeft: '10px',
};

const taskIcon = {
  fontSize: '32px',
  margin: '0',
};

const taskTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const taskDescription = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const safetySection = {
  padding: '30px',
  backgroundColor: '#fff3cd',
};

const safetyBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #ffc107',
  borderRadius: '8px',
  padding: '20px',
};

const safetyList = {
  margin: '0',
  paddingLeft: '20px',
};

const safetyItem = {
  color: '#856404',
  fontSize: '14px',
  lineHeight: '1.8',
  marginBottom: '8px',
};

const proSection = {
  padding: '30px',
};

const proColumn = {
  width: '50%',
  padding: '0 10px',
};

const proItem = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const budgetSection = {
  padding: '20px 30px',
  backgroundColor: '#d4edda',
  borderLeft: '4px solid #28a745',
};

const budgetTitle = {
  color: '#155724',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 10px',
};

const budgetText = {
  color: '#155724',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection = {
  padding: '40px 30px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
};

const buttonGroup = {
  margin: '25px 0',
};

const button = {
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

const printSection = {
  padding: '20px 30px',
  backgroundColor: '#e7f3ff',
  borderTop: '1px solid #0066cc',
  borderBottom: '1px solid #0066cc',
};

const printText = {
  color: '#004085',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
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

export default MaintenanceTipsEmail;
