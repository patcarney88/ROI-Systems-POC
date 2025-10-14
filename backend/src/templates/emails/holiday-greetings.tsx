/**
 * HOLIDAY_GREETINGS Email Template
 *
 * Purpose: Holiday greetings from agent and company
 * Target Open Rate: 55-65% (personal connection, warm wishes)
 *
 * Merge Tags Used:
 * - {{subscriber.firstName}}
 * - {{subscriber.fullName}}
 * - {{client.propertyAddress}}
 * - {{agent.name}}
 * - {{agent.phone}}
 * - {{agent.email}}
 * - {{agent.photo}}
 * - {{company.name}}
 * - {{company.logo}}
 * - {{year}}
 *
 * Usage:
 * import { render } from '@react-email/render';
 * import { HolidayGreetingsEmail } from './templates/emails/holiday-greetings';
 *
 * const html = render(<HolidayGreetingsEmail {...data} holiday="thanksgiving" />);
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

interface HolidayGreetingsEmailProps {
  subscriberFirstName?: string;
  subscriberFullName?: string;
  propertyAddress?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentPhoto?: string;
  companyName?: string;
  companyLogo?: string;
  year?: string;
  holiday?: 'thanksgiving' | 'christmas' | 'newyear' | 'spring';
}

const holidayContent = {
  thanksgiving: {
    emoji: '🦃',
    icon: '🍂',
    color: '#ff6b35',
    title: 'Happy Thanksgiving',
    subtitle: 'Grateful for You',
    greeting: 'This Thanksgiving, we want to take a moment to express our heartfelt gratitude for trusting us with one of life\'s most important transactions - your home.',
    message: 'Your trust and confidence mean the world to us. It\'s clients like you who make what we do so rewarding.',
    wishes: 'May your Thanksgiving be filled with warmth, laughter, and cherished moments with loved ones.',
    closing: 'With sincere gratitude',
  },
  christmas: {
    emoji: '🎄',
    icon: '❄️',
    color: '#c41e3a',
    title: 'Merry Christmas',
    subtitle: 'Season\'s Greetings',
    greeting: 'As we celebrate this wonderful season, we want to take a moment to wish you and your family a very Merry Christmas!',
    message: 'Thank you for being such an important part of our journey. Working with amazing clients like you makes our holiday season even brighter.',
    wishes: 'May your home be filled with joy, peace, and the magic of the Christmas season. Here\'s to creating wonderful memories with family and friends!',
    closing: 'Warmest wishes for a Merry Christmas and a Happy New Year',
  },
  newyear: {
    emoji: '🎉',
    icon: '✨',
    color: '#4a5568',
    title: 'Happy New Year',
    subtitle: 'New Beginnings',
    greeting: 'As we welcome a brand new year, we want to thank you for being such a valued client and wish you an incredible year ahead!',
    message: 'The past year has been filled with growth and meaningful connections, and we\'re grateful to have had you as part of our journey.',
    wishes: 'May this new year bring you prosperity, happiness, and continued success in your home and all your endeavors. Here\'s to new opportunities and exciting possibilities!',
    closing: 'Cheers to a fantastic year ahead',
  },
  spring: {
    emoji: '🌸',
    icon: '🌷',
    color: '#28a745',
    title: 'Happy Spring',
    subtitle: 'Season of Renewal',
    greeting: 'Spring has arrived, bringing fresh energy and new beginnings! We hope this beautiful season finds you and your family well.',
    message: 'Just as spring brings growth and renewal to nature, we hope it brings positive changes and wonderful opportunities to your home and life.',
    wishes: 'May this spring season fill your home with warmth, beauty, and the joy of new beginnings. Enjoy the longer days, blooming gardens, and refreshing weather!',
    closing: 'Wishing you a wonderful spring season',
  },
};

export const HolidayGreetingsEmail = ({
  subscriberFirstName = '{{subscriber.firstName}}',
  subscriberFullName = '{{subscriber.fullName}}',
  propertyAddress = '{{client.propertyAddress}}',
  agentName = '{{agent.name}}',
  agentPhone = '{{agent.phone}}',
  agentEmail = '{{agent.email}}',
  agentPhoto = '{{agent.photo}}',
  companyName = '{{company.name}}',
  companyLogo = '{{company.logo}}',
  year = '{{year}}',
  holiday = 'thanksgiving',
}: HolidayGreetingsEmailProps) => {
  const content = holidayContent[holiday];
  const previewText = `${content.title} from ${agentName} and ${companyName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Holiday Theme */}
          <Section style={{ ...headerSection, backgroundColor: content.color }}>
            <Text style={headerEmoji}>{content.emoji}</Text>
            <Heading style={headerTitle}>{content.title}</Heading>
            <Text style={headerSubtitle}>{content.subtitle}</Text>
          </Section>

          {/* Company Logo */}
          <Section style={logoSection}>
            <Img src={companyLogo} width="120" height="40" alt={companyName} style={logo} />
          </Section>

          {/* Personal Greeting */}
          <Section style={greetingSection}>
            <Heading style={h2}>Dear {subscriberFirstName},</Heading>
            <Text style={paragraph}>{content.greeting}</Text>
            <Text style={paragraph}>{content.message}</Text>
            <Text style={paragraph}>{content.wishes}</Text>
          </Section>

          {/* Decorative Quote Box */}
          <Section style={quoteSection}>
            <Text style={quoteIcon}>{content.icon}</Text>
            <Text style={quoteText}>
              {holiday === 'thanksgiving' && '"Gratitude turns what we have into enough."'}
              {holiday === 'christmas' && '"The best gift around the Christmas tree is the presence of family wrapped in love."'}
              {holiday === 'newyear' && '"Tomorrow is the first blank page of a 365-page book. Write a good one."'}
              {holiday === 'spring' && '"No winter lasts forever; no spring skips its turn."'}
            </Text>
          </Section>

          {/* Always Here for You */}
          <Section style={supportSection}>
            <Heading style={h2}>Always Here for You</Heading>
            <Text style={paragraph}>
              While we celebrate the holidays, please know that we're always available if you need
              anything related to your home at <strong>{propertyAddress}</strong>.
            </Text>
            <Text style={paragraph}>
              Whether you have questions about your property, need contractor recommendations, or
              just want to chat about real estate, we're just a phone call away.
            </Text>
          </Section>

          {/* Agent Card */}
          <Section style={agentCard}>
            <Row>
              <Column style={agentCardImageColumn}>
                <Img
                  src={agentPhoto}
                  width="100"
                  height="100"
                  alt={agentName}
                  style={agentCardImage}
                />
              </Column>
              <Column style={agentCardInfoColumn}>
                <Text style={agentCardName}>{agentName}</Text>
                <Text style={agentCardCompany}>{companyName}</Text>
                <Text style={agentCardContact}>
                  <Link href={`tel:${agentPhone}`} style={agentLink}>
                    {agentPhone}
                  </Link>
                </Text>
                <Text style={agentCardContact}>
                  <Link href={`mailto:${agentEmail}`} style={agentLink}>
                    {agentEmail}
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Closing Message */}
          <Section style={closingSection}>
            <Text style={closingText}>{content.closing},</Text>
            <Text style={signatureText}>
              {agentName}
              <br />
              <span style={companyText}>{companyName}</span>
            </Text>
          </Section>

          {/* Holiday Banner */}
          <Section style={{ ...bannerSection, backgroundColor: content.color }}>
            <Text style={bannerText}>
              {content.icon} {content.title} {content.icon}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This message was sent with warm wishes from your friends at {companyName}.
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

