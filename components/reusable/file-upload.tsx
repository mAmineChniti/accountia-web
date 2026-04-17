'use client';

import * as React from 'react';
import {
  Upload,
  X,
  FileIcon,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect?: (file: File) => void;
  onFileClear?: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  selectedFile?: File | null;
  className?: string;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  );
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    return <FileText className="h-8 w-8 text-green-600" />;
  }
  if (ext === 'xls' || ext === 'xlsx') {
    return <FileSpreadsheet className="h-8 w-8 text-blue-600" />;
  }
  return <FileIcon className="text-muted-foreground h-8 w-8" />;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept = '.csv,.xls,.xlsx',
      maxSize = 10,
      onFileSelect,
      onFileClear,
      disabled = false,
      isUploading = false,
      uploadProgress = 0,
      selectedFile,
      className,
      error,
    },
    ref
  ) => {
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const validateFile = (file: File): boolean => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return false;
      }
      return true;
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect?.(file);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect?.(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    };

    const handleClear = () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      onFileClear?.();
    };

    if (selectedFile) {
      return (
        <Card className={cn('bg-muted/30 border-2 border-dashed', className)}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-background rounded-xl p-3 shadow-sm">
                {getFileIcon(selectedFile.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatFileSize(selectedFile.size)}
                </p>
                {isUploading && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
                {!isUploading && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Ready to import</span>
                  </div>
                )}
              </div>
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  disabled={disabled}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn('space-y-2', className)} ref={ref}>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className={cn(
            'group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200',
            dragActive
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            (disabled || isUploading) && 'cursor-not-allowed opacity-60',
            'p-8'
          )}
        >
          {/* Animated background gradient */}
          <div
            className={cn(
              'from-primary/5 to-primary/5 absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-300',
              dragActive && 'opacity-100'
            )}
          />

          <div className="relative flex flex-col items-center justify-center gap-4">
            {/* Icon with animation */}
            <div
              className={cn(
                'from-muted to-muted/80 rounded-2xl bg-gradient-to-br p-4 shadow-sm transition-all duration-200',
                dragActive && 'from-primary/20 to-primary/10 scale-110'
              )}
            >
              <Upload
                className={cn(
                  'text-muted-foreground h-8 w-8 transition-colors duration-200',
                  dragActive && 'text-primary'
                )}
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-foreground font-semibold">
                {dragActive ? 'Drop your file here' : 'Drag & drop your file'}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                or click to browse from your computer
              </p>
            </div>

            {/* Supported formats */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {accept.split(',').map((type) => (
                <span
                  key={type}
                  className="bg-background/80 text-muted-foreground rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                >
                  {type.replace('.', '').toUpperCase()}
                </span>
              ))}
            </div>

            {/* Max size hint */}
            <p className="text-muted-foreground text-xs">
              Maximum file size: {maxSize}MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>

        {error && (
          <div className="text-destructive flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';

export { FileUpload };
