import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ActivityPhoto {
  id: number;
  activityId: number;
  url: string;
  filename: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  notes: string;
  size: number;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  type: string;
  date: number;
  status: string;
  photos: ActivityPhoto[];
}

export function ActivityPhotoGallery() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const itemsPerPage = 12;

  // Mock data for demonstration
  const isLoading = false;

  useEffect(() => {
    // In production, fetch from tRPC
    // For now, use empty array
    setActivities([]);
  }, []);

  // Get all photos from activities
  const allPhotos = activities.flatMap((activity) =>
    activity.photos.map((photo) => ({ ...photo, activityTitle: activity.title }))
  );

  // Filter photos
  const filteredPhotos = allPhotos.filter((photo) => {
    const matchesSearch =
      photo.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      activities.find((a) => a.id === photo.activityId)?.type === filterType;

    return matchesSearch && matchesType;
  });

  // Sort photos
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'date') {
      return b.timestamp - a.timestamp;
    } else {
      return a.filename.localeCompare(b.filename);
    }
  });

  // Paginate photos
  const paginatedPhotos = sortedPhotos.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const totalPages = Math.ceil(sortedPhotos.length / itemsPerPage);

  const handleDeletePhoto = () => {
    if (selectedPhoto) {
      setActivities((prev) =>
        prev.map((activity) => ({
          ...activity,
          photos: activity.photos.filter((p) => p.id !== selectedPhoto?.id),
        }))
      );
      setIsDialogOpen(false);
      setSelectedPhoto(null);
    }
  };

  const handleDownloadPhoto = (photo: ActivityPhoto) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const activityTypes = Array.from(
    new Set(activities.map((a) => a.type))
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Photo Gallery</h1>
          <p className="text-muted-foreground">
            View and manage photos from field worker activities with GPS coordinates
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Total Photos</p>
                <p className="text-3xl font-bold">{allPhotos.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Total Activities</p>
                <p className="text-3xl font-bold">{activities.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Total Size</p>
                <p className="text-3xl font-bold">
                  {formatSize(allPhotos.reduce((sum, p) => sum + p.size, 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Search Photos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename or notes..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Activity Type Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Activity Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="all">All Types</option>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="date">Date (Newest)</option>
                  <option value="name">Filename</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading photos...</p>
          </div>
        ) : paginatedPhotos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No photos found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {paginatedPhotos.map((photo) => (
                <Card
                  key={photo.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <p className="font-semibold text-sm mb-2 truncate">{photo.filename}</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(photo.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Size: {formatSize(photo.size)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages} ({sortedPhotos.length} photos)
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Photo Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto?.filename}</DialogTitle>
              <DialogDescription>
                {selectedPhoto && formatDate(selectedPhoto.timestamp)}
              </DialogDescription>
            </DialogHeader>

            {selectedPhoto && (
              <div className="space-y-4">
                {/* Photo */}
                <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.filename}
                    className="w-full h-auto"
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-semibold">
                      {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">File Size</p>
                    <p className="font-semibold">{formatSize(selectedPhoto.size)}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedPhoto.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedPhoto.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPhoto(selectedPhoto)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeletePhoto}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