const headerSection = {
  padding: '60px 30px',
  textAlign: 'center' as const,
};

const headerEmoji = {
  fontSize: '80px',
  margin: '0 0 20px',
  lineHeight: '1',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 10px',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const headerSubtitle = {
  color: 'rgba(255, 255, 255, 0.95)',
  fontSize: '18px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0',
};

const logoSection = {
  padding: '30px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0e0e0',
};

const logo = {
  maxWidth: '120px',
  height: 'auto',
};

const greetingSection = {
  padding: '40px 30px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '0 0 20px',
};

const quoteSection = {
  backgroundColor: '#f8f9fa',
  border: '3px solid #e0e0e0',
  borderRadius: '10px',
  padding: '40px 30px',
  margin: '0 30px 40px',
  textAlign: 'center' as const,
};

const quoteIcon = {
  fontSize: '48px',
  margin: '0 0 20px',
};

const quoteText = {
  color: '#666666',
  fontSize: '18px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0',
};

const supportSection = {
  padding: '40px 30px',
  backgroundColor: '#fff8e1',
};

const agentCard = {
  backgroundColor: '#ffffff',
  border: '2px solid #e0e0e0',
  borderRadius: '12px',
  padding: '30px',
  margin: '0 30px 40px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

const agentCardImageColumn = {
  width: '120px',
  textAlign: 'center' as const,
};

const agentCardImage = {
  borderRadius: '50%',
  border: '4px solid #0066cc',
};

const agentCardInfoColumn = {
  paddingLeft: '20px',
  verticalAlign: 'middle' as const,
};

const agentCardName = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 5px',
};

const agentCardCompany = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 15px',
};

const agentCardContact = {
  color: '#4a4a4a',
  fontSize: '14px',
  margin: '0 0 5px',
};

const agentLink = {
  color: '#0066cc',
  textDecoration: 'none',
};

const closingSection = {
  padding: '40px 30px',
  textAlign: 'center' as const,
};

const closingText = {
  color: '#4a4a4a',
  fontSize: '18px',
  fontStyle: 'italic' as const,
  margin: '0 0 20px',
};

const signatureText = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.6',
  margin: '0',
};

const companyText = {
  color: '#666666',
  fontSize: '16px',
  fontWeight: '400',
};

const bannerSection = {
  padding: '30px',
  textAlign: 'center' as const,
};

const bannerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '1px',
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

export default HolidayGreetingsEmail;
