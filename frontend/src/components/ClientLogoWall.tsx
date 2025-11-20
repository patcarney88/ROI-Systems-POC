import React from 'react';
import './ClientLogoWall.css';

/**
 * ClientLogoWall Component
 *
 * Displays client/partner logos in a responsive grid or marquee layout.
 * Supports both actual logo images and professional text placeholders.
 *
 * Features:
 * - Responsive grid (6/4/2 columns)
 * - Grayscale filter with color on hover
 * - Dark/light theme support
 * - Professional placeholder design
 * - Smooth animations
 * - Fully accessible
 *
 * Usage:
 * ```tsx
 * // Default usage
 * <ClientLogoWall
 *   title="Trusted by Industry Leaders"
 *   subtitle="Partnering with 500+ title agencies nationwide"
 * />
 *
 * // Custom logos
 * <ClientLogoWall
 *   logos={customLogos}
 *   variant="grid"
 *   columns={6}
 * />
 * ```
 */

interface Logo {
  id: string;
  name: string;           // Company name
  imageUrl?: string;      // Logo image URL (optional)
  placeholderText?: string; // Text to show if no image (e.g., "ABC Title")
  width?: number;         // Logo width in pixels
  height?: number;        // Logo height in pixels
}

interface ClientLogoWallProps {
  logos?: Logo[];         // Logo data (use defaults if not provided)
  title?: string;         // Section title
  subtitle?: string;      // Section subtitle
  variant?: 'grid' | 'marquee'; // Display mode (default: 'grid')
  grayscale?: boolean;    // Show logos in grayscale (default: true)
  columns?: number;       // Number of columns in grid (default: 6)
  className?: string;
}

// Default logo data - realistic title companies and real estate firms
const defaultLogos: Logo[] = [
  { id: '1', name: 'First American Title', placeholderText: 'First American' },
  { id: '2', name: 'Fidelity National Title', placeholderText: 'Fidelity National' },
  { id: '3', name: 'Old Republic Title', placeholderText: 'Old Republic' },
  { id: '4', name: 'Stewart Title', placeholderText: 'Stewart Title' },
  { id: '5', name: 'Chicago Title', placeholderText: 'Chicago Title' },
  { id: '6', name: 'WFG National Title', placeholderText: 'WFG National' },
  { id: '7', name: 'Alliant National Title', placeholderText: 'Alliant' },
  { id: '8', name: 'Westcor Land Title', placeholderText: 'Westcor' },
  { id: '9', name: 'Agents National Title', placeholderText: 'Agents National' },
  { id: '10', name: 'Commonwealth Land Title', placeholderText: 'Commonwealth' },
  { id: '11', name: 'Ticor Title', placeholderText: 'Ticor Title' },
  { id: '12', name: 'Attorneys Title', placeholderText: 'Attorneys Title' }
];

/**
 * LogoPlaceholder Component
 * Displays a professional text placeholder when no logo image is available
 */
const LogoPlaceholder: React.FC<{ name: string }> = ({ name }) => (
  <div className="logo-placeholder" role="img" aria-label={`${name} logo`}>
    <span className="logo-placeholder-text">{name}</span>
  </div>
);

/**
 * LogoItem Component
 * Renders either an image or placeholder for a single logo
 */
const LogoItem: React.FC<{ logo: Logo; grayscale: boolean }> = ({ logo, grayscale }) => {
  const logoClass = `logo-item ${grayscale ? 'logo-grayscale' : ''}`;

  return (
    <li className={logoClass}>
      {logo.imageUrl ? (
        <img
          src={logo.imageUrl}
          alt={`${logo.name} logo`}
          className="logo-image"
          width={logo.width || 180}
          height={logo.height || 80}
          loading="lazy"
        />
      ) : (
        <LogoPlaceholder name={logo.placeholderText || logo.name} />
      )}
    </li>
  );
};

/**
 * ClientLogoWall Component
 */
const ClientLogoWall: React.FC<ClientLogoWallProps> = ({
  logos = defaultLogos,
  title = 'Trusted by Industry Leaders',
  subtitle = 'Partnering with 500+ title agencies nationwide',
  variant = 'grid',
  grayscale = true,
  columns = 6,
  className = ''
}) => {
  const containerClass = `client-logo-wall ${className}`.trim();
  const gridClass = `logo-grid logo-grid-cols-${columns} logo-variant-${variant}`;

  return (
    <section className={containerClass}>
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="logo-wall-header">
          {title && <h2 className="logo-wall-title">{title}</h2>}
          {subtitle && <p className="logo-wall-subtitle">{subtitle}</p>}
        </div>
      )}

      {/* Logo Grid */}
      {variant === 'grid' && (
        <ul className={gridClass} role="list">
          {logos.map((logo) => (
            <LogoItem key={logo.id} logo={logo} grayscale={grayscale} />
          ))}
        </ul>
      )}

      {/* Marquee Variant */}
      {variant === 'marquee' && (
        <div className="logo-marquee" aria-label="Client logos scrolling marquee">
          <ul className="logo-marquee-track" role="list">
            {/* Duplicate logos for seamless loop */}
            {[...logos, ...logos].map((logo, index) => (
              <LogoItem
                key={`${logo.id}-${index}`}
                logo={logo}
                grayscale={grayscale}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ClientLogoWall;
export type { Logo, ClientLogoWallProps };
