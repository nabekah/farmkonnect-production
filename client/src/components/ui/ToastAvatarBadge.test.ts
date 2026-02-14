import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { Toast, ToastContainer, useToast } from './Toast';
import { Avatar, AvatarGroup } from './Avatar';
import { Badge, BadgeGroup, StatusBadge, CountBadge } from './Badge';

/**
 * Toast Component Tests
 */
describe('Toast Component', () => {
  it('should render toast with title', () => {
    render(
      <Toast
        id="toast-1"
        title="Success"
        type="success"
      />
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render toast with description', () => {
    render(
      <Toast
        id="toast-1"
        title="Success"
        description="Operation completed"
        type="success"
      />
    );
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('should render correct icon for type', () => {
    const { container } = render(
      <Toast
        id="toast-1"
        title="Success"
        type="success"
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should call onDismiss when close button clicked', async () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="toast-1"
        title="Test"
        onDismiss={onDismiss}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    }, { timeout: 500 });
  });

  it('should auto-dismiss after duration', async () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="toast-1"
        title="Test"
        duration={100}
        onDismiss={onDismiss}
      />
    );

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    }, { timeout: 500 });
  });

  it('should not auto-dismiss when duration is 0', async () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="toast-1"
        title="Test"
        duration={0}
        onDismiss={onDismiss}
      />
    );

    await waitFor(() => {
      expect(onDismiss).not.toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should render action button', () => {
    const onAction = vi.fn();
    render(
      <Toast
        id="toast-1"
        title="Test"
        action={{ label: 'Undo', onClick: onAction }}
      />
    );

    const actionButton = screen.getByText('Undo');
    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(
      <Toast
        id="toast-1"
        title="Test"
      />
    );
    const toast = container.querySelector('[role="alert"]');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

/**
 * ToastContainer Tests
 */
describe('ToastContainer Component', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', title: 'Toast 1' },
      { id: '2', title: 'Toast 2' },
    ];
    render(<ToastContainer toasts={toasts} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should respect maxToasts limit', () => {
    const toasts = [
      { id: '1', title: 'Toast 1' },
      { id: '2', title: 'Toast 2' },
      { id: '3', title: 'Toast 3' },
      { id: '4', title: 'Toast 4' },
    ];
    render(<ToastContainer toasts={toasts} maxToasts={3} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
    expect(screen.queryByText('Toast 4')).not.toBeInTheDocument();
  });

  it('should call onDismiss for each toast', () => {
    const onDismiss = vi.fn();
    const toasts = [
      { id: '1', title: 'Toast 1' },
      { id: '2', title: 'Toast 2' },
    ];
    render(
      <ToastContainer toasts={toasts} onDismiss={onDismiss} />
    );

    const closeButtons = screen.getAllByLabelText('Close notification');
    fireEvent.click(closeButtons[0]);

    expect(onDismiss).toHaveBeenCalledWith('1');
  });
});

/**
 * useToast Hook Tests
 */
describe('useToast Hook', () => {
  it('should add toast and return id', () => {
    const { result } = renderHook(() => useToast());

    const id = result.current.addToast({
      title: 'Test',
      type: 'success',
    });

    expect(typeof id).toBe('string');
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test');
  });

  it('should remove toast', () => {
    const { result } = renderHook(() => useToast());

    const id = result.current.addToast({
      title: 'Test',
      type: 'success',
    });

    result.current.removeToast(id);
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should add success toast', () => {
    const { result } = renderHook(() => useToast());

    result.current.success('Success Message');

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].title).toBe('Success Message');
  });

  it('should add error toast', () => {
    const { result } = renderHook(() => useToast());

    result.current.error('Error Message');

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
  });
});

/**
 * Avatar Component Tests
 */
describe('Avatar Component', () => {
  it('should render image when src provided', () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        alt="User Avatar"
      />
    );
    const img = screen.getByAltText('User Avatar');
    expect(img).toBeInTheDocument();
  });

  it('should render initials from name', () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should render single initial for single name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should render status indicator', () => {
    const { container } = render(
      <Avatar name="John" status="online" />
    );
    const statusDot = container.querySelector('[class*="bg-green"]');
    expect(statusDot).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { container } = render(
      <Avatar name="John" size="lg" />
    );
    const avatar = container.firstChild;
    expect(avatar).toHaveClass('h-12', 'w-12');
  });

  it('should apply correct shape classes', () => {
    const { container: circleContainer } = render(
      <Avatar name="John" shape="circle" />
    );
    expect(circleContainer.firstChild).toHaveClass('rounded-full');

    const { container: squareContainer } = render(
      <Avatar name="John" shape="square" />
    );
    expect(squareContainer.firstChild).toHaveClass('rounded-lg');
  });

  it('should show border when showBorder is true', () => {
    const { container } = render(
      <Avatar name="John" showBorder={true} />
    );
    const avatar = container.firstChild;
    expect(avatar).toHaveClass('border-2');
  });
});

