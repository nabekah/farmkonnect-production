import React, { useState } from 'react';
import { MessageCircle, ThumbsUp, Eye, TrendingUp, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedSearchBar } from '@/components/AdvancedSearchBar';
import { trpc } from '@/lib/trpc';

interface SearchFilters {
  category?: string[];
  tags?: string[];
  dateRange?: { from?: Date; to?: Date };
  sortBy?: string;
}

export default function CommunityForumEnhanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch forum posts
  const { data: forumResults, isLoading } = trpc.advancedSearch.searchForumPosts.useQuery(
    {
      query: searchQuery,
      category: filters.category,
      tags: filters.tags,
      dateRange: filters.dateRange,
      sortBy: (filters.sortBy as any) || 'trending',
      limit: 15,
      offset: currentPage * 15,
    },
    { enabled: true }
  );

  const handleSearch = (query: string, newFilters: SearchFilters) => {
    setSearchQuery(query);
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const posts = forumResults?.results || [];
  const total = forumResults?.total || 0;
  const hasMore = forumResults?.hasMore || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
          <p className="text-gray-600 mt-1">Share knowledge and learn from other farmers</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Discussion
        </Button>
      </div>

      {/* Search Bar */}
      <AdvancedSearchBar
        onSearch={handleSearch}
        searchType="forum"
        placeholder="Search discussions by topic, category, or tags..."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <p className="text-sm text-gray-600">Total Discussions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1,250+</div>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">5.2K</div>
              <p className="text-sm text-gray-600">Total Replies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forum Posts */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading discussions...</div>
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Title and Category */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                      </div>
                      {post.trending && (
                        <Badge className="bg-red-100 text-red-800 flex gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </Badge>
                      )}
                    </div>

                    {/* Category and Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{post.category}</Badge>
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Author and Stats */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {post.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{post.author}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-xs text-gray-600">{post.authorRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.replies}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Discussion
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-4 h-4" />
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
                Load More Discussions
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No discussions found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search filters or start a new discussion</p>
        </div>
      )}

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Crop Cultivation', posts: 342 },
              { name: 'Livestock Management', posts: 218 },
              { name: 'Pest & Disease', posts: 156 },
              { name: 'Market & Pricing', posts: 89 },
              { name: 'Technology', posts: 67 },
              { name: 'General Discussion', posts: 45 },
            ].map((category) => (
              <button
                key={category.name}
                className="p-4 border rounded-lg hover:bg-gray-50 transition text-left"
              >
                <p className="font-medium text-gray-900">{category.name}</p>
                <p className="text-sm text-gray-600">{category.posts} posts</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'John Farmer', rating: 4.8, posts: 156 },
              { name: 'Jane Expert', rating: 4.9, posts: 143 },
              { name: 'Mark Breeder', rating: 4.7, posts: 128 },
              { name: 'Sarah Innovator', rating: 4.6, posts: 112 },
              { name: 'David Mentor', rating: 4.5, posts: 98 },
            ].map((contributor, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contributor.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-xs text-gray-600">{contributor.rating}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">{contributor.posts} posts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
