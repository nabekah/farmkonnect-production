import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedSearchBar } from '@/components/AdvancedSearchBar';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';

interface SearchFilters {
  cropType?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  location?: string;
  sortBy?: string;
}

export default function MarketplaceEnhanced() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch search results
  const { data: searchResults, isLoading } = trpc.advancedSearch.searchMarketplaceProducts.useQuery(
    {
      query: searchQuery,
      cropType: filters.cropType,
      priceRange: filters.priceRange,
      rating: filters.rating,
      location: filters.location,
      sortBy: (filters.sortBy as any) || 'relevance',
      limit: 20,
      offset: currentPage * 20,
    },
    { enabled: searchQuery.length > 0 }
  );

  const handleSearch = (query: string, newFilters: SearchFilters) => {
    setSearchQuery(query);
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const products = searchResults?.results || [];
  const total = searchResults?.total || 0;
  const hasMore = searchResults?.hasMore || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">Buy and sell farm products</p>
        </div>
        {user?.role === 'seller' && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <AdvancedSearchBar
        onSearch={handleSearch}
        searchType="products"
        placeholder="Search products by name, crop type, or location..."
      />

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {total > 0 ? `Showing ${products.length} of ${total} products` : 'No products found'}
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading products...</div>
        </div>
      ) : products.length > 0 ? (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }
          >
            {products.map((product: any) => (
              <Card
                key={product.id}
                className={viewMode === 'list' ? 'flex' : ''}
              >
                <CardHeader className={viewMode === 'list' ? 'w-24 flex-shrink-0' : ''}>
                  <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.seller}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">₦{product.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>📍 {product.location}</p>
                      <p>📦 {product.quantity}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        View Details
                      </Button>
                      <Button className="flex-1" size="sm">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search filters</p>
        </div>
      )}

      {/* Tabs for My Products and Orders */}
      {user && (
        <Tabs defaultValue="browse" className="mt-8">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            {user.role === 'seller' && (
              <TabsTrigger value="selling">My Products</TabsTrigger>
            )}
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            <p className="text-gray-600">Use the search above to browse products</p>
          </TabsContent>

          {user.role === 'seller' && (
            <TabsContent value="selling" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">You haven't listed any products yet</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">No orders yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
