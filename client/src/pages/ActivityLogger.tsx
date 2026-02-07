import { useState } from 'react';
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
import { AlertCircle, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';

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
  
  // Form state
  const [activityType, setActivityType] = useState('crop_health');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Mutation
  const createActivityMutation = trpc.fieldWorker.createActivityLog.useMutation({
    onSuccess: () => {
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/field-worker/dashboard');
      }, 2000);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to log activity');
      setIsSubmitting(false);
    },
  });

  // Get GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

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
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!activityType) {
      errors.activityType = 'Activity type is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setSubmitError('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createActivityMutation.mutateAsync({
        farmId: 1, // Default farm ID
        activityType: activityType as any,
        title: title.trim(),
        description: description.trim(),
        observations: observations.trim() || undefined,
        gpsLatitude: gpsLocation?.lat,
        gpsLongitude: gpsLocation?.lng,
        photoUrls: [],
      });
    } catch (error) {
      console.error('Error submitting activity:', error);
    }
  };

  // Show success state
  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
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

        {/* Error Alert */}
        {submitError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Details</CardTitle>
            <CardDescription>Fill in the details of your field activity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Activity Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Activity Type *</label>
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
                {validationErrors.activityType && (
                  <p className="text-sm text-red-600">{validationErrors.activityType}</p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Enter activity title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (validationErrors.title) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.title;
                        return updated;
                      });
                    }
                  }}
                  className={validationErrors.title ? 'border-red-500' : ''}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Describe what you observed and did"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (validationErrors.description) {
                      setValidationErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.description;
                        return updated;
                      });
                    }
                  }}
                  rows={4}
                  className={validationErrors.description ? 'border-red-500' : ''}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Observations</label>
                <Textarea
                  placeholder="Any additional notes or observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                />
              </div>

              {/* GPS Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium">GPS Location</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="flex items-center gap-2"
                  >
                    {gpsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Get Location
                      </>
                    )}
                  </Button>
                  {gpsLocation && (
                    <Badge variant="secondary">
                      {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                    </Badge>
                  )}
                </div>
                {gpsError && (
                  <p className="text-sm text-amber-600">{gpsError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Log Activity'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/field-worker/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
