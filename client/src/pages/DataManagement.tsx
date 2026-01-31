import { useState } from "react";
import { trpc } from "../lib/trpc";
import { DataTable } from "../components/DataTable";
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
  Database,
  Filter,
  Save,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
  const event = new CustomEvent("toast", { detail: props });
  window.dispatchEvent(event);
};

const modules = [
  { id: "farms", name: "Farms", icon: MapPin, color: "text-green-600" },
  { id: "crops", name: "Crops", icon: Sprout, color: "text-emerald-600" },
  { id: "livestock", name: "Livestock", icon: Beef, color: "text-orange-600" },
  { id: "products", name: "Products", icon: ShoppingCart, color: "text-blue-600" },
  { id: "training", name: "Training", icon: GraduationCap, color: "text-purple-600" },
  { id: "iot", name: "IoT Devices", icon: Cpu, color: "text-cyan-600" },
];

export default function DataManagement() {
  const [selectedModule, setSelectedModule] = useState("farms");
  const [detailsDialog, setDetailsDialog] = useState<{open: boolean, data: any, type: string}>({
    open: false,
    data: null,
    type: "",
  });
  const [importDialog, setImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [savedFilters, setSavedFilters] = useState<Array<{id: string, name: string, module: string, filters: any}>>([]);
  const [filterName, setFilterName] = useState("");

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
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "farmType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("farmType")}</Badge>
      ),
      meta: {
        filterType: "select",
        filterOptions: ["Crop", "Livestock", "Mixed", "Dairy", "Poultry"],
      },
    },
    {
      accessorKey: "farmSize",
      header: "Size (ha)",
      meta: {
        filterType: "number",
      },
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
      meta: {
        filterType: "text",
      },
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: farm, type: "farm" })}>
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
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "variety",
      header: "Variety",
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "plantingDate",
      header: "Planting Date",
      cell: ({ row }) => {
        const date = row.getValue("plantingDate");
        return date ? format(new Date(date as string), "MMM dd, yyyy") : "N/A";
      },
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: crop, type: "crop" })}>
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
  const { data: livestock = [], refetch: refetchLivestock } = trpc.animals.list.useQuery({ farmId: farms[0]?.id || 0 }, {
    enabled: farms.length > 0,
  });
  const updateAnimal = trpc.animals.update.useMutation({
    onSuccess: () => {
      refetchLivestock();
      toast({ title: "Animal updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating animal", description: error.message, variant: "destructive" });
    },
  });


  const livestockColumns: ColumnDef<any>[] = [
    {
      accessorKey: "tagNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tag Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "animalType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("animalType")}</Badge>
      ),
      meta: {
        filterType: "select",
        filterOptions: ["Cattle", "Goat", "Sheep", "Pig", "Chicken", "Duck"],
      },
    },
    {
      accessorKey: "breed",
      header: "Breed",
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "healthy" ? "default" : status === "sick" ? "destructive" : "secondary";
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: {
        filterType: "select",
        filterOptions: ["healthy", "sick", "pregnant", "sold", "deceased"],
      },
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => {
        const date = row.getValue("dateOfBirth");
        return date ? format(new Date(date as string), "MMM dd, yyyy") : "N/A";
      },
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: animal, type: "animal" })}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Products Data
  const { data: products = [], refetch: refetchProducts } = trpc.marketplace.listProducts.useQuery({});
  const updateProduct = trpc.marketplace.updateProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating product", description: error.message, variant: "destructive" });
    },
  });
  const deleteProducts = trpc.marketplace.deleteProduct.useMutation({
    onSuccess: () => {
      refetchProducts();
      toast({ title: "Products deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting products", description: error.message, variant: "destructive" });
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
      meta: {
        filterType: "text",
        editable: true,
        validation: (value: any) => {
          if (!value || value.trim() === "") return "Product name is required";
          return null;
        },
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("category")}</Badge>
      ),
      meta: {
        filterType: "select",
        filterOptions: ["Crops", "Livestock", "Equipment", "Seeds", "Fertilizer"],
        editable: true,
        validation: (value: any) => {
          if (!value) return "Category is required";
          return null;
        },
      },
    },
    {
      accessorKey: "price",
      header: "Price (GHS)",
      cell: ({ row }) => {
        const price = row.getValue("price");
        // More robust null/undefined/type checking
        if (price == null || price === "" || typeof price !== "number" || isNaN(price)) {
          return "N/A";
        }
        return `₵${Number(price).toFixed(2)}`;
      },
      meta: {
        filterType: "number",
        editable: true,
        validation: (value: any) => {
          const num = parseFloat(value);
          if (isNaN(num)) return "Price must be a number";
          if (num <= 0) return "Price must be greater than 0";
          return null;
        },
      },
    },
    {
      accessorKey: "quantityAvailable",
      header: "Quantity",
      meta: {
        filterType: "number",
        editable: true,
        validation: (value: any) => {
          const num = parseInt(value);
          if (isNaN(num)) return "Quantity must be a number";
          if (num < 0) return "Quantity cannot be negative";
          return null;
        },
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "available" ? "default" : "secondary";
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: {
        filterType: "select",
        filterOptions: ["available", "out_of_stock", "discontinued"],
      },
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: product, type: "product" })}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Training Data
  const { data: training = [], refetch: refetchTraining } = trpc.training.programs.list.useQuery();

  const trainingColumns: ColumnDef<any>[] = [
    {
      accessorKey: "programName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Program Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("category")}</Badge>
      ),
      meta: {
        filterType: "select",
        filterOptions: ["Crop Management", "Livestock Care", "Business Skills", "Technology", "Marketing"],
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("startDate");
        return date ? format(new Date(date as string), "MMM dd, yyyy") : "N/A";
      },
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: program, type: "training" })}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // IoT Data
  const { data: iotDevices = [], refetch: refetchIoT } = trpc.iot.listDevices.useQuery({ farmId: farms[0]?.id || 0 }, { enabled: farms.length > 0 });

  const iotColumns: ColumnDef<any>[] = [
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
      meta: {
        filterType: "text",
      },
    },
    {
      accessorKey: "deviceType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("deviceType")}</Badge>
      ),
      meta: {
        filterType: "select",
        filterOptions: ["Soil Moisture Sensor", "Temperature Sensor", "Humidity Sensor", "Weather Station", "Camera"],
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variant = status === "active" ? "default" : status === "inactive" ? "secondary" : "destructive";
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: {
        filterType: "select",
        filterOptions: ["active", "inactive", "error"],
      },
    },
    {
      accessorKey: "lastReading",
      header: "Last Reading",
      cell: ({ row }) => {
        const date = row.getValue("lastReading");
        return date ? format(new Date(date as string), "MMM dd, HH:mm") : "N/A";
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
              <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, data: device, type: "iot" })}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const getModuleData = () => {
    switch (selectedModule) {
      case "farms": return { data: farms, columns: farmsColumns };
      case "crops": return { data: crops, columns: cropsColumns };
      case "livestock": return { data: livestock, columns: livestockColumns };
      case "products": return { data: products, columns: productsColumns };
      case "training": return { data: training, columns: trainingColumns };
      case "iot": return { data: iotDevices, columns: iotColumns };
      default: return { data: [], columns: [] };
    }
  };

  const handleSaveFilter = (filters: any) => {
    if (!filterName.trim()) {
      toast({ title: "Please enter a filter name", variant: "destructive" });
      return;
    }
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      module: selectedModule,
      filters,
    };
    setSavedFilters([...savedFilters, newFilter]);
    setFilterName("");
    toast({ title: "Filter saved successfully" });
  };

  const moduleData = getModuleData();
  const currentModuleSavedFilters = savedFilters.filter(f => f.module === selectedModule);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Data Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View, filter, sort, edit, and manage all your agricultural data
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Icon-based Navigation Sidebar */}
        <div className="w-20 flex-shrink-0">
          <Card className="p-2">
            <TooltipProvider>
              <div className="flex flex-col gap-2">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const isActive = selectedModule === module.id;
                  return (
                    <Tooltip key={module.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="icon"
                          className={`h-14 w-14 transition-all duration-200 ${
                            isActive ? "" : "hover:scale-110"
                          } ${!isActive && module.color}`}
                          onClick={() => setSelectedModule(module.id)}
                        >
                          <Icon className="h-6 w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{module.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {modules.find(m => m.id === selectedModule)?.name} Data
                    <Badge variant="secondary">{moduleData.data.length} records</Badge>
                  </CardTitle>
                  <CardDescription>
                    View, filter, sort, edit, and manage your {selectedModule} data
                  </CardDescription>
                </div>
                
                {/* Saved Filters Dropdown */}
                {currentModuleSavedFilters.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Saved Filters ({currentModuleSavedFilters.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {currentModuleSavedFilters.map((filter) => (
                        <DropdownMenuItem key={filter.id}>
                          <Filter className="mr-2 h-4 w-4" />
                          {filter.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={moduleData.columns}
                data={moduleData.data}
                searchPlaceholder={`Search ${selectedModule}...`}
                exportFilename={selectedModule}
                enableInlineEdit={selectedModule === "products"}
                enableRowSelection={selectedModule === "products"}
                onUpdate={async (row: any, field: string, value: any) => {
                  if (selectedModule === "products") {
                    await updateProduct.mutateAsync({ id: row.id, [field]: value });
                  } else if (selectedModule === "livestock") {
                    await updateAnimal.mutateAsync({ id: row.id, [field]: value });
                  }
                }}
                onBulkDelete={async (rows: any[]) => {
                  const ids = rows.map(r => r.id);
                  if (selectedModule === "products") {
                    for (const id of ids) { await deleteProducts.mutateAsync({ id }); }
                  }
                }}
                onSaveFilterPreset={(preset) => handleSaveFilter(preset.filters)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsDialog.type.charAt(0).toUpperCase() + detailsDialog.type.slice(1)} Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this {detailsDialog.type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {detailsDialog.data && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(detailsDialog.data).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <p className="text-sm">
                      {value instanceof Date
                        ? format(value, "MMM dd, yyyy")
                        : typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
