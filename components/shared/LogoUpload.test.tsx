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

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LogoUpload } from "./LogoUpload";
import { toast } from "sonner";
import { SHARED_TEST_IDS } from "@/lib/test-ids";

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
  
  readAsDataURL(file: File) {
    this.result = `data:image/png;base64,mock-${file.name}`;
    if (this.onload) {
      this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  }
}

globalThis.FileReader = MockFileReader as unknown as typeof FileReader;

describe("LogoUpload", () => {
  const mockOnUpload = jest.fn().mockResolvedValue(undefined);
  const mockOnRemove = jest.fn().mockResolvedValue(undefined);
  
  const mockDictionary = {
    upload_button: "Upload logo",
    remove_button: "Remove logo",
    drag_drop: "Drag & drop or click to upload",
    uploading: "Uploading...",
    max_size: "Max size: {size}",
    formats: "Formats: PNG, JPG, SVG",
    error_size: "File is too large (max {size})",
    error_format: "Invalid file format. Accepted: PNG, JPG, SVG",
    success_upload: "{entity} uploaded successfully",
    success_remove: "{entity} removed successfully",
    error_upload: "Failed to upload {entity}",
    error_remove: "Failed to remove {entity}",
    errors: {
      network: 'Network error',
      unauthorized: 'Unauthorized',
      forbidden: 'Forbidden',
      notFound: 'Not found',
      serverError: 'Server error',
      clientError: 'Client error',
      unknown: 'Unknown error',
    },
  };
  
  const defaultProps = {
    onUpload: mockOnUpload,
    onRemove: mockOnRemove,
    entityName: "test entity",
    dictionary: mockDictionary,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render - Upload Mode", () => {
    it("should render upload zone when no logo is present", () => {
      render(<LogoUpload {...defaultProps} />);
      
      // Check for upload text (the component uses default text)
      const uploadText = screen.getByText(/drag.*drop.*click/i);
      expect(uploadText).toBeInTheDocument();
    });

    it("should render with Upload icon when no logo", () => {
      render(<LogoUpload {...defaultProps} />);
      
      const uploadIcon = document.querySelector('svg');
      expect(uploadIcon).toBeInTheDocument();
    });
  });

  describe("Preview Mode", () => {
    it("should render preview when currentLogoUrl is provided", () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo" 
        />
      );
      
      const img = screen.getByAltText("Logo preview");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/api/test/logo");
    });

    it("should show remove button in preview mode", () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo" 
        />
      );
      
      const removeButton = screen.getByRole("button");
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("should handle file selection via click", async () => {
      render(<LogoUpload {...defaultProps} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      
      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      });
    });

  });

  describe("Drag and Drop", () => {
    it("should handle drag leave", () => {
      render(<LogoUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/drag.*drop.*click/i).closest("button");
      
      fireEvent.dragEnter(dropZone!, { dataTransfer: { files: [] } });
      fireEvent.dragLeave(dropZone!, { dataTransfer: { files: [] } });
      
      // Should remove visual feedback
      expect(dropZone).not.toHaveClass("border-primary");
    });

    it("should handle file drop", async () => {
      render(<LogoUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/drag.*drop.*click/i).closest("button");
      const file = new File(["test"], "dropped.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 1024 * 1024 });
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [file] },
      });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      });
    });
  });

  describe("File Validation", () => {
    it("should reject files larger than maxSize", async () => {
      render(<LogoUpload {...defaultProps} maxSize={2 * 1024 * 1024} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const largeFile = new File(["test"], "large.png", { type: "image/png" });
      Object.defineProperty(largeFile, "size", { value: 3 * 1024 * 1024 }); // 3MB
      
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnUpload).not.toHaveBeenCalled();
      });
    });

    it("should reject invalid file formats", async () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          acceptedFormats={["image/png", "image/jpeg"]} 
        />
      );
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const invalidFile = new File(["test"], "test.gif", { type: "image/gif" });
      Object.defineProperty(invalidFile, "size", { value: 1024 * 1024 });
      
      fireEvent.change(input, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnUpload).not.toHaveBeenCalled();
      });
    });

    it("should accept valid PNG file", async () => {
      render(<LogoUpload {...defaultProps} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const validFile = new File(["test"], "valid.png", { type: "image/png" });
      Object.defineProperty(validFile, "size", { value: 1024 * 1024 });
      
      fireEvent.change(input, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(validFile);
        expect(toast.error).not.toHaveBeenCalled();
      });
    });

    it("should accept valid JPG file", async () => {
      render(<LogoUpload {...defaultProps} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const validFile = new File(["test"], "valid.jpg", { type: "image/jpeg" });
      Object.defineProperty(validFile, "size", { value: 1024 * 1024 });
      
      fireEvent.change(input, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(validFile);
        expect(toast.error).not.toHaveBeenCalled();
      });
    });

    it("should accept valid SVG file", async () => {
      render(<LogoUpload {...defaultProps} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const validFile = new File(["test"], "valid.svg", { type: "image/svg+xml" });
      Object.defineProperty(validFile, "size", { value: 1024 * 1024 });
      
      fireEvent.change(input, { target: { files: [validFile] } });
      
      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(validFile);
        expect(toast.error).not.toHaveBeenCalled();
      });
    });
  });

  describe("Upload Process", () => {
    it("should handle upload errors", async () => {
      const failingUpload = jest.fn().mockRejectedValue(new Error("Upload failed"));
      
      render(<LogoUpload {...defaultProps} onUpload={failingUpload} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 1024 * 1024 });
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("Remove Functionality", () => {
    it("should call onRemove when remove button is clicked", async () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo" 
        />
      );
      
      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalled();
      });
    });

    it("should handle remove errors", async () => {
      const failingRemove = jest.fn().mockRejectedValue(new Error("Remove failed"));
      
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo"
          onRemove={failingRemove}
        />
      );
      
      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should show upload mode after successful remove", async () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo" 
        />
      );
      
      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        const uploadText = screen.getByText(/drag.*drop.*click/i);
        expect(uploadText).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible file input", () => {
      render(<LogoUpload {...defaultProps} />);
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      expect(input).toHaveAttribute("accept");
    });

    it("should have alt text on logo image", () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          currentLogoUrl="/api/test/logo" 
        />
      );
      
      const img = screen.getByAltText("Logo preview");
      expect(img).toBeInTheDocument();
    });
  });

  describe("Custom Configuration", () => {
    it("should respect custom maxSize", async () => {
      render(<LogoUpload {...defaultProps} maxSize={1024 * 1024} />); // 1MB
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      const largeFile = new File(["test"], "large.png", { type: "image/png" });
      Object.defineProperty(largeFile, "size", { value: 1.5 * 1024 * 1024 }); // 1.5MB
      
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnUpload).not.toHaveBeenCalled();
      });
    });

    it("should respect custom acceptedFormats", () => {
      render(
        <LogoUpload 
          {...defaultProps} 
          acceptedFormats={["image/png"]} 
        />
      );
      
      const input = screen.getByTestId(SHARED_TEST_IDS.logoUpload.fileInput) as HTMLInputElement;
      expect(input).toHaveAttribute("accept", "image/png");
    });
  });
});
