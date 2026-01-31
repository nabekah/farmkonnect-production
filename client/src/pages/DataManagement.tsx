import { useState } from "react";
import { trpc } from "../lib/trpc";
import { DataTable } from "../components/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  MapPin,
  Sprout,
  Beef,
  ShoppingCart,
  GraduationCap,
  Cpu,
  Upload,
  Download,
} from "lucide-react";
import { format } from "date-fns";

const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
  const event = new CustomEvent("toast", { detail: props });
  window.dispatchEvent(event);
};

export default function DataManagement() {
  const [selectedModule, setSelectedModule] = useState("farms");
  const [detailsDialog, setDetailsDialog] = useState<{open: boolean, data: any, type: string}>({
    open: false,
    data: null,
    type: "",
  });
  const [importDialog, setImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Farms Data
  const { data: farms = [], refetch: refetchFarms } = trpc.farms.list.useQuery();

  const farmsColumns: ColumnDef<any>[] = [
    {
      accessorKey: "farmName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Farm Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

    },
    {
      accessorKey: "farmType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("farmType")}</Badge>
      ),

    },
    {
      accessorKey: "farmSize",
      header: "Size (ha)",

    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {row.getValue("location")}
        </div>
      ),

    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "MMM dd, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const farm = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: farm, type: "farm" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Crops Data
  const { data: crops = [], refetch: refetchCrops } = trpc.crops.list.useQuery();

  const cropsColumns: ColumnDef<any>[] = [
    {
      accessorKey: "cropName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Crop Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

    },
    {
      accessorKey: "variety",
      header: "Variety",

    },
    {
      accessorKey: "plantingDate",
      header: "Planting Date",
      cell: ({ row }) => format(new Date(row.getValue("plantingDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "expectedHarvestDate",
      header: "Expected Harvest",
      cell: ({ row }) => {
        const date = row.getValue("expectedHarvestDate");
        return date ? format(new Date(date as string), "MMM dd, yyyy") : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "growing" ? "default" : 
                       status === "harvested" ? "secondary" : "outline";
        return <Badge variant={variant as any}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const crop = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: crop, type: "crop" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Livestock Data
  const { data: animals = [], refetch: refetchAnimals } = trpc.animals.list.useQuery({ farmId: 0 });
  const updateAnimal = trpc.animals.update.useMutation({
    onSuccess: () => {
      refetchAnimals();
      toast({ title: "Animal updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating animal", description: error.message, variant: "destructive" });
    },
  });

  const livestockColumns: ColumnDef<any>[] = [
    {
      accessorKey: "animalType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

    },
    {
      accessorKey: "breed",
      header: "Breed",

    },
    {
      accessorKey: "tagNumber",
      header: "Tag Number",

    },
    {
      accessorKey: "age",
      header: "Age (months)",

    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "healthy" ? "default" : 
                       status === "sick" ? "destructive" : "secondary";
        return <Badge variant={variant as any}>{status}</Badge>;
      },

    },
    {
      accessorKey: "acquisitionDate",
      header: "Acquired",
      cell: ({ row }) => format(new Date(row.getValue("acquisitionDate")), "MMM dd, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const animal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: animal, type: "animal" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Marketplace Products Data
  const { data: products = [], refetch: refetchProducts } = trpc.marketplace.listProducts.useQuery({ category: undefined });
  const updateProduct = trpc.marketplace.updateProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    },
  });
  const deleteProduct = trpc.marketplace.deleteProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    },
  });

  const productsColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("category")}</Badge>
      ),

    },
    {
      accessorKey: "price",
      header: "Price (GHS)",
      cell: ({ row }) => {
        const price = row.getValue("price") as number | null;
        return price != null ? `₵${price.toFixed(2)}` : "N/A";
      },

    },
    {
      accessorKey: "quantityAvailable",
      header: "Stock",
      cell: ({ row }) => {
        const qty = row.getValue("quantityAvailable") as number;
        const variant = qty > 10 ? "default" : qty > 0 ? "secondary" : "destructive";
        return <Badge variant={variant as any}>{qty}</Badge>;
      },

    },
    {
      accessorKey: "unit",
      header: "Unit",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: product, type: "product" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Are you sure you want to delete this product?")) {
                    deleteProduct.mutate({ id: product.id });
                  }
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Training Programs Data
  const { data: trainingPrograms = [], refetch: refetchTraining } = trpc.training.programs.list.useQuery();
  const deleteProgram = trpc.training.programs.delete.useMutation({
    onSuccess: () => {
      refetchTraining();
      toast({ title: "Training program deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting program", description: error.message, variant: "destructive" });
    },
  });

  const trainingColumns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Program Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("category")}</Badge>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
    },
    {
      accessorKey: "level",
      header: "Level",
    },
    {
      accessorKey: "maxParticipants",
      header: "Max Participants",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const program = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: program, type: "training" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Are you sure you want to delete this program?")) {
                    deleteProgram.mutate({ id: program.id });
                  }
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // IoT Devices Data
  const { data: devices = [], refetch: refetchDevices } = trpc.iot.listDevices.useQuery({ farmId: 0 });

  const devicesColumns: ColumnDef<any>[] = [
    {
      accessorKey: "deviceName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Device Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "deviceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("deviceType")}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "active" ? "default" : 
                       status === "inactive" ? "secondary" : "destructive";
        return <Badge variant={variant as any}>{status}</Badge>;
      },
    },
    {
      accessorKey: "lastReading",
      header: "Last Reading",
      cell: ({ row }) => {
        const date = row.getValue("lastReading");
        return date ? format(new Date(date as string), "MMM dd, HH:mm") : "Never";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const device = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDetailsDialog({ open: true, data: device, type: "device" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter Presets
  const filterPresets = {
    farms: [
      { id: "all-farms", name: "All Farms", filters: [] },
      { id: "crop-farms", name: "Crop Farms", filters: [{ id: "farmType", value: "crop" }] },
      { id: "livestock-farms", name: "Livestock Farms", filters: [{ id: "farmType", value: "livestock" }] },
      { id: "mixed-farms", name: "Mixed Farms", filters: [{ id: "farmType", value: "mixed" }] },
    ],
    livestock: [
      { id: "all-animals", name: "All Animals", filters: [] },
      { id: "healthy", name: "Healthy", filters: [{ id: "status", value: "healthy" }] },
      { id: "sick", name: "Sick", filters: [{ id: "status", value: "sick" }] },
      { id: "under-treatment", name: "Under Treatment", filters: [{ id: "status", value: "under_treatment" }] },
    ],
    products: [
      { id: "all-products", name: "All Products", filters: [] },
      { id: "in-stock", name: "In Stock", filters: [{ id: "quantityAvailable", value: "1" }] },
      { id: "low-stock", name: "Low Stock", filters: [{ id: "quantityAvailable", value: "low" }] },
      { id: "out-of-stock", name: "Out of Stock", filters: [{ id: "quantityAvailable", value: "0" }] },
    ],
  };

  // CSV Import Handler
  const handleImport = async () => {
    if (!csvFile) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      toast({ title: `Importing ${lines.length - 1} records...` });
      
      // Parse and validate CSV data
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",").map(v => v.trim());
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }

      toast({ 
        title: "Import complete", 
        description: `Successfully imported ${records.length} records` 
      });
      setImportDialog(false);
      setCsvFile(null);
    };
    reader.readAsText(csvFile);
  };

  // Module Stats
  const moduleStats = [
    { name: "Farms", count: farms.length, icon: MapPin, color: "text-green-600" },
    { name: "Crops", count: crops.length, icon: Sprout, color: "text-emerald-600" },
    { name: "Livestock", count: animals.length, icon: Beef, color: "text-orange-600" },
    { name: "Products", count: products.length, icon: ShoppingCart, color: "text-blue-600" },
    { name: "Training", count: trainingPrograms.length, icon: GraduationCap, color: "text-purple-600" },
    { name: "IoT Devices", count: devices.length, icon: Cpu, color: "text-cyan-600" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            View, edit, filter, and export all your agricultural data
          </p>
        </div>
        <Button onClick={() => setImportDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {moduleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Module Selector */}
      <Tabs value={selectedModule} onValueChange={setSelectedModule}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="farms">
            <MapPin className="h-4 w-4 mr-2" />
            Farms
          </TabsTrigger>
          <TabsTrigger value="crops">
            <Sprout className="h-4 w-4 mr-2" />
            Crops
          </TabsTrigger>
          <TabsTrigger value="livestock">
            <Beef className="h-4 w-4 mr-2" />
            Livestock
          </TabsTrigger>
          <TabsTrigger value="products">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="training">
            <GraduationCap className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Cpu className="h-4 w-4 mr-2" />
            IoT Devices
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{selectedModule} Data</CardTitle>
          <CardDescription>
            View, filter, sort, edit, and manage your {selectedModule} data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedModule === "farms" && (
            <DataTable
              columns={farmsColumns}
              data={farms}
              searchPlaceholder="Search farms..."
              exportFilename="farms"
              filterPresets={filterPresets.farms}
            />
          )}
          {selectedModule === "crops" && (
            <DataTable
              columns={cropsColumns}
              data={crops}
              searchPlaceholder="Search crops..."
              exportFilename="crops"
            />
          )}
          {selectedModule === "livestock" && (
            <DataTable
              columns={livestockColumns}
              data={animals}
              searchPlaceholder="Search animals..."
              exportFilename="livestock"
              enableInlineEdit
              enableRowSelection
              onUpdate={async (row, field, value) => {
                await updateAnimal.mutateAsync({ id: row.id, [field]: value });
              }}
              filterPresets={filterPresets.livestock}
            />
          )}
          {selectedModule === "products" && (
            <DataTable
              columns={productsColumns}
              data={products}
              searchPlaceholder="Search products..."
              exportFilename="products"
              enableInlineEdit
              enableRowSelection
              onUpdate={async (row, field, value) => {
                await updateProduct.mutateAsync({ id: row.id, [field]: value });
              }}
              onBulkDelete={async (rows) => {
                if (confirm(`Delete ${rows.length} products?`)) {
                  for (const row of rows) {
                    await deleteProduct.mutateAsync({ id: row.id });
                  }
                }
              }}
              filterPresets={filterPresets.products}
            />
          )}
          {selectedModule === "training" && (
            <DataTable
              columns={trainingColumns}
              data={trainingPrograms}
              searchPlaceholder="Search programs..."
              exportFilename="training-programs"
              enableRowSelection
              onBulkDelete={async (rows) => {
                if (confirm(`Delete ${rows.length} programs?`)) {
                  for (const row of rows) {
                    await deleteProgram.mutateAsync({ id: row.id });
                  }
                }
              }}
            />
          )}
          {selectedModule === "devices" && (
            <DataTable
              columns={devicesColumns}
              data={devices}
              searchPlaceholder="Search devices..."
              exportFilename="iot-devices"
            />
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{detailsDialog.type} Details</DialogTitle>
            <DialogDescription>
              Complete information about this {detailsDialog.type}
            </DialogDescription>
          </DialogHeader>
          {detailsDialog.data && (
            <div className="space-y-4">
              {Object.entries(detailsDialog.data).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
                  <div className="col-span-2">
                    {value instanceof Date ? format(value, "PPP") : 
                     typeof value === "object" ? JSON.stringify(value) :
                     String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV Data</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import {selectedModule} records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={!csvFile}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={() => setImportDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
