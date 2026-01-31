import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { DatePickerPopover } from "./DatePickerPopover";
import { Plus, AlertTriangle, Loader2, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CropTreatmentLog } from "./CropTreatmentLog";

interface CropHealthMonitoringProps {
  cycleId: number;
}

export function CropHealthMonitoring({ cycleId }: CropHealthMonitoringProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: healthRecords = [], refetch } = trpc.crops.health.list.useQuery({ cycleId });
  const createHealthRecord = trpc.crops.health.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Health record created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create health record: ${error.message}`);
    },
  });

  const uploadMutation = trpc.upload.cropHealthPhoto.useMutation();

  const [healthForm, setHealthForm] = useState({
    recordDate: new Date(),
    issueType: "disease" as "disease" | "pest" | "nutrient_deficiency" | "weather_damage" | "other",
    issueName: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    affectedArea: "",
    symptoms: "",
    photoUrls: [] as string[],
    notes: "",
  });

  const resetForm = () => {
    setHealthForm({
      recordDate: new Date(),
      issueType: "disease",
      issueName: "",
      severity: "medium",
      affectedArea: "",
      symptoms: "",
      photoUrls: [],
      notes: "",
    });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error("You can only upload up to 5 images");
      return;
    }

    setSelectedImages([...selectedImages, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (selectedImages.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedImages) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;

        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
        uploadedUrls.push(result.url);
      }

      setHealthForm({ ...healthForm, photoUrls: [...healthForm.photoUrls, ...uploadedUrls] });
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!healthForm.issueName) {
      toast.error("Please provide an issue name");
      return;
    }

    await createHealthRecord.mutateAsync({
      cycleId,
      recordDate: healthForm.recordDate,
      issueType: healthForm.issueType,
      issueName: healthForm.issueName,
      severity: healthForm.severity,
      affectedArea: healthForm.affectedArea,
      symptoms: healthForm.symptoms,
      photoUrls: healthForm.photoUrls.join(","),
      notes: healthForm.notes,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "treated":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Crop Health Records</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Health Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Crop Health Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Record Date</Label>
                  <DatePickerPopover
                    value={healthForm.recordDate}
                    onChange={(date) => setHealthForm({ ...healthForm, recordDate: date || new Date() })}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <Label>Issue Type</Label>
                  <Select
                    value={healthForm.issueType}
                    onValueChange={(val: any) => setHealthForm({ ...healthForm, issueType: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disease">Disease</SelectItem>
                      <SelectItem value="pest">Pest</SelectItem>
                      <SelectItem value="nutrient_deficiency">Nutrient Deficiency</SelectItem>
                      <SelectItem value="weather_damage">Weather Damage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Name *</Label>
                  <Input
                    value={healthForm.issueName}
                    onChange={(e) => setHealthForm({ ...healthForm, issueName: e.target.value })}
                    placeholder="e.g., Leaf Blight, Aphids"
                  />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select
                    value={healthForm.severity}
                    onValueChange={(val: any) => setHealthForm({ ...healthForm, severity: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Affected Area</Label>
                <Input
                  value={healthForm.affectedArea}
                  onChange={(e) => setHealthForm({ ...healthForm, affectedArea: e.target.value })}
                  placeholder="e.g., North section, 20% of field"
                />
              </div>

              <div>
                <Label>Symptoms</Label>
                <Textarea
                  value={healthForm.symptoms}
                  onChange={(e) => setHealthForm({ ...healthForm, symptoms: e.target.value })}
                  placeholder="Describe visible symptoms..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Photos</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="flex-1"
                    />
                    {selectedImages.length > 0 && (
                      <Button
                        type="button"
                        onClick={handleUploadImages}
                        disabled={isUploadingImage}
                        variant="outline"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload ({selectedImages.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {healthForm.photoUrls.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Uploaded Photos:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {healthForm.photoUrls.map((url, index) => (
                          <img key={index} src={url} alt={`Uploaded ${index + 1}`} className="w-full h-24 object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={healthForm.notes}
                  onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
                  placeholder="Additional observations..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createHealthRecord.isPending}>
                  {createHealthRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {healthRecords.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No health issues reported for this crop cycle</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {healthRecords.map((record: any) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{record.issueName}</CardTitle>
                    <CardDescription>
                      {format(new Date(record.recordDate), "MMM d, yyyy")}
                      {record.affectedArea && ` • ${record.affectedArea}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(record.severity)}>{record.severity}</Badge>
                    <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="font-medium">Type:</span>
                  <span className="text-muted-foreground">{record.issueType.replace(/_/g, " ")}</span>
                </div>
                {record.symptoms && (
                  <div>
                    <p className="text-sm font-medium mb-1">Symptoms:</p>
                    <p className="text-sm text-muted-foreground">{record.symptoms}</p>
                  </div>
                )}
                {record.photoUrls && (
                  <div>
                    <p className="text-sm font-medium mb-2">Photos:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {record.photoUrls.split(",").map((url: string, index: number) => (
                        <img key={index} src={url} alt={`Issue ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{record.notes}</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t">
                  <CropTreatmentLog 
                    healthRecordId={record.id} 
                    onTreatmentAdded={() => refetch()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
