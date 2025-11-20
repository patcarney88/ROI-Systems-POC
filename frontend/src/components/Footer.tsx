import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import './Footer.css';

export interface FooterProps {
  isDemoMode?: boolean;
  className?: string;
}

/**
 * Footer Component
 *
 * Professional footer component for ROI Systems.
 * Displays company info, navigation links, legal links, and optional demo mode indicator.
 *
 * Features:
 * - Responsive grid layout (desktop/tablet/mobile)
 * - Demo mode indicator with blue theme (when enabled)
 * - Company branding with logo
 * - Platform, Resources, and Company link columns
 * - Legal links (Privacy Policy, Terms of Service)
 * - Copyright notice
 * - Semantic HTML structure
 * - Fully accessible
 *
 * @example
 * ```tsx
 * // Production mode
 * <Footer />
 *
 * // Demo mode
 * <Footer isDemoMode={true} />
 *
 * // With custom className
 * <Footer isDemoMode={false} className="custom-footer" />
 * ```
 */
export default function Footer({ isDemoMode = false, className = '' }: FooterProps) {
  return (
    <footer className={`main-footer ${className}`}>
      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <div className="footer-demo-indicator" role="status" aria-live="polite">
          <div className="footer-demo-content">
            <PlayCircle
              size={18}
              className="footer-demo-icon"
              aria-hidden="true"
            />
            <span className="footer-demo-text">
              Demo Mode Active - Using mock data
            </span>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12H15V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span>ROI Systems</span>
          </div>
          <p className="footer-tagline">
            Real Estate Document Management & Client Retention Platform
          </p>
        </div>

        {/* Links Sections */}
        <div className="footer-links">
          {/* Platform Column */}
          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/">Dashboard</Link>
            <Link to="/documents">Documents</Link>
            <Link to="/clients">Clients</Link>
            <Link to="/analytics">Analytics</Link>
          </div>

          {/* Resources Column */}
          <div className="footer-column">
            <h4>Resources</h4>
            <Link to="/help">Documentation</Link>
            <Link to="/help">API Reference</Link>
            <Link to="/help">Support</Link>
            <Link to="/help">Status</Link>
          </div>

          {/* Company Column */}
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Careers</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>

      {/* Footer Bottom - Copyright & Legal */}
      <div className="footer-bottom">
        <p>&copy; 2025 ROI Systems. All rights reserved.</p>
        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
