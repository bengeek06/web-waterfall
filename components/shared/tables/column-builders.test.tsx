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
import { 
  createActionColumn, 
  createDateColumn, 
  createStatusColumn, 
  createBooleanColumn,
  createTextColumn,
  createFilterableTextColumn,
  createBadgeListColumn,
} from './column-builders';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Test data types
interface TestItem {
  id: string;
  name: string;
  email?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  roles: { id: string; name: string }[];
}

// Helper component to render columns
function TableRenderer<T extends { id: string }>({ 
  data, 
  columns 
}: { 
  data: T[]; 
  columns: ReturnType<typeof createActionColumn<T>>[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const mockData: TestItem[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    is_active: true,
    created_at: '2025-01-15T10:00:00Z',
    roles: [{ id: 'r1', name: 'Admin' }, { id: 'r2', name: 'User' }],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: undefined,
    status: 'inactive',
    is_active: false,
    created_at: '2025-02-20T15:30:00Z',
    roles: [],
  },
];

const mockDictionary = {
  actions: 'Actions',
  edit: 'Edit',
  delete: 'Delete',
  view: 'View',
};

describe('Column Builders', () => {
  describe('createActionColumn', () => {
    it('should render edit button when onEdit is provided', () => {
      const onEdit = jest.fn();
      const column = createActionColumn<TestItem>({ onEdit }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByTestId('user-edit-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-edit-2')).toBeInTheDocument();
    });

    it('should render delete button when onDelete is provided', () => {
      const onDelete = jest.fn();
      const column = createActionColumn<TestItem>({ onDelete }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByTestId('user-delete-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-delete-2')).toBeInTheDocument();
    });

    it('should render view button when onView is provided', () => {
      const onView = jest.fn();
      const column = createActionColumn<TestItem>({ onView }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByTestId('user-view-1')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      const column = createActionColumn<TestItem>({ onEdit }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      fireEvent.click(screen.getByTestId('user-edit-1'));
      
      expect(onEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = jest.fn();
      const column = createActionColumn<TestItem>({ onDelete }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      fireEvent.click(screen.getByTestId('user-delete-1'));
      
      expect(onDelete).toHaveBeenCalledWith(mockData[0]);
    });

    it('should render all buttons when all callbacks are provided', () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      const onView = jest.fn();
      const column = createActionColumn<TestItem>({ onEdit, onDelete, onView }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByTestId('user-view-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-edit-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-delete-1')).toBeInTheDocument();
    });

    it('should have accessible sr-only labels', () => {
      const onEdit = jest.fn();
      const column = createActionColumn<TestItem>({ onEdit }, mockDictionary, 'user');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      const editButton = screen.getByTestId('user-edit-1');
      expect(editButton.querySelector('.sr-only')).toHaveTextContent('Edit');
    });

    it('should render header from dictionary', () => {
      const onEdit = jest.fn();
      const column = createActionColumn<TestItem>({ onEdit }, mockDictionary);
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('createDateColumn', () => {
    it('should format date in English locale', () => {
      const column = createDateColumn<TestItem>('created_at', 'Created', 'en');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // en-US format: Jan 15, 2025
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });

    it('should format date in French locale', () => {
      const column = createDateColumn<TestItem>('created_at', 'Created', 'fr');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // fr-FR format: 15 janv. 2025 and 20 févr. 2025
      expect(screen.getAllByText(/janv\.|févr\./)).toHaveLength(2);
    });

    it('should show dash for null/undefined dates', () => {
      const dataWithNullDate = [{ ...mockData[0], created_at: '' }];
      const column = createDateColumn<TestItem>('created_at', 'Created', 'en');
      
      render(<TableRenderer data={dataWithNullDate} columns={[column]} />);
      
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should render header with sort button', () => {
      const column = createDateColumn<TestItem>('created_at', 'Created', 'en');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByRole('button', { name: /Created/ })).toBeInTheDocument();
    });
  });

  describe('createStatusColumn', () => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      inactive: { label: 'Inactive', variant: 'secondary' as const },
    };

    it('should render badge with correct label', () => {
      const column = createStatusColumn<TestItem>('status', 'Status', statusConfig);
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should render header', () => {
      const column = createStatusColumn<TestItem>('status', 'Status', statusConfig);
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should handle unknown status gracefully', () => {
      const dataWithUnknownStatus = [{ ...mockData[0], status: 'unknown' }];
      const column = createStatusColumn<TestItem>('status', 'Status', statusConfig);
      
      render(<TableRenderer data={dataWithUnknownStatus} columns={[column]} />);
      
      // Unknown status shows raw value
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('createBooleanColumn', () => {
    it('should render checkmark for true values', () => {
      const column = createBooleanColumn<TestItem>('is_active', 'Active');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // First row has is_active: true - should have Check icon (text-green-600)
      const cells = screen.getAllByRole('cell');
      const trueCell = cells[0];
      expect(trueCell.querySelector('.text-green-600')).toBeInTheDocument();
    });

    it('should render X for false values', () => {
      const column = createBooleanColumn<TestItem>('is_active', 'Active');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // Second row has is_active: false - should have X icon (text-gray-400)
      const cells = screen.getAllByRole('cell');
      const falseCell = cells[1];
      expect(falseCell.querySelector('.text-gray-400')).toBeInTheDocument();
    });

    it('should render header', () => {
      const column = createBooleanColumn<TestItem>('is_active', 'Active');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('createTextColumn', () => {
    it('should render text value', () => {
      const column = createTextColumn<TestItem>('name', 'Name');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render dash for empty/undefined values', () => {
      const column = createTextColumn<TestItem>('email', 'Email');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // Jane has undefined email
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should render sortable header', () => {
      const column = createTextColumn<TestItem>('name', 'Name');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByRole('button', { name: /Name/ })).toBeInTheDocument();
    });
  });

  describe('createFilterableTextColumn', () => {
    it('should render text value', () => {
      const column = createFilterableTextColumn<TestItem>('name', 'Name', 'users');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render dash for empty values', () => {
      const column = createFilterableTextColumn<TestItem>('email', 'Email', 'users');
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should have enableColumnFilter set to true', () => {
      const column = createFilterableTextColumn<TestItem>('name', 'Name', 'users');
      
      expect(column.enableColumnFilter).toBe(true);
    });

    it('should use includesString filterFn', () => {
      const column = createFilterableTextColumn<TestItem>('name', 'Name', 'users');
      
      expect(column.filterFn).toBe('includesString');
    });
  });

  describe('createBadgeListColumn', () => {
    it('should render badges for array items', () => {
      const column = createBadgeListColumn<TestItem, { id: string; name: string }>(
        'roles',
        'Roles',
        (role) => role.name
      );
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // First user has Admin and User roles
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should render dash for empty arrays', () => {
      const column = createBadgeListColumn<TestItem, { id: string; name: string }>(
        'roles',
        'Roles',
        (role) => role.name
      );
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      // Second user has no roles
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should render header', () => {
      const column = createBadgeListColumn<TestItem, { id: string; name: string }>(
        'roles',
        'Roles',
        (role) => role.name
      );
      
      render(<TableRenderer data={mockData} columns={[column]} />);
      
      expect(screen.getByText('Roles')).toBeInTheDocument();
    });
  });
});
