import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { uploadPhotosToS3, validatePhotoFile } from '@/lib/photoUpload';
import { useFormValidation } from '@/hooks/useFormValidation';
import { BatchPhotoUpload } from '@/components/BatchPhotoUpload';
import { useValidationRuleSync } from '@/hooks/useValidationRuleSync';

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

  const [validationRules, setValidationRules] = useState<any[]>([]);
  
  // Fetch validation rules from admin
  const { data: rulesData } = trpc.admin.getValidationRules.useQuery(
    { entityType: 'activity' },
    { enabled: !!user }
  );

  // Listen for validation rule updates via WebSocket
  useValidationRuleSync(
    (update) => {
      if (update.type === 'validation_rules_sync' && update.rules) {
        setValidationRules(update.rules.filter((r: any) => r.entityType === 'activity'));
      }
    },
    (rules) => {
      setValidationRules(rules.filter((r: any) => r.entityType === 'activity'));
    }
  );

  // Update validation rules when fetched
  useEffect(() => {
    if (rulesData?.rules) {
      setValidationRules(rulesData.rules);
    }
  }, [rulesData]);

  // Build dynamic validation config from rules
  const buildValidationConfig = () => {
    const config: any = {
      title: { required: true, minLength: 3 },
      description: { required: true, minLength: 10 },
      activityType: { required: true },
    };

    // Apply validation rules from admin settings
    validationRules.forEach((rule: any) => {
      if (rule.fieldName === 'title' && rule.ruleType === 'minLength' && rule.ruleValue) {
        config.title.minLength = parseInt(rule.ruleValue);
      } else if (rule.fieldName === 'description' && rule.ruleType === 'minLength' && rule.ruleValue) {
        config.description.minLength = parseInt(rule.ruleValue);
      }
    });

    return config;
  };

  const { errors, validateForm, clearError } = useFormValidation(buildValidationConfig());

  const createActivityMutation = trpc.fieldWorker.createActivityLog.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
    },
    onError: (error) => {
      console.error('Failed to create activity:', error);
      alert('Failed to log activity. Please try again.');
    },
  });

  // Initialize farm ID from user
  useEffect(() => {
    if (user?.id) {
      setFarmId(1);
    }
  }, [user?.id]);

  // Re-validate when validation rules change
  useEffect(() => {
    if (title || description) {
      validateForm({ title, description, activityType });
    }
  }, [validationRules, validateForm, title, description, activityType]);

  // Request GPS location on component mount
  useEffect(() => {
    if (!navigator.geolocation) return;

    setGpsLoading(true);
    const timeoutId = setTimeout(() => {
      setGpsLoading(false);
      setGpsError('Location request timed out');
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        setGpsError('Unable to get location. Please enable location services.');
        setGpsLoading(false);
      }
    );
  }, []);

  // Redirect to dashboard after successful submission
  useEffect(() => {
    if (!submitSuccess) return;

    const timer = setTimeout(() => {
      navigate('/field-worker/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [submitSuccess, navigate]);

  // Cleanup photos on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, [photos]);

  const handlePhotosSelected = useCallback(
    (selectedFiles: File[]) => {
      const newPhotos: Photo[] = selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        gpsData: gpsLocation
          ? {
              latitude: gpsLocation.lat,
              longitude: gpsLocation.lng,
              accuracy: 10,
            }
          : undefined,
      }));
      setPhotos(newPhotos);
    },
    [gpsLocation]
  );



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm({ title, description, activityType })) {
      return;
    }

    if (!farmId) {
      alert('Farm ID not initialized');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrls: string[] = [];
      if (photos.length > 0 && farmId) {
        const uploadedPhotos = await uploadPhotosToS3(
          photos.map((p) => p.file),
          farmId,
          gpsLocation
            ? {
                latitude: gpsLocation.lat,
                longitude: gpsLocation.lng,
                accuracy: 10,
              }
            : undefined
        );
        photoUrls = uploadedPhotos.map((p) => p.url);
      }

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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while farmId is being set
  if (!farmId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing activity logger...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state after submission
  if (submitSuccess) {
    // Redirect after 2 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        navigate('/field-worker/activities');
      }, 2000);
      return () => clearTimeout(timer);
    }, [navigate]);

    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Activity Logged!</h2>
            <p className="text-muted-foreground">Your activity has been recorded successfully.</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecting to activities list...</p>
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

        {gpsLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
            <div>
              <p className="font-semibold text-blue-900">Getting your location...</p>
            </div>
          </div>
        )}

        {gpsLocation && !gpsError && (
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
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError('title');
                  }}
                  placeholder="e.g., Morning crop inspection in Field A"
                  required
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError('description');
                  }}
                  placeholder="What did you do?"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
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
              <CardDescription>Capture multiple photos as evidence of your work</CardDescription>
            </CardHeader>
            <CardContent>
              <BatchPhotoUpload
                onPhotosSelected={handlePhotosSelected}
                maxPhotos={10}
                disabled={isSubmitting}
              />
              {photos.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    {photos.length} photo(s) selected and ready for upload
                  </p>
                </div>
              )}
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
