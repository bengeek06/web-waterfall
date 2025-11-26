/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenericDataTable } from './GenericDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// Mock test data
interface TestItem {
  id: number;
  name: string;
  description: string;
}

const mockData: TestItem[] = [
  { id: 1, name: 'Item 1', description: 'First item details' },
  { id: 2, name: 'Item 2', description: 'Second item details' },
  { id: 3, name: 'Item 3', description: 'Third item details' },
];

const mockColumns: ColumnDef<TestItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
];

const mockDictionary = {
  loading: 'Loading...',
  no_results: 'No results found',
  rows_per_page: 'Rows per page',
  showing_results: 'Showing {from} to {to} of {total} result(s)',
  previous: 'Previous',
  next: 'Next',
  of: 'of',
};

describe('GenericDataTable - Row Expansion', () => {
  it('should render without expansion by default', () => {
    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
      />
    );

    // Should not show expansion buttons
    expect(screen.queryByLabelText(/expand row/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/collapse row/i)).not.toBeInTheDocument();
  });

  it('should render expansion column when enableRowExpansion is true', () => {
    const renderExpanded = jest.fn((item: TestItem) => {
      return <div data-testid={`expanded-${item.id}`}>{item.description}</div>;
    });

    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
      />
    );

    // Should show expansion buttons (all collapsed initially)
    const expandButtons = screen.getAllByLabelText(/expand row/i);
    expect(expandButtons).toHaveLength(mockData.length);
  });

  it('should expand and collapse row when clicking expansion button', () => {
    const renderExpanded = jest.fn((item: TestItem) => {
      return <div data-testid={`expanded-${item.id}`}>{item.description}</div>;
    });

    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
      />
    );

    // Initially, expanded content should not be visible
    expect(screen.queryByTestId('expanded-1')).not.toBeInTheDocument();

    // Click to expand first row
    const firstExpandButton = screen.getAllByLabelText(/expand row/i)[0];
    fireEvent.click(firstExpandButton);

    // Expanded content should be visible
    expect(screen.getByTestId('expanded-1')).toBeInTheDocument();
    expect(screen.getByText('First item details')).toBeInTheDocument();
    expect(renderExpanded).toHaveBeenCalledWith(mockData[0]);

    // Button should now say "Collapse row"
    const collapseButton = screen.getByLabelText(/collapse row/i);
    expect(collapseButton).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(collapseButton);

    // Expanded content should be hidden again
    expect(screen.queryByTestId('expanded-1')).not.toBeInTheDocument();
  });

  it('should allow multiple rows to be expanded simultaneously', () => {
    const renderExpanded = (item: TestItem) => (
      <div data-testid={`expanded-${item.id}`}>{item.description}</div>
    );

    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
      />
    );

    // Get all expand buttons before clicking any
    const allExpandButtons = screen.getAllByLabelText(/expand row/i);
    
    // Expand first row
    fireEvent.click(allExpandButtons[0]);
    expect(screen.getByTestId('expanded-1')).toBeInTheDocument();
    
    // Get buttons again after state change
    const expandButtonsAfterFirst = screen.getAllByLabelText(/expand row/i);
    
    // Expand third row (now at index 1 because first row is collapsed button)
    fireEvent.click(expandButtonsAfterFirst[1]);

    // Both should be visible
    expect(screen.getByTestId('expanded-1')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-3')).toBeInTheDocument();
    expect(screen.queryByTestId('expanded-2')).not.toBeInTheDocument();
  });

  it('should call onRowExpansionChange when expansion state changes', () => {
    const onExpansionChange = jest.fn();
    const renderExpanded = (item: TestItem) => (
      <div data-testid={`expanded-${item.id}`}>{item.description}</div>
    );

    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
        onRowExpansionChange={onExpansionChange}
      />
    );

    // Expand first row
    const expandButtons = screen.getAllByLabelText(/expand row/i);
    fireEvent.click(expandButtons[0]);

    expect(onExpansionChange).toHaveBeenCalledWith({ 1: true });

    // Collapse first row
    const collapseButton = screen.getByLabelText(/collapse row/i);
    fireEvent.click(collapseButton);

    expect(onExpansionChange).toHaveBeenCalledWith({ 1: false });
  });

  it('should use initialExpanded to set initial expansion state', () => {
    const renderExpanded = (item: TestItem) => (
      <div data-testid={`expanded-${item.id}`}>{item.description}</div>
    );

    render(
      <GenericDataTable
        data={mockData}
        columns={mockColumns}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
        initialExpanded={{ 1: true, 3: true }}
      />
    );

    // Rows 1 and 3 should be expanded initially
    expect(screen.getByTestId('expanded-1')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-3')).toBeInTheDocument();
    expect(screen.queryByTestId('expanded-2')).not.toBeInTheDocument();
  });

  it('should not render expansion if row does not have an id', () => {
    interface ItemWithoutId {
      name: string;
    }
    
    const dataWithoutIds: ItemWithoutId[] = [
      { name: 'Item without ID' },
    ];

    const columnsWithoutId: ColumnDef<ItemWithoutId>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
      },
    ];

    const renderExpanded = jest.fn();

    render(
      <GenericDataTable
        data={dataWithoutIds}
        columns={columnsWithoutId}
        dictionary={mockDictionary}
        enableRowExpansion={true}
        renderExpandedRow={renderExpanded}
      />
    );

    // Should not show expansion button for rows without ID
    expect(screen.queryByLabelText(/expand row/i)).not.toBeInTheDocument();
  });
});
