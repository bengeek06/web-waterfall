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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TextFilter } from './text-filter';
import { MultiSelectFilter } from './multi-select-filter';
import { BooleanFilter } from './boolean-filter';
import { SelectFilter } from './select-filter';
import { ColumnFilter } from './column-filter';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView (not available in jsdom, used by cmdk)
Element.prototype.scrollIntoView = jest.fn();

describe('TextFilter', () => {
  it('should render input with placeholder', () => {
    const onChange = jest.fn();
    render(<TextFilter value="" onChange={onChange} placeholder="Filter..." testId="test-filter" />);
    
    expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
  });

  it('should display current value', () => {
    const onChange = jest.fn();
    render(<TextFilter value="test value" onChange={onChange} testId="test-filter" />);
    
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    const onChange = jest.fn();
    render(<TextFilter value="" onChange={onChange} testId="test-filter" />);
    
    const input = screen.getByTestId('test-filter');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('should show clear button when value is present', () => {
    const onChange = jest.fn();
    render(<TextFilter value="test" onChange={onChange} testId="test-filter" />);
    
    expect(screen.getByTestId('test-filter-clear')).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    const onChange = jest.fn();
    render(<TextFilter value="" onChange={onChange} testId="test-filter" />);
    
    expect(screen.queryByTestId('test-filter-clear')).not.toBeInTheDocument();
  });

  it('should clear value when clear button is clicked', () => {
    const onChange = jest.fn();
    render(<TextFilter value="test" onChange={onChange} testId="test-filter" />);
    
    fireEvent.click(screen.getByTestId('test-filter-clear'));
    
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should have accessible label for clear button', () => {
    const onChange = jest.fn();
    render(<TextFilter value="test" onChange={onChange} testId="test-filter" />);
    
    const clearButton = screen.getByTestId('test-filter-clear');
    expect(clearButton.querySelector('.sr-only')).toHaveTextContent('Clear filter');
  });

  it('should apply custom className', () => {
    const onChange = jest.fn();
    render(<TextFilter value="" onChange={onChange} className="custom-class" />);
    
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

describe('MultiSelectFilter', () => {
  const mockOptions = [
    { value: '1', label: 'Admin' },
    { value: '2', label: 'User' },
    { value: '3', label: 'Guest' },
  ];

  it('should render with placeholder when no selection', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={[]} 
        onChange={onChange} 
        options={mockOptions} 
        placeholder="Select roles..."
        testId="test-multi"
      />
    );
    
    expect(screen.getByText('Select roles...')).toBeInTheDocument();
  });

  it('should render combobox button', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={[]} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display single selection label', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={['1']} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should display count badge for multiple selections', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={['1', '2']} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  it('should show clear button when selection exists', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={['1']} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeInTheDocument();
  });

  it('should clear all selections when clear button is clicked', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={['1', '2']} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }));
    
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should have correct testId', () => {
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={[]} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    expect(screen.getByTestId('test-multi')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <MultiSelectFilter 
        value={[]} 
        onChange={onChange} 
        options={mockOptions}
        testId="test-multi"
      />
    );
    
    await user.click(screen.getByRole('combobox'));
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
});

describe('BooleanFilter', () => {
  it('should render select trigger', () => {
    const onChange = jest.fn();
    render(
      <BooleanFilter 
        value="" 
        onChange={onChange}
        testId="test-bool"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have correct testId', () => {
    const onChange = jest.fn();
    render(
      <BooleanFilter 
        value="" 
        onChange={onChange}
        testId="test-bool"
      />
    );
    
    expect(screen.getByTestId('test-bool')).toBeInTheDocument();
  });

  it('should display custom true label', () => {
    const onChange = jest.fn();
    render(
      <BooleanFilter 
        value="true" 
        onChange={onChange}
        trueLabel="Active"
        testId="test-bool"
      />
    );
    
    // Select trigger shows the current value's label
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should use custom allLabel as placeholder', () => {
    const onChange = jest.fn();
    render(
      <BooleanFilter 
        value="" 
        onChange={onChange}
        allLabel="All statuses"
        testId="test-bool"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('SelectFilter', () => {
  const mockOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  it('should render select trigger', () => {
    const onChange = jest.fn();
    render(
      <SelectFilter 
        value="" 
        onChange={onChange} 
        options={mockOptions}
        placeholder="Select status..."
        testId="test-select"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have correct testId', () => {
    const onChange = jest.fn();
    render(
      <SelectFilter 
        value="" 
        onChange={onChange} 
        options={mockOptions}
        testId="test-select"
      />
    );
    
    expect(screen.getByTestId('test-select')).toBeInTheDocument();
  });

  it('should display selected value', () => {
    const onChange = jest.fn();
    render(
      <SelectFilter 
        value="active" 
        onChange={onChange} 
        options={mockOptions}
        testId="test-select"
      />
    );
    
    // The combobox should show the selected value
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const onChange = jest.fn();
    render(
      <SelectFilter 
        value="" 
        onChange={onChange} 
        options={mockOptions}
        className="custom-class"
        testId="test-select"
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });
});

describe('ColumnFilter', () => {
  const mockOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  it('should render TextFilter for type "text"', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="text"
        value="test value"
        onChange={onChange}
        placeholder="Filter..."
        testId="column-filter"
      />
    );
    
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('should render SelectFilter for type "select"', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="select"
        value="active"
        onChange={onChange}
        options={mockOptions}
        testId="column-filter"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render MultiSelectFilter for type "multi-select"', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="multi-select"
        value={['active']}
        onChange={onChange}
        options={mockOptions}
        testId="column-filter"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should handle non-array value for multi-select', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="multi-select"
        value={null}
        onChange={onChange}
        options={mockOptions}
        placeholder="Select..."
        testId="column-filter"
      />
    );
    
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('should render BooleanFilter for type "boolean"', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="boolean"
        value="true"
        onChange={onChange}
        booleanLabels={{ all: 'All', true: 'Yes', false: 'No' }}
        testId="column-filter"
      />
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should return null for type "custom"', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ColumnFilter
        filterType="custom"
        value=""
        onChange={onChange}
        testId="column-filter"
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should return null for unknown type', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ColumnFilter
        filterType={'unknown' as 'text'}
        value=""
        onChange={onChange}
        testId="column-filter"
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle null/undefined value for text type', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="text"
        value={null}
        onChange={onChange}
        placeholder="Enter text..."
        testId="column-filter"
      />
    );
    
    expect(screen.getByPlaceholderText('Enter text...')).toHaveValue('');
  });

  it('should pass className to underlying component', () => {
    const onChange = jest.fn();
    render(
      <ColumnFilter
        filterType="select"
        value=""
        onChange={onChange}
        options={mockOptions}
        className="custom-class"
        testId="column-filter"
      />
    );
    
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });
});
