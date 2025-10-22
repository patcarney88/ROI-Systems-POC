import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
}

export default function AppLayout({
  children,
  profileMenuOpen,
  setProfileMenuOpen
}: AppLayoutProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  // Render logout button with working handler
  const renderLogoutButton = () => (
    <button style={{
      width: '100%',
      padding: '0.75rem 1rem',
      background: 'none',
      border: 'none',
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.875rem',
      color: '#ef4444',
      fontWeight: '500',
      transition: 'background 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
    onClick={handleLogout}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Sign Out
    </button>
  );

  return { handleLogout, renderLogoutButton, user };
}