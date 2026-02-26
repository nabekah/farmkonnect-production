import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, MapPin, Leaf, Map } from "lucide-react";
import { toast } from "sonner";
import { WeatherWidget } from "@/components/WeatherWidget";
import { FarmActivityTimeline } from "@/components/FarmActivityTimeline";

export default function FarmManagement() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    farmName: "",
    location: "",
    latitude: "",
    longitude: "",
    sizeHectares: "",
    farmType: "mixed",
    description: "",
  });
  const [open, setOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; farm: any | null }>({ open: false, farm: null });
  const [editFormData, setEditFormData] = useState({
    farmName: "",
    location: "",
    latitude: "",
    longitude: "",
    sizeHectares: "",
    farmType: "mixed",
    description: "",
    photoUrl: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: farms = [], isLoading } = trpc.farms.list.useQuery();
  const utils = trpc.useUtils();

  const createFarmMutation = trpc.farms.create.useMutation({
    onSuccess: async () => {
      setFormData({
        farmName: "",
        location: "",
        latitude: "",
        longitude: "",
        sizeHectares: "",
        farmType: "mixed",
        description: "",
      });
      setOpen(false);
      // Refetch farms list to show newly created farm
      await utils.farms.list.invalidate();
      toast.success("Farm created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create farm");
    },
  });

  const updateFarmMutation = trpc.farms.update.useMutation({
    onSuccess: async () => {
      setEditDialog({ open: false, farm: null });
      // Refetch farms list to show updated farm
      await utils.farms.list.invalidate();
      toast.success("Farm updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update farm");
    },
  });

  const deleteFarmMutation = trpc.farms.delete.useMutation({
    onSuccess: async () => {
      setEditDialog({ open: false, farm: null });
      // Refetch farms list to remove deleted farm
      await utils.farms.list.invalidate();
      toast.success("Farm deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete farm");
    },
  });

  const handleCreateFarm = async () => {
    if (!formData.farmName) {
      toast.error("Farm name is required");
      return;
    }

    await createFarmMutation.mutateAsync({
      farmName: formData.farmName,
      location: formData.location,
      sizeHectares: formData.sizeHectares,
      farmType: formData.farmType as "crop" | "livestock" | "mixed",
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          toast.success("Location captured!");
        },
        () => {
          toast.error("Unable to get your location");
        }
      );
    }
  };

  const handleFarmDoubleClick = (farm: any) => {
    setEditFormData({
      farmName: farm.farmName || "",
      location: farm.location || "",
      latitude: farm.gpsLatitude || "",
      longitude: farm.gpsLongitude || "",
      sizeHectares: farm.sizeHectares || "",
      farmType: farm.farmType || "mixed",
      description: farm.description || "",
      photoUrl: farm.photoUrl || "",
    });
    setEditDialog({ open: true, farm });
  };

  const uploadPhotoMutation = trpc.upload.farmPhoto.useMutation({
    onSuccess: (data) => {
      setEditFormData({ ...editFormData, photoUrl: data.url });
      toast.success("Photo uploaded successfully!");
      setUploadingPhoto(false);
    },
    onError: () => {
      toast.error("Failed to upload photo");
      setUploadingPhoto(false);
    },
  });

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadPhotoMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload photo");
      setUploadingPhoto(false);
    }
  };

  const handleUpdateFarm = async () => {
    if (!editFormData.farmName) {
      toast.error("Farm name is required");
      return;
    }

    if (!editDialog.farm) return;

    await updateFarmMutation.mutateAsync({
      id: editDialog.farm.id,
      farmName: editFormData.farmName,
      location: editFormData.location,
      gpsLatitude: editFormData.latitude,
      gpsLongitude: editFormData.longitude,
      sizeHectares: editFormData.sizeHectares,
      farmType: editFormData.farmType as "crop" | "livestock" | "mixed",
      description: editFormData.description,
      photoUrl: editFormData.photoUrl,
    });
  };

  const handleDeleteFarm = async () => {
    if (!editDialog.farm) return;
    
    if (!confirm("Are you sure you want to delete this farm? This action cannot be undone.")) {
      return;
    }

    await deleteFarmMutation.mutateAsync({
      id: editDialog.farm.id,
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farm Management</h1>
          <p className="text-muted-foreground">Manage your farms and agricultural operations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Farm</DialogTitle>
              <DialogDescription>Register a new farm to your account with location and details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farmName">Farm Name *</Label>
                  <Input
                    id="farmName"
                    placeholder="e.g., Green Valley Farm"
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="farmType">Farm Type *</Label>
                  <Select value={formData.farmType} onValueChange={(v) => setFormData({ ...formData, farmType: v })}>
                    <SelectTrigger id="farmType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crop">Crop Production</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="mixed">Mixed Farming</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="poultry">Poultry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Farm Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your farm, crops, animals, or operations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sizeHectares">Farm Size (Hectares) *</Label>
                  <Input
                    id="sizeHectares"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 10.5"
                    value={formData.sizeHectares}
                    onChange={(e) => setFormData({ ...formData, sizeHectares: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location/Address</Label>
                  <Input
                    id="location"
                    placeholder="e.g., District, Region"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    GPS Coordinates
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    className="text-xs"
                  >
                    Use Current Location
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      placeholder="e.g., 40.7128"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      placeholder="e.g., -74.0060"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleCreateFarm} disabled={createFarmMutation.isPending} className="w-full">
                {createFarmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Farm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farms.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {farms.reduce((sum, f) => sum + (parseFloat(f.sizeHectares || "0") || 0), 0).toFixed(1)} ha
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined farm size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Farm Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(farms.map(f => f.farmType)).size}</div>
            <p className="text-xs text-muted-foreground mt-1">Different types</p>
          </CardContent>
        </Card>
      </div>

      {/* Farms Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : farms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No farms yet</p>
            <p className="text-muted-foreground mb-6">Create your first farm to unlock the entire platform</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Farm
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Farm</DialogTitle>
                  <DialogDescription>Register a new farm to your account with location and details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farmName">Farm Name *</Label>
                      <Input
                        id="farmName"
                        placeholder="e.g., Green Valley Farm"
                        value={formData.farmName}
                        onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="farmType">Farm Type *</Label>
                      <Select value={formData.farmType} onValueChange={(v) => setFormData({ ...formData, farmType: v })}>
                        <SelectTrigger id="farmType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crop">Crop Production</SelectItem>
                          <SelectItem value="livestock">Livestock</SelectItem>
                          <SelectItem value="mixed">Mixed Farming</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="poultry">Poultry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Farm Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your farm, crops, animals, or operations..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sizeHectares">Farm Size (Hectares) *</Label>
                      <Input
                        id="sizeHectares"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 10.5"
                        value={formData.sizeHectares}
                        onChange={(e) => setFormData({ ...formData, sizeHectares: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location/Address</Label>
                      <Input
                        id="location"
                        placeholder="e.g., District, Region"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        GPS Coordinates
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUseCurrentLocation}
                        className="text-xs"
                      >
                        Use Current Location
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          placeholder="e.g., 40.7128"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          placeholder="e.g., -74.0060"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreateFarm} disabled={createFarmMutation.isPending} className="w-full">
                    {createFarmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Farm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map(farm => (
            <Card 
              key={farm.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onDoubleClick={() => handleFarmDoubleClick(farm)}
            >
              {farm.photoUrl && (
                <div className="w-full h-40 overflow-hidden rounded-t-lg">
                  <img src={farm.photoUrl} alt={farm.farmName} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="flex-1">{farm.farmName}</span>
                  <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                    {farm.farmType}
                  </span>
                </CardTitle>
                {farm.location && (
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farm.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {farm.sizeHectares && (
                    <div>
                      <p className="text-xs text-muted-foreground">Farm Size</p>
                      <p className="font-medium">{farm.sizeHectares} hectares</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Registered</p>
                    <p className="font-medium text-sm">
                      {new Date(farm.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {farm.gpsLatitude && farm.gpsLongitude && (
                    <div className="pt-3 border-t">
                      <WeatherWidget 
                        latitude={parseFloat(farm.gpsLatitude)} 
                        longitude={parseFloat(farm.gpsLongitude)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Farm Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, farm: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Farm</DialogTitle>
            <DialogDescription>Update farm information and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-farmName">Farm Name *</Label>
                <Input
                  id="edit-farmName"
                  placeholder="e.g., Green Valley Farm"
                  value={editFormData.farmName}
                  onChange={(e) => setEditFormData({ ...editFormData, farmName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-farmType">Farm Type</Label>
                <Select
                  value={editFormData.farmType}
                  onValueChange={(value) => setEditFormData({ ...editFormData, farmType: value })}
                >
                  <SelectTrigger id="edit-farmType">
                    <SelectValue placeholder="Select farm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Kumasi, Ashanti Region"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-sizeHectares">Farm Size (hectares)</Label>
              <Input
                id="edit-sizeHectares"
                type="number"
                step="0.01"
                placeholder="e.g., 25.5"
                value={editFormData.sizeHectares}
                onChange={(e) => setEditFormData({ ...editFormData, sizeHectares: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">GPS Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., 6.6885"
                  value={editFormData.latitude}
                  onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">GPS Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., -1.6244"
                  value={editFormData.longitude}
                  onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Additional details about your farm..."
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-photo">Farm Photo</Label>
              <div className="space-y-2">
                {editFormData.photoUrl && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img src={editFormData.photoUrl} alt="Farm" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input
                  id="edit-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
            </div>

            {/* Activity Timeline */}
            {editDialog.farm && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <FarmActivityTimeline farmId={editDialog.farm.id} />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpdateFarm} disabled={updateFarmMutation.isPending} className="flex-1">
                {updateFarmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Farm
              </Button>
              <Button 
                onClick={handleDeleteFarm} 
                disabled={deleteFarmMutation.isPending} 
                variant="destructive"
              >
                {deleteFarmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
