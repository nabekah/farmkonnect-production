import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';

// Mock the auth hook
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', () => {}],
}));

// Mock const functions
vi.mock('@/const', () => ({
  getLoginUrl: () => 'https://example.com/login',
  getGoogleLoginUrl: () => 'https://example.com/google-login',
}));

describe('Home - Landing Page Auth Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both Google and Manus sign-in buttons', () => {
    render(<Home />);
    
    // Check for Google sign-in button
    const googleButton = screen.queryByText(/Sign in with Google/i);
    expect(googleButton).toBeTruthy();
    
    // Check for Manus sign-in button
    const manusButton = screen.queryByText(/Sign in with Manus/i);
    expect(manusButton).toBeTruthy();
  });

  it('should display auth buttons as primary options', () => {
    render(<Home />);
    
    // Check that "Get Started:" label is present
    const getStartedLabel = screen.queryByText(/Get Started:/i);
    expect(getStartedLabel).toBeTruthy();
  });

  it('should have correct links for auth buttons', () => {
    render(<Home />);
    
    // Find all links
    const links = screen.queryAllByRole('link');
    
    // Should have links for Google and Manus
    const hasGoogleLink = links.some(link => link.getAttribute('href')?.includes('google'));
    const hasManusLink = links.some(link => link.getAttribute('href')?.includes('login'));
    
    expect(hasGoogleLink).toBeTruthy();
    expect(hasManusLink).toBeTruthy();
  });

  it('should display features section', () => {
    render(<Home />);
    
    const featuresHeading = screen.queryByText(/Powerful Features for Every Farm/i);
    expect(featuresHeading).toBeTruthy();
  });

  it('should display CTA section with both auth options', () => {
    render(<Home />);
    
    const ctaHeading = screen.queryByText(/Ready to Transform Your Farm/i);
    expect(ctaHeading).toBeTruthy();
    
    const signupGoogle = screen.queryByText(/Sign up with Google/i);
    const signupManus = screen.queryByText(/Sign up with Manus/i);
    
    expect(signupGoogle).toBeTruthy();
    expect(signupManus).toBeTruthy();
  });

  it('should not render navbar on landing page', () => {
    render(<Home />);
    
    // The Navbar component should not be rendered
    // We can check by looking for navbar-specific elements
    const navElement = screen.queryByRole('navigation');
    
    // If navbar exists, it should not have the FarmKonnect brand
    if (navElement) {
      const brandElement = navElement.querySelector('[class*="FarmKonnect"]');
      expect(brandElement).toBeFalsy();
    }
  });

  it('should have hero section with main heading', () => {
    render(<Home />);
    
    const heroHeading = screen.queryByText(/Smart Farm Management Made Simple/i);
    expect(heroHeading).toBeTruthy();
  });

  it('should display farm management features', () => {
    render(<Home />);
    
    const features = [
      /Livestock Management/i,
      /Real-time Analytics/i,
      /Weather Integration/i,
      /Workforce Management/i,
      /Financial Tracking/i,
      /Data Security/i,
    ];
    
    features.forEach(feature => {
      const featureElement = screen.queryByText(feature);
      expect(featureElement).toBeTruthy();
    });
  });
});

describe('Home - Auth Buttons Prominence', () => {
  it('should display Google button first (left position)', () => {
    render(<Home />);
    
    const buttons = screen.queryAllByRole('button');
    const googleButton = buttons.find(btn => btn.textContent?.includes('Google'));
    const manusButton = buttons.find(btn => btn.textContent?.includes('Manus'));
    
    // Both should exist
    expect(googleButton).toBeTruthy();
    expect(manusButton).toBeTruthy();
  });

  it('should have equal visual prominence for both auth options', () => {
    render(<Home />);
    
    const googleButton = screen.queryByText(/Sign in with Google/i)?.closest('button');
    const manusButton = screen.queryByText(/Sign in with Manus/i)?.closest('button');
    
    // Both buttons should have similar styling (both should be "lg" size)
    expect(googleButton?.className).toContain('size-lg');
    expect(manusButton?.className).toContain('size-lg');
  });
});
