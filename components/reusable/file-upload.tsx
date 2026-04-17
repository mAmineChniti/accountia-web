'use client';

import {
  type ChangeEvent,
  forwardRef,
  type Ref,
  useRef,
  useState,
} from 'react';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { Dictionary } from '@/get-dictionary';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect?: (file: File) => void;
  onFileClear?: () => void;
  onFileReject?: (reason: string) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  selectedFile?: File | undefined;
  className?: string;
  error?: string;
  dictionary: Dictionary;
}

function formatFileSize(
  bytes: number,
  t: Dictionary['pages']['invoices']['fileUpload']
): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `0 ${t.bytes}`;
  if (bytes === 0) return `0 ${t.bytes}`;
  const k = 1024;
  const sizeMap: Record<number, string> = {
    0: t.bytes,
    1: t.kb,
    2: t.mb,
    3: t.gb,
  };
  const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), 3));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizeMap[i]
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

function FileUpload(
  {
    accept = '.csv,.xls,.xlsx',
    maxSize = 10,
    onFileSelect,
    onFileClear,
    onFileReject,
    disabled = false,
    isUploading = false,
    uploadProgress = 0,
    selectedFile,
    className,
    error,
    dictionary,
  }: FileUploadProps,
  ref: Ref<HTMLDivElement>
) {
  const t = dictionary.pages.invoices.fileUpload;
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      // Only clear dragActive when leaving the dropzone, not child elements
      const relatedTarget = e.relatedTarget as Node | null;
      if (e.currentTarget && !e.currentTarget.contains(relatedTarget)) {
        setDragActive(false);
      }
    }
  };

  const validateFile = (file: File): string | undefined => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return t.maxSizeError.replace('{maxSize}', String(maxSize));
    }

    // Validate accept prop
    if (accept) {
      const acceptedTypes = accept
        .split(',')
        .map((type) => type.trim().toLowerCase());
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const fileType = file.type.toLowerCase();

      const isAccepted = acceptedTypes.some((type) => {
        // Check MIME type wildcard (e.g., "image/*")
        if (type.endsWith('/*')) {
          const category = type.slice(0, -1);
          return fileType.startsWith(category);
        }
        // Check exact MIME type
        if (type.includes('/')) {
          return fileType === type;
        }
        // Check extension (e.g., ".csv", ".xlsx")
        const ext = type.startsWith('.') ? type.slice(1) : type;
        return fileExtension === ext;
      });

      if (!isAccepted) {
        return t.fileTypeError.replace('{accept}', accept);
      }
    }

    return undefined;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const errorMessage = validateFile(file);
      if (errorMessage) {
        onFileReject?.(errorMessage);
      } else {
        onFileSelect?.(file);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      const errorMessage = validateFile(file);
      if (errorMessage) {
        onFileReject?.(errorMessage);
      } else {
        onFileSelect?.(file);
      }
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
      <div ref={ref} className={className}>
        <Card className="bg-muted/30 border-2 border-dashed">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-background rounded-xl p-3 shadow-sm">
                {getFileIcon(selectedFile.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground text-sm">
                  {formatFileSize(selectedFile.size, t)}
                </p>
                {isUploading && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t.uploading.replace(
                        '{progress}',
                        String(uploadProgress)
                      )}
                    </p>
                  </div>
                )}
                {!isUploading && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{t.readyToImport}</span>
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
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} ref={ref}>
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-disabled={disabled || isUploading}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (
            (e.key === 'Enter' || e.key === ' ') &&
            !disabled &&
            !isUploading
          ) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
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
              {dragActive ? t.dropHere : t.dragDrop}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t.orClickToBrowse}
            </p>
          </div>

          {/* Supported formats */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {accept.split(',').map((type) => {
              if (!type.trim()) return;
              let label: string;
              if (type.startsWith('.')) {
                label = type.replace('.', '').toUpperCase();
              } else if (type.includes('/')) {
                label = type.endsWith('/*')
                  ? type.split('/')[0].toUpperCase()
                  : type.split('/')[1].toUpperCase();
              } else {
                label = type.toUpperCase();
              }
              return (
                <span
                  key={type}
                  className="bg-background/80 text-muted-foreground rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                >
                  {label}
                </span>
              );
            })}
          </div>

          {/* Max size hint */}
          <p className="text-muted-foreground text-xs">
            {t.maxFileSize.replace('{maxSize}', String(maxSize))}
          </p>
        </div>

        <Input
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

export default forwardRef(FileUpload);
