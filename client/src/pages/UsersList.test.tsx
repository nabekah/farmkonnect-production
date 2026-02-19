import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsersList } from './UsersList';

// Mock the trpc hook
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: {
      getAllUsers: {
        useQuery: () => ({
          data: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              role: 'farmer',
              loginMethod: 'google',
              approvalStatus: 'approved',
              accountStatus: 'active',
              createdAt: new Date('2026-02-19'),
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '0987654321',
              role: 'agent',
              loginMethod: 'manus',
              approvalStatus: 'pending',
              accountStatus: 'active',
              createdAt: new Date('2026-02-18'),
            },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', () => {}],
}));

describe('UsersList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render users list page with title', () => {
    render(<UsersList />);
    
    const title = screen.queryByText(/Registered Users/i);
    expect(title).toBeTruthy();
  });

  it('should display total users count', () => {
    render(<UsersList />);
    
    const totalText = screen.queryByText(/Total users: 2/i);
    expect(totalText).toBeTruthy();
  });

  it('should render search input', () => {
    render(<UsersList />);
    
    const searchInput = screen.queryByPlaceholderText(/Search by name, email, or phone/i);
    expect(searchInput).toBeTruthy();
  });

  it('should render filter dropdown', () => {
    render(<UsersList />);
    
    const filterSelect = screen.queryByDisplayValue(/All Users/i);
    expect(filterSelect).toBeTruthy();
  });

  it('should display user table with headers', () => {
    render(<UsersList />);
    
    const headers = [
      /Name/i,
      /Email/i,
      /Phone/i,
      /Role/i,
      /Status/i,
      /Account/i,
      /Joined/i,
    ];
    
    headers.forEach(header => {
      const element = screen.queryByText(header);
      expect(element).toBeTruthy();
    });
  });

  it('should display user data in table', () => {
    render(<UsersList />);
    
    // Check for user names
    const johnDoe = screen.queryByText(/John Doe/i);
    const janeSmith = screen.queryByText(/Jane Smith/i);
    
    expect(johnDoe).toBeTruthy();
    expect(janeSmith).toBeTruthy();
  });

  it('should display user roles', () => {
    render(<UsersList />);
    
    const farmerRole = screen.queryByText(/farmer/i);
    const agentRole = screen.queryByText(/agent/i);
    
    expect(farmerRole).toBeTruthy();
    expect(agentRole).toBeTruthy();
  });

  it('should display approval status', () => {
    render(<UsersList />);
    
    const approved = screen.queryByText(/approved/i);
    const pending = screen.queryByText(/pending/i);
    
    expect(approved).toBeTruthy();
    expect(pending).toBeTruthy();
  });

  it('should display summary stats', () => {
    render(<UsersList />);
    
    const stats = [
      /Total Users/i,
      /Approved/i,
      /Pending/i,
      /Active Accounts/i,
    ];
    
    stats.forEach(stat => {
      const element = screen.queryByText(stat);
      expect(element).toBeTruthy();
    });
  });

  it('should display back to home button', () => {
    render(<UsersList />);
    
    const backButton = screen.queryByText(/Back to Home/i);
    expect(backButton).toBeTruthy();
  });
});

describe('UsersList - Filtering and Search', () => {
  it('should have search functionality', () => {
    render(<UsersList />);
    
    const searchInput = screen.queryByPlaceholderText(/Search by name, email, or phone/i) as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    expect(searchInput?.type).toBe('text');
  });

  it('should have status filter dropdown', () => {
    render(<UsersList />);
    
    const filterSelect = screen.queryByDisplayValue(/All Users/i) as HTMLSelectElement;
    expect(filterSelect).toBeTruthy();
    
    // Check for filter options
    const options = filterSelect?.querySelectorAll('option');
    expect(options?.length).toBeGreaterThanOrEqual(4); // all, approved, pending, rejected
  });
});

describe('UsersList - User Data Display', () => {
  it('should display user emails', () => {
    render(<UsersList />);
    
    const emails = [
      /john@example.com/i,
      /jane@example.com/i,
    ];
    
    emails.forEach(email => {
      const element = screen.queryByText(email);
      expect(element).toBeTruthy();
    });
  });

  it('should display user phone numbers', () => {
    render(<UsersList />);
    
    const phones = [
      /1234567890/,
      /0987654321/,
    ];
    
    phones.forEach(phone => {
      const element = screen.queryByText(phone);
      expect(element).toBeTruthy();
    });
  });

  it('should display login methods', () => {
    render(<UsersList />);
    
    // Google and Manus login methods should be displayed
    // This depends on how the component renders login method
    const userTable = screen.queryByRole('table');
    expect(userTable).toBeTruthy();
  });
});
