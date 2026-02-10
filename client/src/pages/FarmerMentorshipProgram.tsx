import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Star,
  BookOpen,
  TrendingUp,
  MessageSquare,
  Calendar,
  Award,
  Share2,
  BarChart3,
  Target,
  CheckCircle,
  Clock,
} from "lucide-react";

/**
 * Farmer Mentorship Program Component
 * Peer-to-peer mentorship with progress tracking and knowledge sharing
 */
export const FarmerMentorshipProgram: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "mentors" | "myMentorships" | "progress" | "knowledge" | "community" | "feedback"
  >("mentors");

  // Mock data
  const mentors = [
    {
      id: 1,
      name: "Kwame Osei",
      specialty: "Maize Farming",
      region: "Ashanti",
      experience: 20,
      rating: 4.8,
      students: 12,
      bio: "Expert in maize production with 20 years of experience",
    },
    {
      id: 2,
      name: "Ama Asante",
      specialty: "Vegetable Farming",
      region: "Greater Accra",
      experience: 15,
      rating: 4.9,
      students: 8,
      bio: "Specialist in organic vegetable production",
    },
    {
      id: 3,
      name: "Kofi Mensah",
      specialty: "Cocoa Farming",
      region: "Western",
      experience: 25,
      rating: 4.7,
      students: 15,
      bio: "Cocoa production expert with sustainable practices",
    },
  ];

  const myMentorships = [
    {
      id: 1,
      mentorName: "Kwame Osei",
      specialty: "Maize Farming",
      status: "active",
      progress: 65,
      sessionsCompleted: 8,
      nextSession: "2026-02-15",
    },
    {
      id: 2,
      mentorName: "Ama Asante",
      specialty: "Vegetable Farming",
      status: "active",
      progress: 45,
      sessionsCompleted: 5,
      nextSession: "2026-02-18",
    },
  ];

  const progressData = {
    overallProgress: 65,
    goals: [
      { goal: "Learn optimal maize planting techniques", status: "completed" },
      { goal: "Implement crop rotation system", status: "in_progress", progress: 75 },
      { goal: "Optimize fertilizer application", status: "pending" },
    ],
    skillsAcquired: ["Soil preparation", "Pest management", "Irrigation techniques"],
  };

  const articles = [
    {
      id: 1,
      title: "Best Practices for Maize Production",
      author: "Kwame Osei",
      views: 1250,
      likes: 145,
      readTime: 8,
    },
    {
      id: 2,
      title: "Organic Vegetable Farming Guide",
      author: "Ama Asante",
      views: 980,
      likes: 120,
      readTime: 10,
    },
    {
      id: 3,
      title: "Sustainable Cocoa Production",
      author: "Kofi Mensah",
      views: 1450,
      likes: 180,
      readTime: 12,
    },
  ];

  const communityStats = {
    totalMentors: 45,
    totalMentees: 320,
    activeMentorships: 280,
    knowledgeArticles: 156,
  };

  const feedback = [
    {
      date: "2025-08-20",
      mentor: "Kwame Osei",
      rating: 5,
      comment: "Excellent progress on soil preparation techniques",
    },
    {
      date: "2025-09-10",
      mentor: "Kwame Osei",
      rating: 4,
      comment: "Good understanding of crop rotation",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farmer Mentorship Program</h1>
            <p className="text-gray-600 mt-1">Learn from experienced farmers and grow your skills</p>
          </div>
          <Users className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("mentors")}
            variant={viewMode === "mentors" ? "default" : "outline"}
            className={viewMode === "mentors" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Find Mentors
          </Button>
          <Button
            onClick={() => setViewMode("myMentorships")}
            variant={viewMode === "myMentorships" ? "default" : "outline"}
            className={viewMode === "myMentorships" ? "bg-blue-600 text-white" : ""}
          >
            <Award className="w-4 h-4 mr-2" />
            My Mentorships
          </Button>
          <Button
            onClick={() => setViewMode("progress")}
            variant={viewMode === "progress" ? "default" : "outline"}
            className={viewMode === "progress" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </Button>
          <Button
            onClick={() => setViewMode("knowledge")}
            variant={viewMode === "knowledge" ? "default" : "outline"}
            className={viewMode === "knowledge" ? "bg-blue-600 text-white" : ""}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </Button>
          <Button
            onClick={() => setViewMode("community")}
            variant={viewMode === "community" ? "default" : "outline"}
            className={viewMode === "community" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Community
          </Button>
          <Button
            onClick={() => setViewMode("feedback")}
            variant={viewMode === "feedback" ? "default" : "outline"}
            className={viewMode === "feedback" ? "bg-blue-600 text-white" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        </div>

        {/* Find Mentors View */}
        {viewMode === "mentors" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{mentor.name}</p>
                    <p className="text-sm text-gray-600">{mentor.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-900">{mentor.rating}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{mentor.bio}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-bold text-gray-900">{mentor.experience} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region</span>
                    <span className="font-bold text-gray-900">{mentor.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-bold text-gray-900">{mentor.students}</span>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">Request Mentorship</Button>
              </Card>
            ))}
          </div>
        )}

        {/* My Mentorships View */}
        {viewMode === "myMentorships" && (
          <div className="space-y-4">
            {myMentorships.map((mentorship) => (
              <Card key={mentorship.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{mentorship.mentorName}</p>
                    <p className="text-sm text-gray-600">{mentorship.specialty}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Progress</p>
                    <p className="font-bold text-gray-900">{mentorship.progress}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sessions Done</p>
                    <p className="font-bold text-gray-900">{mentorship.sessionsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Session</p>
                    <p className="font-bold text-gray-900">{mentorship.nextSession}</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${mentorship.progress}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Session
                  </Button>
                  <Button variant="outline" className="flex-1">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Progress View */}
        {viewMode === "progress" && (
          <div className="space-y-6">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <p className="font-bold text-gray-900 mb-2">Overall Progress</p>
              <p className="text-3xl font-bold text-blue-600">{progressData.overallProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width: `${progressData.overallProgress}%` }}
                />
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Learning Goals</p>
              <div className="space-y-3">
                {progressData.goals.map((goal, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      {goal.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                      ) : goal.status === "in_progress" ? (
                        <Clock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                      ) : (
                        <Target className="w-6 h-6 text-gray-400 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{goal.goal}</p>
                        {goal.progress && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="h-2 rounded-full bg-blue-600"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Skills Acquired</p>
              <div className="flex flex-wrap gap-2">
                {progressData.skillsAcquired.map((skill, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Knowledge Base View */}
        {viewMode === "knowledge" && (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{article.title}</p>
                    <p className="text-sm text-gray-600">by {article.author}</p>
                  </div>
                  <span className="text-xs text-gray-600">{article.readTime} min read</span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {article.views} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {article.likes} likes
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">Read Article</Button>
              </Card>
            ))}
          </div>
        )}

        {/* Community View */}
        {viewMode === "community" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Total Mentors</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{communityStats.totalMentors}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Total Mentees</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{communityStats.totalMentees}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Active Mentorships</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{communityStats.activeMentorships}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Knowledge Articles</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{communityStats.knowledgeArticles}</p>
            </Card>
          </div>
        )}

        {/* Feedback View */}
        {viewMode === "feedback" && (
          <div className="space-y-4">
            {feedback.map((fb, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{fb.mentor}</p>
                    <p className="text-sm text-gray-600">{fb.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(fb.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{fb.comment}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper icon components
const Eye = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Heart = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default FarmerMentorshipProgram;
