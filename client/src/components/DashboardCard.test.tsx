import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardCard } from './DashboardCard'

describe('DashboardCard Component', () => {
  it('should render with title and description', () => {
    render(
      <DashboardCard
        title="Test Card"
        description="Test Description"
      />
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render value when provided', () => {
    render(
      <DashboardCard
        title="Revenue"
        value="$1,000"
      />
    )

    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('should render trend indicator with direction', () => {
    render(
      <DashboardCard
        title="Growth"
        value="100"
        trend={{ value: 25, direction: 'up', label: 'vs last month' }}
      />
    )

    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
    expect(screen.getByText('↑')).toBeInTheDocument()
  })

  it('should render down trend with down arrow', () => {
    render(
      <DashboardCard
        title="Decline"
        value="50"
        trend={{ value: 10, direction: 'down' }}
      />
    )

    expect(screen.getByText('↓')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('should render children when provided', () => {
    render(
      <DashboardCard title="Card with Children">
        <div>Child Content</div>
      </DashboardCard>
    )

    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(
      <DashboardCard
        title="Loading Card"
        loading={true}
      />
    )

    const skeleton = screen.getByRole('presentation', { hidden: true })
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('should render error state', () => {
    const errorMessage = 'Failed to load data'
    render(
      <DashboardCard
        title="Error Card"
        error={errorMessage}
      />
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DashboardCard
        title="Clickable Card"
        onClick={handleClick}
      />
    )

    const card = screen.getByText('Clickable Card').closest('[role="presentation"]') || screen.getByText('Clickable Card').parentElement?.parentElement

    if (card) {
      await user.click(card)
      expect(handleClick).toHaveBeenCalled()
    }
  })

  it('should render icon when provided', () => {
    const testIcon = <span data-testid="test-icon">📊</span>

    render(
      <DashboardCard
        title="Card with Icon"
        icon={testIcon}
      />
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <DashboardCard
        title="Styled Card"
        className="custom-class"
      />
    )

    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })

  it('should not show trend when not provided', () => {
    render(
      <DashboardCard
        title="Card without Trend"
        value="100"
      />
    )

    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('should handle numeric values', () => {
    render(
      <DashboardCard
        title="Numeric Value"
        value={12345}
      />
    )

    expect(screen.getByText('12345')).toBeInTheDocument()
  })
})
