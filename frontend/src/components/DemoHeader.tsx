import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlayCircle, LogOut, ChevronDown } from 'lucide-react';
import Button from './Button';
import './DemoHeader.css';

export interface DemoHeaderProps {
  dashboardName: string;
  isDemoMode?: boolean;
}

interface DemoDashboard {
  name: string;
  path: string;
}

const demoDashboards: DemoDashboard[] = [
  { name: 'Title Agent Dashboard', path: '/dashboard/title-agent' },
  { name: 'Realtor Dashboard', path: '/dashboard/realtor' },
  { name: 'Homeowner Portal', path: '/dashboard/homeowner' },
  { name: 'Marketing Center', path: '/dashboard/marketing' },
  { name: 'Analytics Dashboard', path: '/dashboard/realtor/analytics' },
  { name: 'Communication Center', path: '/dashboard/realtor/communications' },
];

/**
 * DemoHeader Component
 *
 * Professional header component for demo dashboards.
 * Displays demo mode indicator, dashboard switcher, and exit button.
 *
 * Features:
 * - Sticky positioning at top of dashboard
 * - Demo mode badge with icon
 * - Dropdown menu for switching between demo dashboards
 * - Exit button to return to landing page
 * - Fully accessible with keyboard navigation
 * - Responsive design (stacks on mobile)
 *
 * @example
 * ```tsx
 * <DemoHeader
 *   dashboardName="Title Agent Dashboard"
 *   isDemoMode={true}
 * />
 * ```
 */
export default function DemoHeader({
  dashboardName,
  isDemoMode = true
}: DemoHeaderProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out current dashboard from dropdown
  const otherDashboards = demoDashboards.filter(
    dashboard => dashboard.name !== dashboardName
  );

  // Handle exit demo - navigate to landing page
  const handleExitDemo = () => {
    navigate('/');
  };

  // Toggle dropdown menu
  const handleToggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="demo-header" role="banner">
      <div className="demo-header-container">
        {/* Demo Mode Badge */}
        <div className="demo-badge" role="status" aria-live="polite">
          <PlayCircle
            size={18}
            className="demo-badge-icon"
            aria-hidden="true"
          />
          <span className="demo-badge-text">
            Demo Mode: <strong>{dashboardName}</strong>
          </span>
        </div>

        {/* Actions Container */}
        <div className="demo-header-actions">
          {/* Switch Demo Dropdown */}
          <div className="demo-dropdown" ref={dropdownRef}>
            <button
              className="demo-dropdown-trigger"
              onClick={handleToggleDropdown}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              aria-label="Switch to another demo dashboard"
            >
              <span>Switch Demo</span>
              <ChevronDown
                size={16}
                className={`demo-dropdown-icon ${isDropdownOpen ? 'demo-dropdown-icon-open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="demo-dropdown-menu"
                role="menu"
                aria-label="Available demo dashboards"
              >
                {otherDashboards.map((dashboard) => (
                  <Link
                    key={dashboard.path}
                    to={dashboard.path}
                    className="demo-dropdown-item"
                    role="menuitem"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {dashboard.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Exit Demo Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={LogOut}
            iconPosition="right"
            onClick={handleExitDemo}
            ariaLabel="Exit demo mode and return to landing page"
            className="demo-exit-button"
          >
            Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
