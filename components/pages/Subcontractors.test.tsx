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
import '@testing-library/jest-dom';
import Subcontractors from './Subcontractors';

// Mock useTableCrud hook
jest.mock('@/lib/hooks/useTableCrud', () => ({
  useTableCrud: jest.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Tech Builders',
        email: 'contact@techbuilders.com',
        contact_person: 'Alice Johnson',
        phone_number: '+1234567890',
        address: '123 Builder St',
        description: 'Construction services',
      },
      {
        id: '2',
        name: 'Pro Services',
        email: 'info@proservices.com',
        contact_person: 'Bob Smith',
        phone_number: '+0987654321',
        address: '456 Service Ave',
        description: 'Professional services',
      },
    ],
    isLoading: false,
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock dictionaries
const mockDictionary = {
  page_title: "Subcontractors",
  create_button: "Create Subcontractor",
  table_name: "Name",
  table_email: "Email",
  table_contact: "Contact",
  table_phone: "Phone",
  table_address: "Address",
  table_description: "Description",
  modal_create_title: "Create Subcontractor",
  modal_edit_title: "Edit Subcontractor",
  form_name: "Name",
  form_name_required: "Name *",
  form_email: "Email",
  form_contact: "Contact",
  form_phone: "Phone",
  form_address: "Address",
  form_description: "Description",
  delete_confirm_message: "Delete this subcontractor?",
  error_create: "Failed to create",
  error_update: "Failed to update",
};

const mockCommonTable = {
  actions: "Actions",
  edit: "Edit",
  delete: "Delete",
  create: "Create",
  filter_placeholder: "Filter...",
  no_results: "No results found",
  loading: "Loading...",
  export: "Export",
  import: "Import",
  cancel: "Cancel",
  save: "Save",
};

describe('Subcontractors Component', () => {
  it('should render with title', () => {
    render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
    
    expect(screen.getByText('Subcontractors')).toBeInTheDocument();
  });

  it('should display subcontractors data', () => {
    render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
    
    expect(screen.getByText('Tech Builders')).toBeInTheDocument();
    expect(screen.getByText('Pro Services')).toBeInTheDocument();
  });

  it('should open create dialog when create button clicked', async () => {
    render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
    
    const createButton = screen.getByTestId('generic-table-create-button');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('subcontractor-dialog')).toBeInTheDocument();
    });
  });

  it('should render GenericDataTable with correct props', () => {
    render(<Subcontractors dictionary={mockDictionary} commonTable={mockCommonTable} />);
    
    // Should have table
    expect(screen.getByTestId('generic-table-table')).toBeInTheDocument();
    
    // Should have create button
    expect(screen.getByTestId('generic-table-create-button')).toBeInTheDocument();
  });
});
