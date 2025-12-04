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

import { useState, useEffect, useRef, useCallback } from "react";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import type { ErrorMessages } from "@/lib/hooks/useErrorHandler";
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  ChevronRight,
  Home,
  Upload,
  FolderPlus,
  Download,
  Trash2,
  Edit,
  Copy,
  Scissors,
  ClipboardPaste,
  MoreVertical,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { STORAGE_ROUTES } from "@/lib/api-routes/storage";
import { ICON_SIZES } from "@/lib/design-tokens";

// ==================== TYPES ====================

interface FileItem {
  id?: string;
  file_id?: string;
  logical_path: string;
  mime_type?: string;
  size?: number;
  updated_at?: string;
  is_folder?: boolean;
}

interface FileExplorerProps {
  readonly dictionary: Record<string, string>;
  readonly errors: ErrorMessages;
}

interface ClipboardItem {
  item: FileItem;
  operation: "copy" | "cut";
}

// ==================== UTILITIES ====================

const normalizePath = (...parts: string[]): string => {
  const joined = parts.join("/");
  // Remove double slashes
  const normalized = joined.replaceAll(/\/+/g, "/");
  return normalized.startsWith("/") ? normalized : "/" + normalized;
};

// For storage API: removes leading slash since backend adds bucket prefix
const normalizeStoragePath = (...parts: string[]): string => {
  const normalized = normalizePath(...parts);
  return normalized.startsWith("/") ? normalized.slice(1) : normalized;
};

const getFileIcon = (mimeType: string | undefined, isFolder: boolean) => {
  if (isFolder) return <Folder className={`${ICON_SIZES.md} text-yellow-500`} />;
  
  if (!mimeType) return <File className={ICON_SIZES.md} />;
  
  if (mimeType.startsWith("image/")) return <FileImage className={`${ICON_SIZES.md} text-blue-500`} />;
  if (mimeType.startsWith("text/")) return <FileText className={`${ICON_SIZES.md} text-gray-500`} />;
  if (mimeType.includes("code") || mimeType.includes("javascript") || mimeType.includes("python")) {
    return <FileCode className={`${ICON_SIZES.md} text-green-500`} />;
  }
  if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return <FileArchive className={`${ICON_SIZES.md} text-orange-500`} />;
  }
  
  return <File className={ICON_SIZES.md} />;
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
};

const getFileName = (logicalPath: string): string => {
  const parts = logicalPath.split("/").filter(Boolean);
  return parts.at(-1) || logicalPath;
};

// ==================== COMPONENT ====================

