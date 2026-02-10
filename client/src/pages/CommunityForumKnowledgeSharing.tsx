import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  BookOpen,
  Users,
  ThumbsUp,
  ThumbsDown,
  Search,
  Plus,
  Star,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  Share2,
} from "lucide-react";

/**
 * Community Forum & Knowledge Sharing Component
 * Peer-to-peer knowledge platform with expert moderation
 */
export const CommunityForumKnowledgeSharing: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "forum" | "articles" | "experts" | "search"
  >("forum");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock discussions
  const discussions = [
    {
      id: 1,
      title: "Best practices for organic tomato farming",
      category: "Crop Management",
      author: "John Farmer",
      authorRating: 4.8,
      content: "I've been growing organic tomatoes for 10 years and would like to share my experience...",
      replies: 23,
      views: 456,
      upvotes: 89,
      downvotes: 2,
      createdAt: "2026-02-08",
      tags: ["organic", "tomato", "farming"],
      isVerified: true,
    },
    {
      id: 2,
      title: "Dealing with pest infestation in maize",
      category: "Pest Management",
      author: "Jane Expert",
      authorRating: 4.9,
      content: "Has anyone successfully dealt with armyworms in maize? Looking for recommendations...",
      replies: 15,
      views: 234,
      upvotes: 56,
      downvotes: 1,
      createdAt: "2026-02-09",
      tags: ["pest", "maize", "armyworms"],
      isVerified: false,
    },
  ];

  // Mock articles
  const articles = [
    {
      id: 1,
      title: "Complete Guide to Organic Farming",
      category: "Organic Farming",
      author: "Dr. Kwame Mensah",
      views: 1234,
      rating: 4.8,
      readTime: 15,
      summary: "Learn the principles and practices of organic farming...",
    },
    {
      id: 2,
      title: "Pest Management Strategies",
      category: "Pest Management",
      author: "Ama Boateng",
      views: 892,
      rating: 4.6,
      readTime: 12,
      summary: "Effective strategies for managing common farm pests...",
    },
  ];

  // Mock experts
  const experts = [
    {
      id: 1,
      name: "Dr. Kwame Mensah",
      specialty: "Crop Pathology",
      experience: 15,
      rating: 4.8,
      repliesCount: 234,
      helpfulCount: 198,
      verified: true,
    },
    {
      id: 2,
      name: "Ama Boateng",
      specialty: "Organic Farming",
      experience: 10,
      rating: 4.7,
      repliesCount: 156,
      helpfulCount: 142,
      verified: true,
    },
  ];

  // Mock stats
  const stats = {
    totalMembers: 5234,
    activeMembers: 1245,
    totalDiscussions: 892,
    totalArticles: 234,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
            <p className="text-gray-600 mt-1">Share knowledge, ask questions, and learn from experienced farmers</p>
          </div>
          <MessageCircle className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-gray-600 text-sm">Total Members</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalMembers.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-gray-600 text-sm">Active Members</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeMembers.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-gray-600 text-sm">Discussions</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalDiscussions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-gray-600 text-sm">Articles</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalArticles}</p>
          </Card>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("forum")}
            variant={viewMode === "forum" ? "default" : "outline"}
            className={viewMode === "forum" ? "bg-blue-600 text-white" : ""}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Forum
          </Button>
          <Button
            onClick={() => setViewMode("articles")}
            variant={viewMode === "articles" ? "default" : "outline"}
            className={viewMode === "articles" ? "bg-blue-600 text-white" : ""}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </Button>
          <Button
            onClick={() => setViewMode("experts")}
            variant={viewMode === "experts" ? "default" : "outline"}
            className={viewMode === "experts" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Experts
          </Button>
          <Button
            onClick={() => setViewMode("search")}
            variant={viewMode === "search" ? "default" : "outline"}
            className={viewMode === "search" ? "bg-blue-600 text-white" : ""}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Forum View */}
        {viewMode === "forum" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedCategory(null)}
                  variant={selectedCategory === null ? "default" : "outline"}
                  className={selectedCategory === null ? "bg-blue-600 text-white" : ""}
                >
                  All Categories
                </Button>
                <Button
                  onClick={() => setSelectedCategory("Crop Management")}
                  variant={selectedCategory === "Crop Management" ? "default" : "outline"}
                  className={selectedCategory === "Crop Management" ? "bg-blue-600 text-white" : ""}
                >
                  Crop Management
                </Button>
                <Button
                  onClick={() => setSelectedCategory("Pest Management")}
                  variant={selectedCategory === "Pest Management" ? "default" : "outline"}
                  className={selectedCategory === "Pest Management" ? "bg-blue-600 text-white" : ""}
                >
                  Pest Management
                </Button>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Start Discussion
              </Button>
            </div>

            {discussions.map((discussion) => (
              <Card key={discussion.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-gray-900 text-lg">{discussion.title}</p>
                      {discussion.isVerified && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      by <span className="font-bold">{discussion.author}</span> in{" "}
                      <span className="font-bold">{discussion.category}</span>
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {discussion.category}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{discussion.content}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {discussion.replies} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {discussion.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {discussion.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {discussion.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      {discussion.downvotes}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Articles View */}
        {viewMode === "articles" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Write Article
              </Button>
            </div>

            {articles.map((article) => (
              <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{article.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      by <span className="font-bold">{article.author}</span>
                    </p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded">
                    {article.category}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{article.summary}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {article.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {article.readTime} min read
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{article.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Experts View */}
        {viewMode === "experts" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Community Experts</h2>

            {experts.map((expert) => (
              <Card key={expert.id} className="p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-lg">{expert.name}</p>
                      {expert.verified && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{expert.specialty}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">{expert.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600">{expert.experience} years exp.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Replies</p>
                    <p className="font-bold text-gray-900">{expert.repliesCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Helpful</p>
                    <p className="font-bold text-green-600">{expert.helpfulCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Helpful Rate</p>
                    <p className="font-bold text-gray-900">
                      {Math.round((expert.helpfulCount / expert.repliesCount) * 100)}%
                    </p>
                  </div>
                  <div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Ask Question
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Search View */}
        {viewMode === "search" && (
          <div className="space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions, articles, and experts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Discussions</h3>
                <div className="space-y-3">
                  {discussions.slice(0, 2).map((discussion) => (
                    <Card key={discussion.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2">
                        {discussion.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">{discussion.replies} replies</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Articles</h3>
                <div className="space-y-3">
                  {articles.slice(0, 2).map((article) => (
                    <Card key={article.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">{article.views} views</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Experts</h3>
                <div className="space-y-3">
                  {experts.map((expert) => (
                    <Card key={expert.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <p className="font-bold text-gray-900 text-sm">{expert.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{expert.specialty}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-gray-900">{expert.rating}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityForumKnowledgeSharing;
