import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfilePictureUploadProps {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
}

export function ProfilePictureUpload({
  onSuccess,
  onError,
  currentImageUrl,
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const uploadProfilePicture = trpc.upload.profilePicture.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setError(null);
      setPreview(data.url);
      onSuccess?.(data.url);
    },
    onError: (err) => {
      setIsLoading(false);
      const errorMessage = err.message || "Failed to upload profile picture";
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsLoading(true);
    setError(null);

    const reader2 = new FileReader();
    reader2.onload = (e) => {
      const base64 = e.target?.result as string;
      uploadProfilePicture.mutate({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });
    };
    reader2.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Profile Picture Preview */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">👤</div>
              <div className="text-xs">No image</div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleClick}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Change Picture
            </>
          )}
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Info */}
      <div className="text-sm text-gray-600 text-center">
        <p>Supported formats: JPEG, PNG, WebP, GIF</p>
        <p>Maximum size: 5MB</p>
      </div>
    </div>
  );
}
