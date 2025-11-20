/**
 * DemoHeader Component - Unit Tests
 *
 * Test suite for the DemoHeader component covering:
 * - Rendering
 * - User interactions
 * - Navigation
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DemoHeader from './DemoHeader';

// Mock useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Helper function to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DemoHeader Component', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  // ===== BASIC RENDERING =====

  describe('Rendering', () => {
    test('renders with dashboard name', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      expect(screen.getByText(/Title Agent Dashboard/)).toBeInTheDocument();
    });

    test('renders demo mode badge', () => {
      renderWithRouter(<DemoHeader dashboardName="Realtor Dashboard" />);

      expect(screen.getByText(/Demo Mode:/)).toBeInTheDocument();
      expect(screen.getByText(/Realtor Dashboard/)).toBeInTheDocument();
    });

    test('renders all interactive elements', () => {
      renderWithRouter(<DemoHeader dashboardName="Test Dashboard" />);

      expect(screen.getByRole('button', { name: /switch to another demo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /exit demo mode/i })).toBeInTheDocument();
    });

    test('does not render when isDemoMode is false', () => {
      const { container } = renderWithRouter(
        <DemoHeader dashboardName="Test Dashboard" isDemoMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('renders with isDemoMode defaulting to true', () => {
      renderWithRouter(<DemoHeader dashboardName="Test Dashboard" />);

      expect(screen.getByText(/Demo Mode:/)).toBeInTheDocument();
    });
  });

  // ===== DROPDOWN INTERACTIONS =====

  describe('Dropdown Menu', () => {
    test('dropdown is closed by default', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('opens dropdown on trigger click', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    test('closes dropdown on second click', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });

      // Open dropdown
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Close dropdown
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('displays all other dashboards in dropdown', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Realtor Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Homeowner Portal')).toBeInTheDocument();
        expect(screen.getByText('Marketing Center')).toBeInTheDocument();
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Communication Center')).toBeInTheDocument();
      });
    });

    test('excludes current dashboard from dropdown', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        const items = menu.querySelectorAll('[role="menuitem"]');

        // Should have 5 items (6 total - 1 current)
        expect(items).toHaveLength(5);

        // Current dashboard should not be in the list
        items.forEach((item) => {
          expect(item.textContent).not.toBe('Title Agent Dashboard');
        });
      });
    });

    test('closes dropdown when clicking menu item', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const menuItem = screen.getByText('Realtor Dashboard');
      fireEvent.click(menuItem);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  // ===== KEYBOARD INTERACTIONS =====

  describe('Keyboard Navigation', () => {
    test('closes dropdown on Escape key', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('dropdown trigger is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });

      // Tab to trigger
      await user.tab();
      expect(trigger).toHaveFocus();
    });

    test('exit button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const exitButton = screen.getByRole('button', { name: /exit demo mode/i });

      // Tab to exit button (skip dropdown trigger)
      await user.tab();
      await user.tab();

      expect(exitButton).toHaveFocus();
    });
  });

  // ===== CLICK OUTSIDE BEHAVIOR =====

  describe('Click Outside', () => {
    test('closes dropdown when clicking outside', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Click outside (on document body)
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('does not close dropdown when clicking inside', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const menu = screen.getByRole('menu');
      fireEvent.mouseDown(menu);

      // Dropdown should still be open
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  // ===== NAVIGATION =====

  describe('Navigation', () => {
    test('exit button calls navigate with "/"', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const exitButton = screen.getByRole('button', { name: /exit demo mode/i });
      fireEvent.click(exitButton);

      expect(mockedNavigate).toHaveBeenCalledWith('/');
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
    });

    test('dashboard links have correct paths', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        const realtorLink = screen.getByText('Realtor Dashboard').closest('a');
        expect(realtorLink).toHaveAttribute('href', '/dashboard/realtor');

        const homeownerLink = screen.getByText('Homeowner Portal').closest('a');
        expect(homeownerLink).toHaveAttribute('href', '/dashboard/homeowner');

        const marketingLink = screen.getByText('Marketing Center').closest('a');
        expect(marketingLink).toHaveAttribute('href', '/dashboard/marketing');

        const analyticsLink = screen.getByText('Analytics Dashboard').closest('a');
        expect(analyticsLink).toHaveAttribute('href', '/dashboard/realtor/analytics');

        const commLink = screen.getByText('Communication Center').closest('a');
        expect(commLink).toHaveAttribute('href', '/dashboard/realtor/communications');
      });
    });
  });

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    test('has proper ARIA attributes on dropdown trigger', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });

      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test('updates aria-expanded when dropdown opens', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    test('demo badge has aria-live attribute', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });

    test('dropdown menu has proper role', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toHaveAttribute('aria-label', 'Available demo dashboards');
      });
    });

    test('menu items have menuitem role', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });

    test('exit button has descriptive aria-label', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const exitButton = screen.getByRole('button', { name: /exit demo mode and return to landing page/i });
      expect(exitButton).toBeInTheDocument();
    });

    test('component has banner role', () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });
  });

  // ===== DYNAMIC CONTENT =====

  describe('Dynamic Content', () => {
    test('renders different dashboard names correctly', () => {
      const dashboards = [
        'Title Agent Dashboard',
        'Realtor Dashboard',
        'Homeowner Portal',
        'Marketing Center',
        'Analytics Dashboard',
        'Communication Center'
      ];

      dashboards.forEach((name) => {
        const { unmount } = renderWithRouter(<DemoHeader dashboardName={name} />);
        expect(screen.getByText(name)).toBeInTheDocument();
        unmount();
      });
    });

    test('filters dropdown items based on current dashboard', async () => {
      const { unmount } = renderWithRouter(<DemoHeader dashboardName="Realtor Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Realtor Dashboard')).not.toBeInTheDocument();
        expect(screen.getByText('Title Agent Dashboard')).toBeInTheDocument();
      });

      unmount();
    });
  });

  // ===== ICON RENDERING =====

  describe('Icons', () => {
    test('renders PlayCircle icon in demo badge', () => {
      const { container } = renderWithRouter(<DemoHeader dashboardName="Test Dashboard" />);

      // Icon should have aria-hidden attribute
      const icon = container.querySelector('.demo-badge-icon');
      expect(icon).toBeInTheDocument();
    });

    test('icons have aria-hidden attribute', () => {
      const { container } = renderWithRouter(<DemoHeader dashboardName="Test Dashboard" />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // ===== EDGE CASES =====

  describe('Edge Cases', () => {
    test('handles empty dashboard name gracefully', () => {
      renderWithRouter(<DemoHeader dashboardName="" />);

      expect(screen.getByText(/Demo Mode:/)).toBeInTheDocument();
    });

    test('handles rapid dropdown toggle clicks', async () => {
      renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });

      // Rapidly click multiple times
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      // Should end up closed (odd number of clicks)
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    test('cleanup removes event listeners', async () => {
      const { unmount } = renderWithRouter(<DemoHeader dashboardName="Title Agent Dashboard" />);

      const trigger = screen.getByRole('button', { name: /switch to another demo/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Event listeners should be cleaned up (no errors)
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.mouseDown(document.body);
    });
  });
});
