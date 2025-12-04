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
import mermaid from "mermaid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { ICON_SIZES } from "@/lib/design-tokens";

type DiagramType = "flowchart" | "graph" | "mindmap";

type MermaidPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (_diagramType: DiagramType) => Promise<string>;
  dictionary: {
    mermaid_modal_title: string;
    mermaid_diagram_type: string;
    mermaid_flowchart: string;
    mermaid_graph: string;
    mermaid_mindmap: string;
    mermaid_download: string;
    mermaid_loading: string;
    mermaid_error: string;
    errors: ErrorMessages;
  };
};

export default function MermaidPreviewModal({
  isOpen,
  onClose,
  onGenerate,
  dictionary,
}: Readonly<MermaidPreviewModalProps>) {
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  const [diagramType, setDiagramType] = useState<DiagramType>("flowchart");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [debugInfo, setDebugInfo] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

    // Auto-scale diagram to fit container
  const autoScale = useCallback(() => {
    if (!containerRef.current || !previewRef.current) return;
    
    const container = containerRef.current;
    const preview = previewRef.current;
    const svgElement = preview.querySelector('svg');
    if (!svgElement) {
      console.log('No SVG element found');
      return;
    }
    
    // Get SVG intrinsic dimensions from viewBox or attributes
    let svgWidth = 0, svgHeight = 0;
    
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+|,/).map(Number);
      if (parts.length >= 4) {
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    }
    
    if (!svgWidth || !svgHeight) {
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      if (widthAttr && heightAttr) {
        svgWidth = Number.parseFloat(widthAttr);
        svgHeight = Number.parseFloat(heightAttr);
      }
    }
    
    if (!svgWidth || !svgHeight) {
      return;
    }
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale to fit (with some margin)
    const scaleX = (containerWidth * 0.95) / svgWidth;
    const scaleY = (containerHeight * 0.95) / svgHeight;
    const newScale = Math.min(scaleX, scaleY, 5); // Limit to max 500%
    
    // Calculate centered position
    const scaledWidth = svgWidth * newScale;
    const scaledHeight = svgHeight * newScale;
    const newPosition = {
      x: (containerWidth - scaledWidth) / 2,
      y: (containerHeight - scaledHeight) / 2,
    };
    
    // Debug info
    setDebugInfo(`Container: ${containerWidth}x${containerHeight} | SVG: ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)} | Scale: ${newScale.toFixed(2)} | Scaled: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)} | Pos: ${newPosition.x.toFixed(0)},${newPosition.y.toFixed(0)}`);
    
    // Apply both at once
    setScale(newScale);
    setPosition(newPosition);
  }, []);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
      maxTextSize: 1000000, // 1M characters for large trees
      maxEdges: 5000, // Increased from default 500 to 5000
    });
  }, []);

  // Generate diagram when dialog opens or diagram type changes
  useEffect(() => {
    const generateDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get mermaid code from parent
        const code = await onGenerate(diagramType);

        // Render mermaid diagram
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        
        // Fix SVG dimensions - Mermaid sets width="100%" which breaks our scaling
        // We need to use the intrinsic dimensions from viewBox
        // Use string manipulation to preserve all namespaces and attributes
        let fixedSvg = svg;
        
        // Extract viewBox to get intrinsic dimensions
        const viewBoxRegex = /viewBox=["']([^"']+)["']/;
        const viewBoxMatch = viewBoxRegex.exec(svg);
        if (viewBoxMatch) {
          const parts = viewBoxMatch[1].split(/\s+|,/).map(Number);
          if (parts.length >= 4) {
            const width = parts[2];
            
            // Replace width="100%" with explicit width
            fixedSvg = fixedSvg.replace(/width=["']100%["']/, `width="${width}"`);
            
            // Remove max-width style if present
            fixedSvg = fixedSvg.replace(/style=["'][^"']*max-width:[^;"']*;?[^"']*["']/, '');
          }
        }
        
        setSvgContent(fixedSvg);
        
        // Reset position - autoscale will be triggered by useEffect
        setPosition({ x: 0, y: 0 });
      } catch (err) {
        handleError(err);
        setError(dictionary.mermaid_error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      generateDiagram();
    } else {
      // Reset state when closing
      setSvgContent("");
      setError(null);
    }
  }, [isOpen, diagramType, onGenerate, dictionary.mermaid_error, autoScale, handleError]);

  // Auto-scale when SVG content changes
  useEffect(() => {
    if (svgContent && isOpen) {
      const timer = setTimeout(() => autoScale(), 100);
      return () => clearTimeout(timer);
    }
  }, [svgContent, isOpen, autoScale]);

  const handleDownload = async () => {
    if (!svgContent) return;

    try {
      // Create a temporary container and append to DOM to get computed dimensions
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.innerHTML = svgContent;
      document.body.appendChild(container);
      
      const svgElement = container.querySelector("svg");
      
      if (!svgElement) {
        container.remove();
        throw new Error("No SVG element found");
      }

      // Get SVG dimensions - try multiple methods
      let width = 0;
      let height = 0;

      // Method 1: Try viewBox first (most reliable for Mermaid)
      const viewBox = svgElement.getAttribute("viewBox");
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
        if (vbWidth && vbHeight) {
          width = vbWidth;
          height = vbHeight;
        }
      }

      // Method 2: Try width/height attributes
      if (!width || !height) {
        const widthAttr = svgElement.getAttribute("width");
        const heightAttr = svgElement.getAttribute("height");
        if (widthAttr && heightAttr) {
          width = Number.parseFloat(widthAttr);
          height = Number.parseFloat(heightAttr);
        }
      }

      // Method 3: Use getBoundingClientRect (computed dimensions)
      if (!width || !height) {
        const rect = svgElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }

      // Method 4: Fallback to default
      if (!width || !height) {
        width = 800;
        height = 600;
      }

      // Clone SVG to avoid modifying the displayed one
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Set explicit dimensions on clone
      svgClone.setAttribute("width", width.toString());
      svgClone.setAttribute("height", height.toString());
      if (!svgClone.getAttribute("viewBox")) {
        svgClone.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      // Remove any onclick attributes (external links cause CORS issues)
      const elementsWithClick = svgClone.querySelectorAll('[onclick]');
      for (const el of elementsWithClick) {
        el.removeAttribute('onclick');
      }

      // Clean up DOM
      container.remove();

      // Convert SVG to data URL directly
      const svgString = new XMLSerializer().serializeToString(svgClone);
      // Use modern encoding instead of deprecated unescape
      const base64String = btoa(
        encodeURIComponent(svgString).replaceAll(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCodePoint(Number.parseInt(p1, 16))
        )
      );
      const svgDataUrl = `data:image/svg+xml;base64,${base64String}`;

      // Convert SVG to PNG using canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set canvas size (scale up for better quality)
      const exportScale = 2;
      canvas.width = width * exportScale;
      canvas.height = height * exportScale;

      // Create image from SVG data URL
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Fill white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale context for high DPI
            ctx.scale(exportScale, exportScale);

            // Draw image at full size
            ctx.drawImage(img, 0, 0, width, height);

            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load SVG image"));
        };

        img.src = svgDataUrl;
      });

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `organization-tree-${diagramType}.png`;
          link.href = pngUrl;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }
      }, "image/png");

    } catch (err) {
      handleError(err);
      setError(`Error downloading image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{dictionary.mermaid_modal_title}</DialogTitle>
          <DialogDescription>
            Select a diagram type and download as PNG. Use mouse wheel to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Diagram Type Selector */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Label htmlFor="diagram-type" className="whitespace-nowrap">
              {dictionary.mermaid_diagram_type}
            </Label>
            <Select
              value={diagramType}
              onValueChange={(value: string) => setDiagramType(value as DiagramType)}
            >
              <SelectTrigger id="diagram-type" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flowchart">
                  {dictionary.mermaid_flowchart}
                </SelectItem>
                <SelectItem value="graph">{dictionary.mermaid_graph}</SelectItem>
                <SelectItem value="mindmap">
                  {dictionary.mermaid_mindmap}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Area with Zoom */}
          <div 
            ref={containerRef}
            className="flex-1 border rounded-md overflow-hidden bg-white min-h-0 relative"
            style={{
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              touchAction: 'none', // Prevents passive event listener warning
              overscrollBehavior: 'contain', // Prevents scroll propagation
            }}
            onMouseDown={(e) => {
              if (e.button !== 0) return; // Only left click
              isDraggingRef.current = true;
              dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                startX: position.x,
                startY: position.y,
              };
              e.currentTarget.style.cursor = 'grabbing';
            }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current) return;
              e.preventDefault();
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              setPosition({
                x: dragStartRef.current.startX + dx,
                y: dragStartRef.current.startY + dy,
              });
            }}
            onMouseUp={(e) => {
              isDraggingRef.current = false;
              e.currentTarget.style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              isDraggingRef.current = false;
              e.currentTarget.style.cursor = 'grab';
            }}
            onWheelCapture={(e) => {
              // Don't call preventDefault() - it causes warnings in React 19
              // Instead, CSS overscrollBehavior prevents scroll propagation
              const container = e.currentTarget;
              const rect = container.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              // Calculate position relative to diagram before zoom
              const beforeZoomX = (mouseX - position.x) / scale;
              const beforeZoomY = (mouseY - position.y) / scale;
              
              const delta = e.deltaY > 0 ? 0.9 : 1.1;
              const newScale = Math.min(Math.max(0.1, scale * delta), 5);
              
              // Adjust position to keep mouse point fixed
              setPosition({
                x: mouseX - beforeZoomX * newScale,
                y: mouseY - beforeZoomY * newScale,
              });
              setScale(newScale);
            }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`${ICON_SIZES.xl} animate-spin text-primary`} />
                  <p className="text-sm text-muted-foreground">
                    {dictionary.mermaid_loading}
                  </p>
                </div>
              </div>
            )}
            {!isLoading && error && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {!isLoading && !error && svgContent && (
              <div
                ref={previewRef}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out',
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            )}
            {!isLoading && !error && !svgContent && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-sm text-muted-foreground">No diagram</p>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          {!isLoading && !error && svgContent && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Zoom: {Math.round(scale * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                  if (!containerRef.current || !previewRef.current) return;
                  const container = containerRef.current;
                  const preview = previewRef.current;
                  const svgElement = preview.querySelector('svg');
                  if (!svgElement) return;
                  
                  // Get SVG intrinsic dimensions
                  let svgWidth = 0, svgHeight = 0;
                  
                  const viewBox = svgElement.getAttribute('viewBox');
                  if (viewBox) {
                    const parts = viewBox.split(/\s+|,/).map(Number);
                    if (parts.length >= 4) {
                      svgWidth = parts[2];
                      svgHeight = parts[3];
                    }
                  }
                  
                  if (!svgWidth || !svgHeight) {
                    const widthAttr = svgElement.getAttribute('width');
                    const heightAttr = svgElement.getAttribute('height');
                    if (widthAttr && heightAttr) {
                      svgWidth = Number.parseFloat(widthAttr);
                      svgHeight = Number.parseFloat(heightAttr);
                    }
                  }
                  
                  if (!svgWidth || !svgHeight) return;
                  
                  // Center at 100% scale
                  const containerWidth = container.clientWidth;
                  const containerHeight = container.clientHeight;
                  
                  const newPosition = {
                    x: (containerWidth - svgWidth) / 2,
                    y: (containerHeight - svgHeight) / 2,
                  };
                  
                  setDebugInfo(`RESET - Container: ${containerWidth}x${containerHeight} | SVG: ${svgWidth.toFixed(0)}x${svgHeight.toFixed(0)} | Scale: 1.00 | Pos: ${newPosition.x.toFixed(0)},${newPosition.y.toFixed(0)}`);
                  
                  setScale(1);
                  setPosition(newPosition);
                }}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(Math.min(5, scale + 0.1))}
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={autoScale}
              >
                Fit
              </Button>
            </div>
            {debugInfo && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                {debugInfo}
              </div>
            )}
          </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!svgContent || isLoading}
            >
              <Download className={`${ICON_SIZES.sm} mr-2`} />
              {dictionary.mermaid_download}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
