import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Tag, Filter } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  name: string;
  tags: string[];
  activityType?: string;
  location?: string;
  date?: string;
}

interface BulkPhotoTaggingProps {
  photos: Photo[];
  onTagsApplied?: (photoIds: string[], tags: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BulkPhotoTagging({
  photos,
  onTagsApplied,
  isOpen,
  onClose,
}: BulkPhotoTaggingProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [selectAll, setSelectAll] = useState(false);

  // Get unique activity types and locations for filtering
  const activityTypes = Array.from(new Set(photos.map((p) => p.activityType).filter(Boolean)));
  const locations = Array.from(new Set(photos.map((p) => p.location).filter(Boolean)));

  // Filter photos based on criteria
  const filteredPhotos = photos.filter((p) => {
    if (filterType && p.activityType !== filterType) return false;
    if (filterLocation && p.location !== filterLocation) return false;
    return true;
  });

  const handleSelectPhoto = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
    setSelectAll(newSelected.size === filteredPhotos.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPhotos(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredPhotos.map((p) => p.id));
      setSelectedPhotos(allIds);
      setSelectAll(true);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleApplyTags = () => {
    if (selectedPhotos.size > 0 && newTags.length > 0) {
      onTagsApplied?.(Array.from(selectedPhotos), newTags);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedPhotos(new Set());
    setNewTags([]);
    setTagInput('');
    setFilterType('');
    setFilterLocation('');
    setSelectAll(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Bulk Photo Tagging
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {activityTypes.map((type) => (
                    <SelectItem key={type} value={type || ''}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location || ''}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags to Apply */}
          <div className="space-y-3">
            <h3 className="font-semibold">Tags to Apply</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} variant="outline">
                Add Tag
              </Button>
            </div>
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Photo Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Select Photos ({selectedPhotos.size}/{filteredPhotos.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleSelectPhoto(photo.id)}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className={`w-full h-24 object-cover rounded-lg transition-opacity ${
                      selectedPhotos.has(photo.id) ? 'opacity-100 ring-2 ring-blue-500' : 'opacity-75 group-hover:opacity-100'
                    }`}
                  />
                  <Checkbox
                    checked={selectedPhotos.has(photo.id)}
                    onChange={() => handleSelectPhoto(photo.id)}
                    className="absolute top-2 left-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>

            {filteredPhotos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No photos match the selected filters
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyTags}
              disabled={selectedPhotos.size === 0 || newTags.length === 0}
            >
              Apply {newTags.length} Tag{newTags.length !== 1 ? 's' : ''} to {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
