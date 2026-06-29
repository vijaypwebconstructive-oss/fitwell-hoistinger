import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, File, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkUploadProps {
  endpoint: string;
  title: string;
  description: string;
  templateHeaders: string[];
  onSuccess?: () => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    error: any;
  }>;
}

export default function BulkUpload({ 
  endpoint, 
  title, 
  description, 
  templateHeaders,
  onSuccess 
}: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent = templateHeaders.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(' ', '_')}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/x-excel',
      'application/x-msexcel'
    ];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('excel', file);

      // Try to get CSRF token, but don't fail if it doesn't exist
      let csrfToken: string | undefined;
      try {
        const csrfResponse = await fetch('/api/csrf-token', {
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      } catch (csrfError) {
        // CSRF token endpoint might not exist, continue without it
        console.warn('CSRF token not available, proceeding without it');
      }

      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers
        // Don't set Content-Type for FormData - let browser set it with boundary
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both response structures: { results: {...} } or direct results object
        const results = data.results || data;
        setResult(results);
        
        const successCount = results.success || 0;
        const failedCount = results.failed || 0;
        
        toast({
          title: "Upload completed",
          description: data.message || `Successfully processed ${successCount} records${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          variant: failedCount > 0 ? "destructive" : "default"
        });
        
        if (successCount > 0 && onSuccess) {
          onSuccess();
        }
      } else {
        let errorMessage = "Failed to upload file";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server returned ${response.status}`;
        }
        
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Network error occurred while uploading";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Download */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Download Template</p>
            <p className="text-xs text-muted-foreground">
              Download Excel template with required headers
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${file ? 'bg-muted/50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <File className="w-8 h-8 mx-auto text-primary" />
              <p className="font-medium" data-testid="selected-filename">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button variant="outline" size="sm" onClick={clearFile} data-testid="button-clear-file">
                Choose Different File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="font-medium">Drop Excel file here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supports .xlsx and .xls files up to 10MB
              </p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-browse-file"
              >
                Browse Files
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="file-input"
        />

        {/* Upload Button */}
        {file && (
          <Button 
            onClick={handleUpload} 
            disabled={uploading} 
            className="w-full"
            data-testid="button-upload"
          >
            {uploading ? "Uploading..." : "Upload and Process"}
          </Button>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Processing your Excel file...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {result.success > 0 && (
              <Alert className="border-green-200 bg-green-50" data-testid="success-alert">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully processed {result.success} records
                </AlertDescription>
              </Alert>
            )}

            {result.failed > 0 && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.failed} records failed to process. Check the errors below:
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs bg-destructive/10 p-2 rounded">
                        <strong>Row {error.row}:</strong> {
                          Array.isArray(error.error) 
                            ? error.error.map(e => e.message).join(', ')
                            : error.error
                        }
                      </div>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs">...and {result.errors.length - 5} more errors</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}