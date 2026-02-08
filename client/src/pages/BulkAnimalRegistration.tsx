import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Plus, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SerialTag {
  id: string;
  tagId: string;
}

export function BulkAnimalRegistration() {
  const [farmId] = useState(1); // TODO: Get from user context
  const [typeId, setTypeId] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [femaleCount, setFemaleCount] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [serialTags, setSerialTags] = useState<SerialTag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [useAutoGenerate, setUseAutoGenerate] = useState(false);
  const [autoGenPrefix, setAutoGenPrefix] = useState('TAG-');
  const [autoGenCount, setAutoGenCount] = useState('10');
  const [autoGenStart, setAutoGenStart] = useState('1');
  const [isRegistering, setIsRegistering] = useState(false);

  const { mutate: registerBulk } = trpc.animalBulkRegistration.registerBulk.useMutation({
    onSuccess: (data) => {
      toast.success('Animals Registered', {
        description: data.message,
      });
      // Reset form
      setSerialTags([]);
      setTagInput('');
      setBreed('');
      setTypeId('');
      setBirthDate('');
    },
    onError: (error) => {
      toast.error('Registration Failed', {
        description: error.message,
      });
    },
  });

  const { mutate: validateTags } = trpc.animalBulkRegistration.validateSerialTagIds.useMutation();
  const { data: generatedTags } = trpc.animalBulkRegistration.generateSerialTagIds.useQuery(
    {
      count: parseInt(autoGenCount) || 10,
      prefix: autoGenPrefix,
      startingNumber: parseInt(autoGenStart) || 1,
    },
    { enabled: useAutoGenerate }
  );

  const handleAddTag = () => {
    if (!tagInput.trim()) {
      toast.error('Please enter a serial tag ID');
      return;
    }

    const newTag: SerialTag = {
      id: `${Date.now()}-${Math.random()}`,
      tagId: tagInput.trim(),
    };

    setSerialTags([...serialTags, newTag]);
    setTagInput('');
  };

  const handleRemoveTag = (id: string) => {
    setSerialTags(serialTags.filter((tag) => tag.id !== id));
  };

  const handleAddGeneratedTags = () => {
    if (!generatedTags) return;

    const newTags = generatedTags.tagIds.map((tagId) => ({
      id: `${Date.now()}-${Math.random()}`,
      tagId,
    }));

    setSerialTags([...serialTags, ...newTags]);
    toast.success(`Added ${newTags.length} generated tags`);
  };

  const handlePasteTags = () => {
    navigator.clipboard.readText().then((text) => {
      const tags = text
        .split('\n')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const newTags = tags.map((tagId) => ({
        id: `${Date.now()}-${Math.random()}`,
        tagId,
      }));

      setSerialTags([...serialTags, ...newTags]);
      toast.success(`Pasted ${newTags.length} tags`);
    });
  };

  const handleRegister = async () => {
    if (!typeId || !breed || serialTags.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsRegistering(true);

    registerBulk({
      farmId,
      typeId: parseInt(typeId),
      breed,
      gender: femaleCount ? undefined : gender,
      femaleCount: femaleCount ? parseInt(femaleCount) : undefined,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      serialTagIds: serialTags.map((tag) => tag.tagId),
    });

    setIsRegistering(false);
  };

  const handleDownloadTemplate = () => {
    const template = `Serial Tag ID
TAG-00001
TAG-00002
TAG-00003
TAG-00004
TAG-00005`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'animal-tags-template.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Template downloaded');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Animal Registration</h1>
        <p className="text-muted-foreground">Register multiple animals of the same breed with serial tag IDs</p>
      </div>

      {/* Animal Details */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Animal Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Animal Type *</label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select animal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Cattle</SelectItem>
                <SelectItem value="2">Sheep</SelectItem>
                <SelectItem value="3">Goat</SelectItem>
                <SelectItem value="4">Pig</SelectItem>
                <SelectItem value="5">Poultry</SelectItem>
                <SelectItem value="6">Horse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Breed *</label>
            <Input
              placeholder="e.g., Holstein, Angus, Jersey"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={gender} onValueChange={(value: any) => setGender(value)} disabled={!!femaleCount}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Or specify female count below</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Females (Optional)</label>
            <Input
              type="number"
              min="0"
              placeholder="e.g., 5 (rest will be males)"
              value={femaleCount}
              onChange={(e) => setFemaleCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">If specified, first N animals will be female, rest male</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Birth Date (Optional)</label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Serial Tag IDs */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Serial Tag IDs</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={handlePasteTags}>
              <Upload className="h-4 w-4 mr-2" />
              Paste
            </Button>
          </div>
        </div>

        {/* Auto-generate section */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={useAutoGenerate}
              onCheckedChange={(checked) => setUseAutoGenerate(checked as boolean)}
            />
            <label className="text-sm font-medium">Auto-generate serial tag IDs</label>
          </div>

          {useAutoGenerate && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm">Prefix</label>
                <Input
                  value={autoGenPrefix}
                  onChange={(e) => setAutoGenPrefix(e.target.value)}
                  placeholder="e.g., TAG-"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Count</label>
                <Input
                  type="number"
                  value={autoGenCount}
                  onChange={(e) => setAutoGenCount(e.target.value)}
                  min="1"
                  max="1000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Starting Number</label>
                <Input
                  type="number"
                  value={autoGenStart}
                  onChange={(e) => setAutoGenStart(e.target.value)}
                  min="1"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddGeneratedTags} className="w-full">
                  Add Generated Tags
                </Button>
              </div>
            </div>
          )}

          {generatedTags && useAutoGenerate && (
            <div className="text-sm text-muted-foreground">
              Will generate: {generatedTags.tagIds.slice(0, 3).join(', ')}
              {generatedTags.tagIds.length > 3 && ` ... and ${generatedTags.tagIds.length - 3} more`}
            </div>
          )}
        </div>

        {/* Manual entry section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or enter manually</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter serial tag ID and press Add"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
              }}
            />
            <Button onClick={handleAddTag}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Tags list */}
        {serialTags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {serialTags.length} tag(s) added
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {serialTags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{tag.tagId}</span>
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Summary */}
      {serialTags.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Registration Summary</p>
              <p className="text-sm text-blue-800">
                You are about to register <strong>{serialTags.length} animals</strong> of breed{' '}
                <strong>{breed || 'unknown'}</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRegister}
          disabled={!typeId || !breed || serialTags.length === 0 || isRegistering}
          size="lg"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isRegistering ? 'Registering...' : 'Register Animals'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSerialTags([]);
            setTagInput('');
            setBreed('');
            setTypeId('');
            setBirthDate('');
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
