/**
 * Navigation Bar Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired navigation with Dark Teal theme and enterprise functionality
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Navigation item interface
interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'error' | 'warning' | 'success';
  };
  children?: NavItem[];
}

// User profile interface
interface UserProfile {
  name: string;
  email: string;
  role: string;
  agency: string;
  avatar?: string;
  initials: string;
}

export interface NavbarProps {
  logo?: React.ReactNode;
  brand?: string;
  navigation: NavItem[];
  user?: UserProfile;
  onSignOut?: () => void;
  onProfileClick?: () => void;
  className?: string;
  sticky?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  logo,
  brand = 'ROI Systems',
  navigation,
  user,
  onSignOut,
  onProfileClick,
  className,
  sticky = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (activeDropdown) setActiveDropdown(null);
  };

  const toggleDropdown = (itemLabel: string) => {
    setActiveDropdown(activeDropdown === itemLabel ? null : itemLabel);
  };

  return (
    <nav
      className={cn(
        'bg-background-card border-b border-border-primary',
        'shadow-sm z-40',
        sticky && 'sticky top-0',
        className
      )}
    >
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}
            <div className="text-xl font-medium text-text-primary">
              {brand}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  // Dropdown Menu
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDropdown(item.label)}
                      className={cn(
                        'flex items-center gap-2',
                        activeDropdown === item.label && 'bg-background-secondary'
                      )}
                    >
                      {item.icon}
                      {item.label}
                      {item.badge && (
                        <Badge
                          variant={item.badge.variant}
                          size="xs"
                        >
                          {item.badge.text}
                        </Badge>
                      )}
                      <svg
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          activeDropdown === item.label && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>

                    {/* Dropdown Content */}
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-background-card border border-border-primary rounded-lg shadow-lg py-1 z-50">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm',
                              'text-text-secondary hover:text-text-primary',
                              'hover:bg-background-secondary',
                              'transition-colors duration-200'
                            )}
                          >
                            {child.icon}
                            {child.label}
                            {child.badge && (
                              <Badge
                                variant={child.badge.variant}
                                size="xs"
                                className="ml-auto"
                              >
                                {child.badge.text}
                              </Badge>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular Nav Link
                  <a
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      'text-text-secondary hover:text-text-primary',
                      'hover:bg-background-secondary',
                      'transition-colors duration-200'
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <Badge
                        variant={item.badge.variant}
                        size="xs"
                      >
                        {item.badge.text}
                      </Badge>
                    )}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-3">
                {/* User Info */}
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {user.name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {user.role} • {user.agency}
                  </div>
                </div>

                {/* User Avatar */}
                <button
                  onClick={onProfileClick}
                  className={cn(
                    'flex items-center justify-center',
                    'w-10 h-10 rounded-full',
                    'bg-primary-600 text-white text-sm font-medium',
                    'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    user.initials
                  )}
                </button>

                {/* Sign Out */}
                {onSignOut && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSignOut}
                    className="text-text-secondary hover:text-error-600"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-primary bg-background-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={cn(
                          'flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium',
                          'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
                          'transition-colors duration-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                          {item.badge && (
                            <Badge
                              variant={item.badge.variant}
                              size="xs"
                            >
                              {item.badge.text}
                            </Badge>
                          )}
                        </div>
                        <svg
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            activeDropdown === item.label && 'rotate-180'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {activeDropdown === item.label && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.href}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                                'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
                                'transition-colors duration-200'
                              )}
                            >
                              {child.icon}
                              {child.label}
                              {child.badge && (
                                <Badge
                                  variant={child.badge.variant}
                                  size="xs"
                                  className="ml-auto"
                                >
                                  {child.badge.text}
                                </Badge>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium',
                        'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
                        'transition-colors duration-200'
                      )}
                    >
                      {item.icon}
                      {item.label}
                      {item.badge && (
                        <Badge
                          variant={item.badge.variant}
                          size="xs"
                        >
                          {item.badge.text}
                        </Badge>
                      )}
                    </a>
                  )}
                </div>
              ))}

              {/* Mobile User Section */}
              {user && (
                <div className="border-t border-border-primary pt-4 mt-4">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className={cn(
                      'flex items-center justify-center',
                      'w-10 h-10 rounded-full',
                      'bg-primary-600 text-white text-sm font-medium'
                    )}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        user.initials
                      )}
                    </div>
                    <div>
                      <div className="text-base font-medium text-text-primary">
                        {user.name}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {user.role} • {user.agency}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {onProfileClick && (
                      <button
                        onClick={onProfileClick}
                        className={cn(
                          'block w-full text-left px-3 py-2 rounded-md text-base font-medium',
                          'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
                          'transition-colors duration-200'
                        )}
                      >
                        Profile Settings
                      </button>
                    )}
                    {onSignOut && (
                      <button
                        onClick={onSignOut}
                        className={cn(
                          'block w-full text-left px-3 py-2 rounded-md text-base font-medium',
                          'text-error-600 hover:text-error-700 hover:bg-error-50',
                          'transition-colors duration-200'
                        )}
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;