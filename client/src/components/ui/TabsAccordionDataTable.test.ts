import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tabs, useTabs } from './Tabs';
import { Accordion, useAccordion } from './Accordion';
import { DataTable, useDataTable } from './DataTable';
import { renderHook } from '@testing-library/react';

/**
 * Tabs Component Tests
 */
describe('Tabs Component', () => {
  const tabItems = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
  ];

  it('should render tabs with default active tab', () => {
    render(
      <Tabs
        items={tabItems}
        activeTab="tab1"
      />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('should switch tabs on click', async () => {
    render(
      <Tabs
        items={tabItems}
        activeTab="tab1"
      />
    );

    const tab2Button = screen.getByText('Tab 2');
    fireEvent.click(tab2Button);

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('should call onTabChange callback', () => {
    const onTabChange = vi.fn();
    render(
      <Tabs
        items={tabItems}
        activeTab="tab1"
        onTabChange={onTabChange}
      />
    );

    const tab2Button = screen.getByText('Tab 2');
    fireEvent.click(tab2Button);

    expect(onTabChange).toHaveBeenCalledWith('tab2');
  });

  it('should navigate with arrow keys', async () => {
    render(
      <Tabs
        items={tabItems}
        activeTab="tab1"
      />
    );

    const tab1Button = screen.getByText('Tab 1');
    fireEvent.keyDown(tab1Button, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('should not switch to disabled tab', () => {
    const disabledItems = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: true },
    ];

    render(
      <Tabs
        items={disabledItems}
        activeTab="tab1"
      />
    );

    const tab2Button = screen.getByText('Tab 2');
    expect(tab2Button).toBeDisabled();
  });

  it('should render with badges', () => {
    const itemsWithBadges = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1', badge: 5 },
    ];

    render(
      <Tabs
        items={itemsWithBadges}
        activeTab="tab1"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should lazy load tab content', async () => {
    render(
      <Tabs
        items={tabItems}
        activeTab="tab1"
        lazy={true}
      />
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

    const tab2Button = screen.getByText('Tab 2');
    fireEvent.click(tab2Button);

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });
});

/**
 * useTabs Hook Tests
 */
describe('useTabs Hook', () => {
  it('should manage tabs state', () => {
    const { result } = renderHook(() => useTabs('tab1'));

    expect(result.current.activeTab).toBe('tab1');

    result.current.setActiveTab('tab2');

    expect(result.current.activeTab).toBe('tab2');
  });
});

/**
 * Accordion Component Tests
 */
describe('Accordion Component', () => {
  const accordionItems = [
    { id: 'item1', title: 'Item 1', content: 'Content 1' },
    { id: 'item2', title: 'Item 2', content: 'Content 2' },
    { id: 'item3', title: 'Item 3', content: 'Content 3' },
  ];

  it('should render accordion items', () => {
    render(
      <Accordion
        items={accordionItems}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should expand item on click', async () => {
    render(
      <Accordion
        items={accordionItems}
      />
    );

    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);

    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  it('should collapse item on click', async () => {
    render(
      <Accordion
        items={accordionItems}
        expandedItems={['item1']}
      />
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);

    await waitFor(() => {
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });

  it('should allow multiple items expanded', async () => {
    const onExpandedChange = vi.fn();
    render(
      <Accordion
        items={accordionItems}
        allowMultiple={true}
        onExpandedChange={onExpandedChange}
      />
    );

    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);

    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    const item2Button = screen.getByText('Item 2');
    fireEvent.click(item2Button);

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    expect(onExpandedChange).toHaveBeenCalledWith(['item1', 'item2']);
  });

  it('should collapse other items when allowMultiple is false', async () => {
    render(
      <Accordion
        items={accordionItems}
        allowMultiple={false}
      />
    );

    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);

    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    const item2Button = screen.getByText('Item 2');
    fireEvent.click(item2Button);

    await waitFor(() => {
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  it('should not expand disabled items', () => {
    const disabledItems = [
      { id: 'item1', title: 'Item 1', content: 'Content 1', disabled: true },
    ];

    render(
      <Accordion
        items={disabledItems}
      />
    );

    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);

    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('should navigate with keyboard', async () => {
    render(
      <Accordion
        items={accordionItems}
      />
    );

    const item1Button = screen.getByText('Item 1');
    fireEvent.keyDown(item1Button, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });
});

/**
 * useAccordion Hook Tests
 */
describe('useAccordion Hook', () => {
  it('should manage accordion state', () => {
    const { result } = renderHook(() => useAccordion([], false));

    expect(result.current.expanded).toEqual([]);

    result.current.expand('item1');

    expect(result.current.expanded).toContain('item1');
  });

  it('should toggle items', () => {
    const { result } = renderHook(() => useAccordion([], false));

    result.current.toggle('item1');
    expect(result.current.expanded).toContain('item1');

    result.current.toggle('item1');
    expect(result.current.expanded).not.toContain('item1');
  });
});

/**
 * DataTable Component Tests
 */
describe('DataTable Component', () => {
  const tableData = [
    { id: 1, name: 'John', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob', email: 'bob@example.com', status: 'active' },
  ];

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
  ];

  it('should render table with data', () => {
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
      />
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey="id"
        emptyMessage="No users found"
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('should sort data on column click', async () => {
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
      />
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    await waitFor(() => {
      const rows = screen.getAllByRole('cell');
      expect(rows[0].textContent).toBe('Bob');
    });
  });

  it('should select rows', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
        selectable={true}
        onSelectionChange={onSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('should select all rows', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
        selectable={true}
        onSelectionChange={onSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('should handle row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
        onRowClick={onRowClick}
      />
    );

    const nameCell = screen.getByText('John');
    fireEvent.click(nameCell.closest('tr')!);

    expect(onRowClick).toHaveBeenCalled();
  });

  it('should paginate data', () => {
    const manyRows = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: 'active',
    }));

    render(
      <DataTable
        columns={columns}
        data={manyRows}
        rowKey="id"
        paginated={true}
        itemsPerPage={10}
      />
    );

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('should render custom cell content', () => {
    const customColumns = [
      {
        key: 'name',
        label: 'Name',
        render: (value: string) => `Mr. ${value}`,
      },
    ];

    render(
      <DataTable
        columns={customColumns}
        data={tableData}
        rowKey="id"
      />
    );

    expect(screen.getByText('Mr. John')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <DataTable
        columns={columns}
        data={tableData}
        rowKey="id"
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

/**
 * useDataTable Hook Tests
 */
describe('useDataTable Hook', () => {
  it('should manage data table state', () => {
    const data = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ];

    const { result } = renderHook(() => useDataTable(data));

    expect(result.current.selectedRows.size).toBe(0);
    expect(result.current.sortKey).toBeNull();
    expect(result.current.currentPage).toBe(1);
  });

  it('should manage selected rows', () => {
    const data = [{ id: 1, name: 'John' }];
    const { result } = renderHook(() => useDataTable(data));

    const newSelected = new Set(['1']);
    result.current.setSelectedRows(newSelected);

    expect(result.current.selectedRows.size).toBe(1);
  });
});
