import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricsGrid } from './MetricsGrid'

describe('MetricsGrid Component', () => {
  const mockMetrics = [
    { title: 'Metric 1', value: '100' },
    { title: 'Metric 2', value: '200' },
    { title: 'Metric 3', value: '300' },
  ]

  it('should render all metrics', () => {
    render(<MetricsGrid metrics={mockMetrics} />)

    expect(screen.getByText('Metric 1')).toBeInTheDocument()
    expect(screen.getByText('Metric 2')).toBeInTheDocument()
    expect(screen.getByText('Metric 3')).toBeInTheDocument()
  })

  it('should render metric values', () => {
    render(<MetricsGrid metrics={mockMetrics} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('should apply grid-cols-1 for single column', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} columns={1} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
  })

  it('should apply grid-cols-2 for two columns', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} columns={2} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('md:grid-cols-2')
  })

  it('should apply grid-cols-3 for three columns', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} columns={3} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('should apply grid-cols-4 for four columns', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} columns={4} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('lg:grid-cols-4')
  })

  it('should apply gap-sm class', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} gap="sm" />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-2')
  })

  it('should apply gap-md class', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} gap="md" />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-4')
  })

  it('should apply gap-lg class', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} gap="lg" />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-6')
  })

  it('should use default columns (3) when not specified', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('should use default gap (md) when not specified', () => {
    const { container } = render(
      <MetricsGrid metrics={mockMetrics} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-4')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MetricsGrid
        metrics={mockMetrics}
        className="custom-grid"
      />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('custom-grid')
  })

  it('should render empty grid when no metrics provided', () => {
    const { container } = render(
      <MetricsGrid metrics={[]} />
    )

    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid?.children.length).toBe(0)
  })

  it('should handle metrics with trends', () => {
    const metricsWithTrends = [
      {
        title: 'Revenue',
        value: '$1000',
        trend: { value: 25, direction: 'up' as const },
      },
    ]

    render(<MetricsGrid metrics={metricsWithTrends} />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1000')).toBeInTheDocument()
  })
})
