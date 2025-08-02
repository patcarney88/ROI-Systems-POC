/**
 * Sidebar Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired sidebar navigation with Dark Teal theme and enterprise functionality
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Navigation item interface
interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'error' | 'warning' | 'success';
  };
  children?: SidebarItem[];
  isActive?: boolean;
}

// Sidebar section interface
interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  brand?: {
    logo?: React.ReactNode;
    name: string;
    subtitle?: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  sections,
  isCollapsed = false,
  onToggleCollapse,
  className,
  brand,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemLabel: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel);
    } else {
      newExpanded.add(itemLabel);
    }
    setExpandedItems(newExpanded);
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const indentClass = level > 0 ? `ml-${4 + level * 2}` : '';

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium',
              'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
              'transition-all duration-200 ease-smooth',
              'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1',
              item.isActive && 'bg-primary-50 text-primary-700 border-r-2 border-primary-600',
              indentClass
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 text-lg">
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badge.variant}
                      size="xs"
                    >
                      {item.badge.text}
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            {!isCollapsed && hasChildren && (
              <svg
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        ) : (
          <a
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
              'text-text-secondary hover:text-text-primary hover:bg-background-secondary',
              'transition-all duration-200 ease-smooth',
              'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1',
              item.isActive && 'bg-primary-50 text-primary-700 border-r-2 border-primary-600',
              indentClass
            )}
          >
            <span className="flex-shrink-0 text-lg">
              {item.icon}
            </span>
            {!isCollapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant={item.badge.variant}
                    size="xs"
                    className="ml-auto"
                  >
                    {item.badge.text}
                  </Badge>
                )}
              </>
            )}
          </a>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-background-card border-r border-border-primary',
        'transition-all duration-300 ease-smooth',
        isCollapsed ? 'w-16' : 'w-64',
        'h-screen sticky top-0 z-30',
        className
      )}
    >
      {/* Brand Section */}
      {brand && (
        <div className={cn(
          'flex items-center gap-3 p-4 border-b border-border-primary',
          isCollapsed && 'justify-center'
        )}>
          {brand.logo && (
            <div className="flex-shrink-0">
              {brand.logo}
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-text-primary truncate">
                {brand.name}
              </h1>
              {brand.subtitle && (
                <p className="text-xs text-text-secondary truncate">
                  {brand.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Title */}
            {section.title && !isCollapsed && (
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                {section.title}
              </h2>
            )}
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => renderSidebarItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-4 border-t border-border-primary">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              'w-full justify-center',
              !isCollapsed && 'justify-start'
            )}
          >
            <svg
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {!isCollapsed && (
              <span className="ml-2">Collapse</span>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;