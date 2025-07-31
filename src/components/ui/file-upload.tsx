"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadProgress?: number;
  onUpload?: () => void;
  uploadButtonText?: string;
  title?: string;
  description?: string;
  supportedFormats?: string;
  // New props for better UX
  uploadPhase?: 'idle' | 'uploading' | 'uploaded' | 'transcribing' | 'completed' | 'error';
  transcriptionStatus?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "*/*",
  maxSize = 500 * 1024 * 1024, // 500MB default
  disabled = false,
  className,
  selectedFile,
  isUploading = false,
  uploadProgress = 0,
  onUpload,
  uploadButtonText = "Upload",
  title = "Sleep bestand hierheen",
  description = "of klik hier om een bestand te selecteren",
  supportedFormats = "Alle bestandstypen toegestaan",
  uploadPhase = 'idle',
  transcriptionStatus = ''
}: FileUploadProps) {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Bestand is te groot. Maximum grootte is ${(maxSize / (1024 * 1024)).toFixed(0)}MB.`
      };
    }
    return { valid: true };
  };

  const handleFileSelect = (file: File) => {
    console.log('📁 FileUpload: handleFileSelect called with:', file);
    const validation = validateFile(file);
    console.log('📁 FileUpload: validation result:', validation);

    if (!validation.valid) {
      console.error('📁 FileUpload: validation failed:', validation.error);
      toast({
        title: "Bestand validatie mislukt",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    console.log('📁 FileUpload: calling onFileSelect with:', file.name);
    onFileSelect(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖱️ FileUpload: handleInputChange triggered');
    console.log('🖱️ FileUpload: input accept attribute:', accept);
    console.log('🖱️ FileUpload: user agent:', navigator.userAgent);

    const file = event.target.files?.[0];
    console.log('🖱️ FileUpload: selected file from input:', file);

    if (file) {
      console.log('🖱️ FileUpload: file details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      handleFileSelect(file);
    } else {
      console.log('🖱️ FileUpload: no file selected or file selection cancelled');
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    console.log('🎯 FileUpload: onDrop triggered');
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) {
      console.log('🎯 FileUpload: drop ignored - component disabled');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    console.log('🎯 FileUpload: dropped files:', files);

    if (files.length > 0) {
      console.log('🎯 FileUpload: processing first file:', files[0].name);
      handleFileSelect(files[0]);
    }
  }, [disabled, onFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemove = () => {
    onFileRemove?.();
    setIsDragOver(false);
  };

  if (selectedFile) {
    return (
      <div className={cn("p-6 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", className)}>
        {/* Mobile-first responsive layout */}
        <div className="space-y-4">
          {/* File info section */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-lg truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
              </p>
            </div>
          </div>

          {/* Buttons section - responsive layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isUploading}
              size="sm"
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
            {onUpload && (
              <Button
                onClick={onUpload}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 px-6 w-full sm:w-auto"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploaden...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    {uploadButtonText}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {(isUploading || uploadPhase !== 'idle') && (
          <div className="mt-6 space-y-3">
            {/* Upload Phase */}
            {uploadPhase === 'uploading' && (
              <>
                <div className="flex justify-between text-sm font-medium">
                  <span>Upload voortgang</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Bestand wordt geüpload naar Supabase...
                </p>
              </>
            )}

            {/* Upload Complete */}
            {uploadPhase === 'uploaded' && (
              <>
                <div className="flex justify-between text-sm font-medium">
                  <span>Upload voltooid</span>
                  <span>✅</span>
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Bestand succesvol geüpload! Transcriptie wordt gestart...
                </p>
              </>
            )}

            {/* Transcription Phase */}
            {uploadPhase === 'transcribing' && (
              <>
                <div className="flex justify-between text-sm font-medium">
                  <span>Transcriptie bezig</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <Progress value={100} className="h-2 bg-blue-100" />
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    🎵 Assembly AI verwerkt je audio...
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {transcriptionStatus || 'Dit kan enkele minuten duren afhankelijk van de audiolengte'}
                  </p>
                </div>
              </>
            )}

            {/* Completed */}
            {uploadPhase === 'completed' && (
              <>
                <div className="flex justify-between text-sm font-medium">
                  <span>Transcriptie voltooid</span>
                  <span>🎉</span>
                </div>
                <Progress value={100} className="h-2 bg-green-100" />
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700 font-medium">
                    ✅ Transcriptie succesvol voltooid!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Bekijk het resultaat in de Geschiedenis tab
                  </p>
                </div>
              </>
            )}

            {/* Error */}
            {uploadPhase === 'error' && (
              <>
                <div className="flex justify-between text-sm font-medium">
                  <span>Fout opgetreden</span>
                  <span>❌</span>
                </div>
                <Progress value={0} className="h-2 bg-red-100" />
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">
                    ❌ Er is een fout opgetreden
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {transcriptionStatus || 'Probeer het opnieuw of neem contact op'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragOver 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-primary/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => {
        if (!disabled) {
          console.log('🖱️ FileUpload: div clicked, triggering file input');
          const input = document.getElementById('file-input') as HTMLInputElement;
          if (input) {
            console.log('🖱️ FileUpload: input found, accept:', input.accept);
            input.click();
          } else {
            console.error('🖱️ FileUpload: file input not found');
          }
        }
      }}
    >
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        multiple={false}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          isDragOver ? "bg-primary/10" : "bg-muted"
        )}>
          <Upload className={cn(
            "h-8 w-8 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            {isDragOver ? 'Laat bestand los om te uploaden' : title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          <p className="text-xs text-muted-foreground">
            {supportedFormats}
          </p>

          {/* Extra button for mobile browsers */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🖱️ FileUpload: button clicked');
                const input = document.getElementById('file-input') as HTMLInputElement;
                if (input) {
                  input.click();
                }
              }}
              disabled={disabled}
              className="text-xs"
            >
              Bestand kiezen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
