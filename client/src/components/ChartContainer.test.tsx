import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartContainer } from './ChartContainer'

describe('ChartContainer Component', () => {
  it('should render with title', () => {
    render(
      <ChartContainer title="Test Chart">
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('should render with description', () => {
    render(
      <ChartContainer
        title="Test Chart"
        description="Test Description"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render children', () => {
    render(
      <ChartContainer title="Test Chart">
        <div data-testid="chart-content">Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByTestId('chart-content')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(
      <ChartContainer
        title="Loading Chart"
        loading={true}
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByText('Loading chart...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    const errorMessage = 'Failed to load chart'
    render(
      <ChartContainer
        title="Error Chart"
        error={errorMessage}
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByText('Error loading chart')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should apply height-sm class', () => {
    const { container } = render(
      <ChartContainer
        title="Small Chart"
        height="sm"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.h-64')
    expect(content).toBeInTheDocument()
  })

  it('should apply height-md class', () => {
    const { container } = render(
      <ChartContainer
        title="Medium Chart"
        height="md"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.h-80')
    expect(content).toBeInTheDocument()
  })

  it('should apply height-lg class', () => {
    const { container } = render(
      <ChartContainer
        title="Large Chart"
        height="lg"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.h-96')
    expect(content).toBeInTheDocument()
  })

  it('should apply height-xl class', () => {
    const { container } = render(
      <ChartContainer
        title="Extra Large Chart"
        height="xl"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.h-\\[500px\\]')
    expect(content).toBeInTheDocument()
  })

  it('should use default height (md) when not specified', () => {
    const { container } = render(
      <ChartContainer title="Default Height Chart">
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.h-80')
    expect(content).toBeInTheDocument()
  })

  it('should render action buttons when provided', () => {
    render(
      <ChartContainer
        title="Chart with Actions"
        actions={<button data-testid="action-btn">Action</button>}
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ChartContainer
        title="Styled Chart"
        className="custom-class"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })

  it('should apply custom headerClassName', () => {
    const { container } = render(
      <ChartContainer
        title="Custom Header Chart"
        headerClassName="custom-header"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const header = container.querySelector('.custom-header')
    expect(header).toBeInTheDocument()
  })

  it('should apply custom contentClassName', () => {
    const { container } = render(
      <ChartContainer
        title="Custom Content Chart"
        contentClassName="custom-content"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    const content = container.querySelector('.custom-content')
    expect(content).toBeInTheDocument()
  })

  it('should not render loading state when loading is false', () => {
    render(
      <ChartContainer
        title="Not Loading Chart"
        loading={false}
      >
        <div data-testid="chart-content">Chart Content</div>
      </ChartContainer>
    )

    expect(screen.queryByText('Loading chart...')).not.toBeInTheDocument()
    expect(screen.getByTestId('chart-content')).toBeInTheDocument()
  })

  it('should prioritize error state over loading state', () => {
    render(
      <ChartContainer
        title="Error Priority Chart"
        loading={true}
        error="Error message"
      >
        <div>Chart Content</div>
      </ChartContainer>
    )

    expect(screen.getByText('Error loading chart')).toBeInTheDocument()
    expect(screen.queryByText('Loading chart...')).not.toBeInTheDocument()
  })
})
