import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Camera, MapPin, Loader2, CheckCircle2, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface Photo {
  file: File;
  preview: string;
  gpsData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

const ACTIVITY_TYPES = [
  { value: 'crop_health', label: 'Crop Health Check' },
  { value: 'pest_monitoring', label: 'Pest Monitoring' },
  { value: 'disease_detection', label: 'Disease Detection' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilizer_application', label: 'Fertilizer Application' },
  { value: 'weed_control', label: 'Weed Control' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'equipment_check', label: 'Equipment Check' },
  { value: 'soil_test', label: 'Soil Test' },
  { value: 'weather_observation', label: 'Weather Observation' },
  { value: 'general_note', label: 'General Note' },
];

export function ActivityLogger() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [fieldId, setFieldId] = useState<number | null>(null);
  const [activityType, setActivityType] = useState<string>('crop_health');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createActivityMutation = trpc.fieldWorker.createActivityLog.useMutation();

  useEffect(() => {
    // TODO: Get user's farm ID from profile
    if (user?.id) {
      setFarmId(1); // Placeholder
    }
  }, [user]);

  // Request GPS location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsLoading(false);
        },
        (error) => {
          setGpsError('Unable to get location. Please enable location services.');
          setGpsLoading(false);
        }
      );
    }
  }, []);

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);

      // Try to extract GPS data from EXIF (simplified - would need exif library for production)
      const photo: Photo = {
        file,
        preview,
        gpsData: gpsLocation
          ? {
              latitude: gpsLocation.lat,
              longitude: gpsLocation.lng,
              accuracy: 10, // meters
            }
          : undefined,
      };

      setPhotos((prev) => [...prev, photo]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!farmId || !title.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload photos to S3 and get URLs
      const photoUrls = photos.map((p) => p.preview); // Placeholder

      await createActivityMutation.mutateAsync({
        farmId,
        fieldId: fieldId || undefined,
        activityType: activityType as any,
        title,
        description,
        observations,
        gpsLatitude: gpsLocation?.lat,
        gpsLongitude: gpsLocation?.lng,
        photoUrls,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/field-worker/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!farmId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Activity Logged!</h2>
            <p className="text-muted-foreground">Your activity has been recorded successfully.</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Log Activity</h1>
          <p className="text-muted-foreground">Record your field work and observations</p>
        </div>

        {/* GPS Status */}
        {gpsError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">{gpsError}</p>
            </div>
          </div>
        )}

        {gpsLocation && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Location Tagged</p>
              <p className="text-sm text-green-700">
                {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Type */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Title & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning crop inspection in Field A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you do?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Observations
                </label>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="What did you observe? Any issues or concerns?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Documentation
              </CardTitle>
              <CardDescription>Capture photos as evidence of your work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Camera Input */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {/* Upload Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">
                      Photos ({photos.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {photo.gpsData && (
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              GPS
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging Activity...
                </>
              ) : (
                'Log Activity'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/field-worker/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
