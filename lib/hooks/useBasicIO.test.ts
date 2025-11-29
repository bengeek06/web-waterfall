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

import { renderHook, act, waitFor } from '@testing-library/react';
import { useBasicIO, ImportReport } from './useBasicIO';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
const mockRevokeObjectURL = jest.fn();
URL.createObjectURL = mockCreateObjectURL;
URL.revokeObjectURL = mockRevokeObjectURL;

describe('useBasicIO', () => {
  // Store original methods
  const originalCreateElement = document.createElement.bind(document);
  const originalAppendChild = document.body.appendChild.bind(document.body);
  
  // Mock elements
  let mockAnchor: { href: string; download: string; click: jest.Mock; remove: jest.Mock };
  let mockInput: { type: string; accept: string; onchange: ((e: unknown) => void) | null; oncancel: (() => void) | null; click: jest.Mock };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mock elements for each test
    mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
      remove: jest.fn(),
    };
    
    mockInput = {
      type: '',
      accept: '',
      onchange: null,
      oncancel: null,
      click: jest.fn(),
    };
    
    // Mock document.createElement
    document.createElement = jest.fn((tagName: string) => {
      if (tagName === 'a') {
        return mockAnchor as unknown as HTMLAnchorElement;
      }
      if (tagName === 'input') {
        return mockInput as unknown as HTMLInputElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement;
    
    // Mock appendChild
    document.body.appendChild = jest.fn((child) => {
      return child;
    }) as typeof document.body.appendChild;
  });

  afterEach(() => {
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      expect(result.current.isExporting).toBe(false);
      expect(result.current.isImporting).toBe(false);
      expect(result.current.exportError).toBeNull();
      expect(result.current.importError).toBeNull();
      expect(result.current.lastImportReport).toBeNull();
    });

    it('should provide exportData and importData functions', () => {
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      expect(typeof result.current.exportData).toBe('function');
      expect(typeof result.current.importData).toBe('function');
    });
  });

  describe('exportData', () => {
    it('should call fetch with correct URL for JSON export', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/basic-io/export?'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('service=identity');
      expect(fetchUrl).toContain('endpoint=customers');
      expect(fetchUrl).toContain('type=json');
      expect(fetchUrl).toContain('enrich=true');
    });

    it('should call fetch with correct URL for CSV export', async () => {
      const mockBlob = new Blob(['name,email'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/csv' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'csv' });
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('type=csv');
    });

    it('should include IDs when provided', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ 
          format: 'json',
          ids: ['uuid-1', 'uuid-2'],
        });
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('ids=uuid-1%2Cuuid-2');
    });

    it('should trigger file download on success', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.remove).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should call onExportSuccess callback on success', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const onExportSuccess = jest.fn();
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
          onExportSuccess,
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      expect(onExportSuccess).toHaveBeenCalled();
    });

    it('should set exportError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      const onExportError = jest.fn();
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
          onExportError,
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      expect(result.current.exportError).toBeInstanceOf(Error);
      expect(result.current.exportError?.message).toBe('Internal server error');
      expect(onExportError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should set isExporting during export', async () => {
      let resolveBlob: (blob: Blob) => void;
      const blobPromise = new Promise<Blob>((resolve) => {
        resolveBlob = resolve;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => blobPromise,
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportData({ format: 'json' });
      });

      // Should be exporting
      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
      });

      // Resolve the blob
      await act(async () => {
        resolveBlob!(new Blob(['[]'], { type: 'application/json' }));
        await exportPromise;
      });

      // Should no longer be exporting
      expect(result.current.isExporting).toBe(false);
    });

    it('should use entityName for filename if provided', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
          entityName: 'my-customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      // The download attribute on the anchor should contain the entityName
      expect(mockAnchor.download).toContain('my-customers');
      expect(mockAnchor.download).toMatch(/my-customers_\d{4}-\d{2}-\d{2}\.json/);
    });

    it('should use endpoint as fallback for filename', async () => {
      const mockBlob = new Blob(['[]'], { type: 'application/json' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        blob: () => Promise.resolve(mockBlob),
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      await act(async () => {
        await result.current.exportData({ format: 'json' });
      });

      expect(mockAnchor.download).toContain('customers');
    });
  });

  describe('importData', () => {
    it('should build correct URL for import', async () => {
      // Mock file input click to simulate file selection
      const mockFile = new File(['[{"name":"Test"}]'], 'test.json', { type: 'application/json' });
      mockInput.click = jest.fn(() => {
        // Simulate async file selection
        setTimeout(() => {
          if (mockInput.onchange) {
            mockInput.onchange({ target: { files: [mockFile] } });
          }
        }, 0);
      });

      const mockReport: ImportReport = {
        import_report: {
          total: 1,
          success: 1,
          failed: 0,
          id_mapping: { 'old-uuid': 'new-uuid' },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReport),
      });

      const onImportSuccess = jest.fn();
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
          onImportSuccess,
        })
      );

      let importResult: ImportReport | null;
      await act(async () => {
        importResult = await result.current.importData({ format: 'json' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/basic-io/import?'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('service=identity');
      expect(fetchUrl).toContain('endpoint=customers');
      expect(fetchUrl).toContain('type=json');

      expect(importResult!).toEqual(mockReport);
      expect(onImportSuccess).toHaveBeenCalledWith(mockReport);
      expect(result.current.lastImportReport).toEqual(mockReport);
    });

    it('should return null when file picker is cancelled', async () => {
      // Mock file input click to simulate cancel
      mockInput.click = jest.fn(() => {
        setTimeout(() => {
          if (mockInput.oncancel) {
            mockInput.oncancel();
          }
        }, 0);
      });

      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
        })
      );

      let importResult: ImportReport | null;
      await act(async () => {
        importResult = await result.current.importData({ format: 'json' });
      });

      expect(importResult!).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set importError on failure', async () => {
      const mockFile = new File(['invalid'], 'test.json', { type: 'application/json' });
      mockInput.click = jest.fn(() => {
        setTimeout(() => {
          if (mockInput.onchange) {
            mockInput.onchange({ target: { files: [mockFile] } });
          }
        }, 0);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid JSON format' }),
      });

      const onImportError = jest.fn();
      const { result } = renderHook(() =>
        useBasicIO({
          service: 'identity',
          endpoint: 'customers',
          onImportError,
        })
      );

      await act(async () => {
        await result.current.importData({ format: 'json' });
      });

      expect(result.current.importError).toBeInstanceOf(Error);
      expect(result.current.importError?.message).toBe('Invalid JSON format');
      expect(onImportError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

