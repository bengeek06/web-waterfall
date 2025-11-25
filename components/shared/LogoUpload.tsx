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

"use client";

/**
 * LogoUpload Component
 * 
 * Reusable component for uploading, previewing, and removing entity logos.
 * Supports drag & drop, file validation (size and format), and preview display.
 * 
 * Features:
 * - Drag & drop support with visual feedback
 * - File validation (default: 2MB max, PNG/JPG/SVG formats)
 * - Image preview with FileReader
 * - Upload progress indicator
 * - Remove logo functionality
 * - Toast notifications for success/errors
 * - Accessibility compliant (native button, keyboard support)
 * 
 * @example
 * ```tsx
 * <LogoUpload
 *   currentLogoUrl="/api/customers/123/logo"
 *   onUpload={async (file) => {
 *     const formData = new FormData();
 *     formData.append('logo', file);
 *     await fetch('/api/customers/123/logo', { method: 'POST', body: formData });
 *   }}
 *   onRemove={async () => {
 *     await fetch('/api/customers/123/logo', { method: 'DELETE' });
 *   }}
 *   entityName="customer"
 * />
 * ```
 */

// ==================== IMPORTS ====================

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { toast } from "sonner";
import { ICON_SIZES, ICON_COLORS } from "@/lib/design-tokens";
import { SHARED_TEST_IDS, testId } from "@/lib/test-ids";

// ==================== TYPE DEFINITIONS ====================

/**
 * Props for LogoUpload component
 */
interface LogoUploadProps {
  /** Current logo URL (if exists) - displayed in preview mode */
  currentLogoUrl?: string;
  /** Callback when a file is selected for upload - receives the File object */
  onUpload: (_file: File) => Promise<void>;
  /** Callback when logo removal is requested - called when remove button is clicked */
  onRemove: () => Promise<void>;
  /** Maximum file size in bytes (default: 2MB = 2 * 1024 * 1024) */
  maxSize?: number;
  /** Accepted MIME types (default: PNG, JPG, SVG) */
  acceptedFormats?: string[];
  /** Entity name for error messages and alt text (e.g., "customer", "user") */
  entityName?: string;
  /** Dictionary for i18n (optional - uses defaults if not provided) */
  dictionary?: {
    upload_button?: string;
    remove_button?: string;
    drag_drop?: string;
    max_size?: string;
    formats?: string;
    uploading?: string;
    error_size?: string;
    error_format?: string;
  };
}

// ==================== CONSTANTS ====================

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_FORMATS = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

// ==================== HELPER FUNCTIONS ====================

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file size and format
 */
function validateFile(
  file: File,
  maxSize: number,
  acceptedFormats: string[]
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${formatFileSize(file.size)}). Maximum size: ${formatFileSize(maxSize)}`,
    };
  }

  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid format (${file.type}). Accepted: ${acceptedFormats.join(", ")}`,
    };
  }

  return { valid: true };
}

// ==================== MAIN COMPONENT ====================

export function LogoUpload({
  currentLogoUrl,
  onUpload,
  onRemove,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_FORMATS,
  entityName = "logo",
  dictionary,
}: Readonly<LogoUploadProps>) {
  // ==================== STATE ====================

  const [preview, setPreview] = useState<string | undefined>(currentLogoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== HANDLERS ====================

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file, maxSize, acceptedFormats);
      if (!validation.valid) {
        toast.error(validation.error || dictionary?.error_format || "Invalid file");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      try {
        await onUpload(file);
        toast.success(`${entityName} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${entityName}`);
        setPreview(currentLogoUrl); // Restore previous preview
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSize, acceptedFormats, entityName, currentLogoUrl, dictionary]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(async () => {
    setIsUploading(true);
    try {
      await onRemove();
      setPreview(undefined);
      toast.success(`${entityName} removed successfully`);
    } catch (error) {
      console.error("Remove error:", error);
      toast.error(`Failed to remove ${entityName}`);
    } finally {
      setIsUploading(false);
    }
  }, [onRemove, entityName]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ==================== RENDER HELPERS ====================

  const renderContent = () => {
    if (isUploading) {
      return (
        <div className="flex flex-col items-center gap-2" {...testId(SHARED_TEST_IDS.logoUpload.loadingSpinner)}>
          <Loader2 className={`${ICON_SIZES.xl} animate-spin ${ICON_COLORS.muted}`} />
          <span className="text-xs text-muted-foreground">
            {dictionary?.uploading || "Uploading..."}
          </span>
        </div>
      );
    }

    if (preview) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Logo preview"
          className="h-full w-full rounded-lg object-contain p-2"
          {...testId(SHARED_TEST_IDS.logoUpload.previewImage)}
        />
      );
    }

    return (
      <div className="flex flex-col items-center gap-2 p-4 text-center">
        <Building2 className={`${ICON_SIZES.xl} ${ICON_COLORS.muted}`} />
        <p className="text-xs text-muted-foreground">
          {dictionary?.drag_drop || "Drag & drop or click to upload"}
        </p>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-2" {...testId(SHARED_TEST_IDS.logoUpload.container)}>
      {/* Preview or Drop Zone */}
      <div className="relative">
        {!preview && !isUploading ? (
          // Upload mode - clickable button
          <button
            type="button"
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed transition-colors",
              isDragging && "border-primary bg-primary/5",
              !isDragging && "border-muted-foreground/25 bg-muted/30",
              "cursor-pointer hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            {...testId(SHARED_TEST_IDS.logoUpload.dropZone)}
          >
            {renderContent()}
          </button>
        ) : (
          // Preview/uploading mode - non-interactive div (drag & drop only)
          <div
            aria-label="Logo preview and upload area"
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed transition-colors",
              isDragging && "border-primary bg-primary/5",
              !isDragging && "border-muted-foreground/25 bg-muted/30",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            {...testId(SHARED_TEST_IDS.logoUpload.preview)}
          >
            {renderContent()}
          </div>
        )}
        
        {/* Remove button - outside the drop zone */}
        {preview && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute -right-2 -top-2"
            onClick={handleRemove}
            disabled={isUploading}
            {...testId(SHARED_TEST_IDS.logoUpload.removeButton)}
          >
            <X className={ICON_SIZES.sm} />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
        {...testId(SHARED_TEST_IDS.logoUpload.fileInput)}
      />

      {/* Upload button (only if no preview) */}
      {!preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full"
          {...testId(SHARED_TEST_IDS.logoUpload.uploadButton)}
        >
          <Upload className={ICON_SIZES.sm} />
          {dictionary?.upload_button || "Upload logo"}
        </Button>
      )}

      {/* File requirements */}
      <div className="space-y-1 text-xs text-muted-foreground" {...testId(SHARED_TEST_IDS.logoUpload.infoText)}>
        <p>
          {dictionary?.max_size || `Max size: ${formatFileSize(maxSize)}`}
        </p>
        <p>
          {dictionary?.formats || `Formats: PNG, JPG, SVG`}
        </p>
      </div>
    </div>
  );
}
