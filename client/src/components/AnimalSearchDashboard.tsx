import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Download, Save, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AnimalSearchDashboardProps {
  farmId: number;
  animals: any[];
}

export function AnimalSearchDashboard({ farmId, animals }: AnimalSearchDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    breed: "",
    status: "",
    gender: "",
  });
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = trpc.animalSearchFilters.getFilterOptions.useQuery({ farmId });

  // Fetch saved presets
  const { data: savedPresets = [] } = trpc.animalSearchFilters.getSavedPresets.useQuery({ farmId });

  // Fetch search suggestions
  const { data: suggestions } = trpc.animalSearchFilters.getSearchSuggestions.useQuery(
    { farmId, query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Mutations
  const savePreset = trpc.animalSearchFilters.saveFilterPreset.useMutation({
    onSuccess: () => {
      setPresetName("");
      setShowSavePreset(false);
    },
  });

  const deletePreset = trpc.animalSearchFilters.deletePreset.useMutation();

  const exportResults = trpc.animalSearchFilters.exportSearchResults.useMutation();

  // Filter animals
  let filteredAnimals = animals;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredAnimals = filteredAnimals.filter(
      (a) =>
        (a.uniqueTagId?.toLowerCase().includes(query)) ||
        (a.breed?.toLowerCase().includes(query))
    );
  }

  if (selectedFilters.breed) {
    filteredAnimals = filteredAnimals.filter((a) => a.breed === selectedFilters.breed);
  }

  if (selectedFilters.status) {
    filteredAnimals = filteredAnimals.filter((a) => a.status === selectedFilters.status);
  }

  if (selectedFilters.gender) {
    filteredAnimals = filteredAnimals.filter((a) => a.gender === selectedFilters.gender);
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedAnimals(filteredAnimals.map((a) => a.id));
    } else {
      setSelectedAnimals([]);
    }
  };

  const handleSelectAnimal = (animalId: number, checked: boolean) => {
    if (checked) {
      setSelectedAnimals([...selectedAnimals, animalId]);
    } else {
      setSelectedAnimals(selectedAnimals.filter((id) => id !== animalId));
    }
  };

  const handleSavePreset = async () => {
    if (!presetName) {
      alert("Please enter preset name");
      return;
    }

    await savePreset.mutateAsync({
      farmId,
      presetName,
      filters: selectedFilters,
      description: `Search for ${selectedFilters.breed || "any breed"} ${selectedFilters.status || "any status"}`,
    });
  };

  const handleApplyPreset = (preset: any) => {
    setSelectedFilters(preset.filters);
  };

  const handleExport = async () => {
    await exportResults.mutateAsync({
      farmId,
      filters: selectedFilters,
      format: "csv",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Animals</CardTitle>
          <CardDescription>Find animals by tag ID, breed, or other criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag ID, breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Suggestions */}
          {suggestions && searchQuery && (
            <div className="space-y-2">
              {suggestions.tagIds.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tag IDs</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.tagIds.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setSearchQuery(id)}
                      >
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.breeds.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Breeds</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.breeds.map((breed) => (
                      <Badge
                        key={breed}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setSelectedFilters({ ...selectedFilters, breed })}
                      >
                        {breed}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed-filter">Breed</Label>
                <Select value={selectedFilters.breed} onValueChange={(value) => setSelectedFilters({ ...selectedFilters, breed: value })}>
                  <SelectTrigger id="breed-filter">
                    <SelectValue placeholder="All breeds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All breeds</SelectItem>
                    {filterOptions?.breeds.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={selectedFilters.status} onValueChange={(value) => setSelectedFilters({ ...selectedFilters, status: value })}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {filterOptions?.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender-filter">Gender</Label>
                <Select value={selectedFilters.gender} onValueChange={(value) => setSelectedFilters({ ...selectedFilters, gender: value })}>
                  <SelectTrigger id="gender-filter">
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All genders</SelectItem>
                    {filterOptions?.genders.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedFilters({ breed: "", status: "", gender: "" })}
                className="flex-1"
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSavePreset(true)}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Preset
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset: any) => (
                <div key={preset.id} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    {preset.presetName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePreset.mutate({ presetId: preset.id })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Preset Dialog */}
      {showSavePreset && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-3">
            <Input
              placeholder="Preset name (e.g., 'Active Holsteins')"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSavePreset(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePreset}
                disabled={savePreset.isPending}
                className="flex-1"
              >
                {savePreset.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preset"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {filteredAnimals.length} of {animals.length} animals
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredAnimals.length === 0 || exportResults.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAnimals.length === 0 ? (
            <Alert>
              <AlertDescription>No animals found matching your criteria</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  id="select-all-results"
                />
                <Label htmlFor="select-all-results" className="flex-1 cursor-pointer">
                  Select All ({filteredAnimals.length})
                </Label>
                <Badge variant="secondary">{selectedAnimals.length} selected</Badge>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-2 text-left font-medium">Tag ID</th>
                      <th className="px-4 py-2 text-left font-medium">Breed</th>
                      <th className="px-4 py-2 text-left font-medium">Gender</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnimals.map((animal) => (
                      <tr key={animal.id} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedAnimals.includes(animal.id)}
                            onCheckedChange={(checked) => handleSelectAnimal(animal.id, checked as boolean)}
                          />
                        </td>
                        <td className="px-4 py-2 font-medium">{animal.uniqueTagId || `Animal #${animal.id}`}</td>
                        <td className="px-4 py-2">{animal.breed}</td>
                        <td className="px-4 py-2 capitalize">{animal.gender}</td>
                        <td className="px-4 py-2">
                          <Badge variant={animal.status === "active" ? "default" : "secondary"}>
                            {animal.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {animal.createdAt ? new Date(animal.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
