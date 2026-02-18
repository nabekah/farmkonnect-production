import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileMenu } from './ProfileMenu';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    logout: vi.fn(),
  })),
}));

describe('ProfileMenu Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile button with user initial', () => {
    render(<ProfileMenu />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should display user name and email on hover', async () => {
    render(<ProfileMenu />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should open dropdown menu when clicked', async () => {
    render(<ProfileMenu />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  it('should have correct links in dropdown', async () => {
    render(<ProfileMenu />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      const settingsLink = screen.getAllByText('Settings')[0].closest('div');
      expect(settingsLink).toBeInTheDocument();
    });
  });

  it('should return null when user is not authenticated', () => {
    // Mock useAuth to return null user
    vi.resetModules();
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: vi.fn(() => ({
        user: null,
        logout: vi.fn(),
      })),
    }));

    const { container } = render(<ProfileMenu />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle missing user name gracefully', async () => {
    vi.resetModules();
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: vi.fn(() => ({
        user: {
          id: '1',
          name: null,
          email: 'john@example.com',
        },
        logout: vi.fn(),
      })),
    }));

    render(<ProfileMenu />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ProfileMenu />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title');
  });
});