/**
 * AvatarGroup Component Tests
 */
describe('AvatarGroup Component', () => {
  it('should render multiple avatars', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' },
    ];
    render(<AvatarGroup avatars={avatars} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.getByText('BJ')).toBeInTheDocument();
  });

  it('should respect max limit and show remaining count', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' },
      { name: 'Alice Brown' },
      { name: 'Charlie Davis' },
    ];
    render(<AvatarGroup avatars={avatars} max={3} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.getByText('BJ')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should not show remaining count when all avatars fit', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
    ];
    render(<AvatarGroup avatars={avatars} max={3} />);

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});

/**
 * Badge Component Tests
 */
describe('Badge Component', () => {
  it('should render badge with content', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should render badge with different variants', () => {
    const { container: defaultContainer } = render(
      <Badge variant="default">Badge</Badge>
    );
    expect(defaultContainer.firstChild).toHaveClass('bg-primary');

    const { container: destructiveContainer } = render(
      <Badge variant="destructive">Badge</Badge>
    );
    expect(destructiveContainer.firstChild).toHaveClass('bg-destructive');
  });

  it('should render badge with different sizes', () => {
    const { container: smContainer } = render(
      <Badge size="sm">Badge</Badge>
    );
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: lgContainer } = render(
      <Badge size="lg">Badge</Badge>
    );
    expect(lgContainer.firstChild).toHaveClass('text-base');
  });

  it('should render dismissible badge with close button', () => {
    render(
      <Badge dismissible onDismiss={() => {}}>
        Dismissible
      </Badge>
    );
    expect(screen.getByLabelText('Remove badge')).toBeInTheDocument();
  });

  it('should call onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <Badge dismissible onDismiss={onDismiss}>
        Dismissible
      </Badge>
    );
    const closeButton = screen.getByLabelText('Remove badge');
    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalled();
  });
});

/**
 * BadgeGroup Component Tests
 */
describe('BadgeGroup Component', () => {
  it('should render multiple badges', () => {
    const items = [
      { id: '1', label: 'React' },
      { id: '2', label: 'TypeScript' },
      { id: '3', label: 'Tailwind' },
    ];
    render(<BadgeGroup items={items} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind')).toBeInTheDocument();
  });

  it('should support dismissible badges', () => {
    const onDismiss = vi.fn();
    const items = [
      { id: '1', label: 'Badge 1' },
      { id: '2', label: 'Badge 2' },
    ];
    render(
      <BadgeGroup items={items} dismissible onDismiss={onDismiss} />
    );

    const closeButtons = screen.getAllByLabelText('Remove badge');
    fireEvent.click(closeButtons[0]);
    expect(onDismiss).toHaveBeenCalledWith('1');
  });
});

/**
 * StatusBadge Component Tests
 */
describe('StatusBadge Component', () => {
  it('should render active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render inactive status', () => {
    render(<StatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should use custom label', () => {
    render(<StatusBadge status="active" label="Running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should show status dot by default', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.querySelector('[class*="bg-green"]')).toBeInTheDocument();
  });

  it('should hide status dot when showDot is false', () => {
    const { container } = render(<StatusBadge status="active" showDot={false} />);
    const dot = container.querySelector('[class*="rounded-full"]');
    expect(dot).not.toBeInTheDocument();
  });
});

/**
 * CountBadge Component Tests
 */
describe('CountBadge Component', () => {
  it('should render count', () => {
    render(<CountBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show max count with plus when exceeded', () => {
    render(<CountBadge count={150} max={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should show exact count when not exceeded', () => {
    render(<CountBadge count={50} max={99} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should support custom max', () => {
    render(<CountBadge count={15} max={10} />);
    expect(screen.getByText('10+')).toBeInTheDocument();
  });

  it('should support different variants', () => {
    const { container } = render(
      <CountBadge count={5} variant="destructive" />
    );
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