export function FileExplorer({ dictionary, errors }: Readonly<FileExplorerProps>) {
  // Error handler
  const { handleError } = useErrorHandler({ messages: errors });
  
  // State
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  
  // Dialogs
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user_id on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user_id);
        }
      } catch (error) {
        handleError(error);
      }
    };
    fetchUserId();
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        bucket: "users",
        id: userId || "",
        path: normalizeStoragePath(currentPath), // Remove leading slash for API
      });
      
      const res = await fetch(`${STORAGE_ROUTES.list}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      
      const data = await res.json();
      const rawFiles = data.files || [];
      
      // Normalize current path for comparison (remove leading/trailing slashes)
      const normalizedCurrentPath = currentPath.replace(/^\/+|\/+$/g, "");
      
      // Extract folders from .keep files and filter regular files
      const folders = new Map<string, FileItem>();
      const regularFiles: FileItem[] = [];
      
      for (const file of rawFiles) {
        // Skip archived/deleted files
        if (file.status === "archived" || file.is_deleted) {
          continue;
        }
        
        // Normalize file path
        const filePath = (file.logical_path || "").replace(/^\/+/, "");
        
        if (file.logical_path?.endsWith("/.keep")) {
          // Extract folder path from .keep file
          const folderPath = filePath.replace("/.keep", "");
          
          // Check if this folder is a direct child of current path
          const relativePath = normalizedCurrentPath 
            ? folderPath.replace(normalizedCurrentPath + "/", "")
            : folderPath;
          
          // Only show if it's a direct child (no more slashes in relative path)
          if (!relativePath.includes("/") && relativePath !== "" && folderPath !== normalizedCurrentPath) {
            const folderName = relativePath;
            const fullFolderPath = normalizedCurrentPath ? `/${normalizedCurrentPath}/${folderName}` : `/${folderName}`;
            
            if (!folders.has(fullFolderPath)) {
              folders.set(fullFolderPath, {
                ...file,
                logical_path: fullFolderPath,
                is_folder: true,
                mime_type: "folder",
              });
            }
          }
        } else {
          // Regular file - skip .keep files entirely
          if (filePath === ".keep" || filePath.endsWith("/.keep")) {
            continue;
          }
          
          // Check if it's in current directory
          const relativePath = normalizedCurrentPath 
            ? filePath.replace(normalizedCurrentPath + "/", "")
            : filePath;
          
          // Only show files in current directory (no slashes in relative path)
          if (!relativePath.includes("/")) {
            regularFiles.push({
              ...file,
              logical_path: `/${filePath}`,
            });
          }
        }
      }
      
      setFiles([...Array.from(folders.values()), ...regularFiles]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, dictionary, userId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Navigation
  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  // Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    await uploadFiles(Array.from(selectedFiles));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append("bucket_type", "users");
        formData.append("bucket_id", userId || "");
        formData.append("logical_path", normalizeStoragePath(currentPath, file.name));
        formData.append("file", file);

        const res = await fetch(STORAGE_ROUTES.uploadProxy, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        // Success - silent or could show alert
      } catch (error) {
        handleError(error);
      }
    }
    
    fetchFiles();
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      // Create folder by uploading a .keep file
      const formData = new FormData();
      formData.append("bucket_type", "users");
      formData.append("bucket_id", userId || "");
      formData.append("logical_path", normalizeStoragePath(currentPath, newFolderName, ".keep"));
      formData.append("file", new Blob([""]), ".keep");

      const res = await fetch(STORAGE_ROUTES.uploadProxy, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        handleError(new Error("Failed to create folder"));
        throw new Error("Failed to create folder");
      }
      
      const responseData = await res.json();
      console.log("Folder created:", responseData);

      setShowCreateFolderDialog(false);
      setNewFolderName("");
      fetchFiles();
    } catch (error) {
      handleError(error);
    }
  };

  // Delete
  const handleDelete = async (item: FileItem) => {
    if (!userId) return;
    
    const confirmed = globalThis.confirm(
      item.is_folder ? dictionary.confirm_delete_folder : dictionary.confirm_delete
    );
    
    if (!confirmed) return;

    try {
      // Use the file_id from the item, or the id field
      const fileId = item.file_id || item.id;
      if (!fileId) {
        handleError(new Error("Cannot delete: missing file ID"));
        return;
      }

      const res = await fetch(STORAGE_ROUTES.delete, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileId,
          physical: true,  // Physical deletion to allow recreating folders with same name
        }),
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchFiles();
    } catch (error) {
      handleError(error);
    }
  };

  // Rename
  const handleRename = async () => {
    if (!selectedItem || !newItemName.trim()) return;

    try {
      // Rename = copy to new path + delete old
      const newPath = normalizePath(currentPath, newItemName);
      
      const copyRes = await fetch(STORAGE_ROUTES.copy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_bucket: "users",
          source_id: userId || "",
          source_path: selectedItem.logical_path,
          target_bucket: "users",
          target_id: userId || "",
          target_path: newPath,
        }),
      });

      if (!copyRes.ok) throw new Error("Rename failed");

      if (selectedItem.file_id) {
        await fetch(STORAGE_ROUTES.delete, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: selectedItem.file_id, physical: true }),
        });
      }

      setShowRenameDialog(false);
      setNewItemName("");
      setSelectedItem(null);
      fetchFiles();
    } catch (error) {
      handleError(error);
    }
  };

  // Clipboard operations
  const handleCopy = (item: FileItem) => {
    setClipboard({ item, operation: "copy" });
    // Copied to clipboard - silent operation
  };

  const handleCut = (item: FileItem) => {
    setClipboard({ item, operation: "cut" });
    // Cut to clipboard - silent operation
  };

  const handlePaste = async () => {
    if (!clipboard) return;

    try {
      const newPath = normalizePath(currentPath, getFileName(clipboard.item.logical_path));
      
      const res = await fetch(STORAGE_ROUTES.copy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_bucket: "users",
          source_id: userId || "",
          source_path: clipboard.item.logical_path,
          target_bucket: "users",
          target_id: userId || "",
          target_path: newPath,
        }),
      });

      if (!res.ok) throw new Error("Paste failed");

      // If cut operation, delete source
      if (clipboard.operation === "cut" && clipboard.item.file_id) {
        await fetch(STORAGE_ROUTES.delete, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: clipboard.item.file_id, physical: true }),
        });
      }

      setClipboard(null);
      fetchFiles();
    } catch (error) {
      handleError(error);
    }
  };

  // Download
  const handleDownload = async (item: FileItem) => {
    if (item.is_folder) return;

    try {
      const params = new URLSearchParams({
        bucket_type: "users",
        bucket_id: userId || "",
        logical_path: item.logical_path,
      });
      
      const res = await fetch(`${STORAGE_ROUTES.downloadProxy}?${params}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName(item.logical_path);
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error);
    }
  };

  // Breadcrumb
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPath("/")}
            >
              <Home className={ICON_SIZES.sm} />
            </Button>
            {pathParts.map((part, index) => (
              <div key={`${part}-${index}`} className="flex items-center gap-2">
                <ChevronRight className={`${ICON_SIZES.sm} text-muted-foreground`} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newPath = "/" + pathParts.slice(0, index + 1).join("/");
                    setCurrentPath(newPath);
                  }}
                >
                  {part}
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {clipboard && (
              <Button variant="outline" size="sm" onClick={handlePaste}>
                <ClipboardPaste className={`${ICON_SIZES.sm} mr-2`} />
                {dictionary.paste}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolderDialog(true)}
            >
              <FolderPlus className={`${ICON_SIZES.sm} mr-2`} />
              {dictionary.create_folder}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`${ICON_SIZES.sm} mr-2`} />
              {dictionary.upload_files}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </Card>

      {/* File List */}
      <Card
        className={`p-4 min-h-[400px] ${isDragging ? "border-primary border-2" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!isLoading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Folder className="h-16 w-16 mb-4 opacity-50" />
            <p>{dictionary.empty_folder}</p>
            <p className="text-sm mt-2">{dictionary.drag_drop_hint}</p>
          </div>
        )}
        
        {!isLoading && files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.logical_path}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent group"
              >
                <span
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    if (file.is_folder) {
                      navigateToFolder(file.logical_path);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && file.is_folder) {
                      e.preventDefault();
                      navigateToFolder(file.logical_path);
                    }
                  }}
                >
                  {getFileIcon(file.mime_type, file.is_folder || false)}
                  <div>
                    <div className="font-medium">{getFileName(file.logical_path)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {formatDate(file.updated_at)}
                    </div>
                  </div>
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="group-hover:bg-accent">
                      <MoreVertical className={ICON_SIZES.sm} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!file.is_folder && (
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className={`${ICON_SIZES.sm} mr-2`} />
                        {dictionary.download}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedItem(file);
                        setNewItemName(getFileName(file.logical_path));
                        setShowRenameDialog(true);
                      }}
                    >
                      <Edit className={`${ICON_SIZES.sm} mr-2`} />
                      {dictionary.rename}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopy(file)}>
                      <Copy className={`${ICON_SIZES.sm} mr-2`} />
                      {dictionary.copy}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCut(file)}>
                      <Scissors className={`${ICON_SIZES.sm} mr-2`} />
                      {dictionary.cut}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(file)}
                      className="text-destructive"
                    >
                      <Trash2 className={`${ICON_SIZES.sm} mr-2`} />
                      {dictionary.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.create_folder}</DialogTitle>
            <DialogDescription>{dictionary.folder_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">{dictionary.folder_name}</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={dictionary.folder_name_placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
              {dictionary.cancel}
            </Button>
            <Button onClick={handleCreateFolder}>{dictionary.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary.rename}</DialogTitle>
            <DialogDescription>{dictionary.new_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">{dictionary.new_name}</Label>
              <Input
                id="new-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={dictionary.new_name_placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              {dictionary.cancel}
            </Button>
            <Button onClick={handleRename}>{dictionary.rename}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
