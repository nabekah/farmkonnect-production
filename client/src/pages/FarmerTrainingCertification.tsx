import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Award,
  Users,
  Play,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  Download,
  Plus,
  Search,
  Filter,
  Zap,
} from "lucide-react";

/**
 * Farmer Training & Certification Component
 * Online courses, certification tracking, and skill-based worker matching
 */
export const FarmerTrainingCertification: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "dashboard" | "courses" | "certifications" | "workers" | "progress"
  >("dashboard");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Mock courses
  const courses = [
    {
      id: 1,
      title: "Sustainable Farming Practices",
      category: "Sustainability",
      level: "beginner",
      duration: 4,
      instructor: "Dr. Kwame Mensah",
      rating: 4.8,
      students: 245,
      price: 0,
      isFree: true,
      modules: 8,
    },
    {
      id: 2,
      title: "Organic Farming Certification",
      category: "Organic",
      level: "intermediate",
      duration: 8,
      instructor: "Ama Boateng",
      rating: 4.7,
      students: 156,
      price: 5000,
      isFree: false,
      modules: 12,
    },
    {
      id: 3,
      title: "Advanced Crop Management",
      category: "Crop Management",
      level: "advanced",
      duration: 12,
      instructor: "Prof. Kofi Asante",
      rating: 4.9,
      students: 89,
      price: 8000,
      isFree: false,
      modules: 16,
    },
  ];

  // Mock certifications
  const certifications = [
    {
      id: 1,
      name: "Organic Farming Certificate",
      issuer: "FarmKonnect Academy",
      issueDate: "2025-12-28",
      expiryDate: "2027-12-28",
      certificateNumber: "FC-ORG-2025-001",
      status: "active",
      score: 92,
    },
    {
      id: 2,
      name: "Pest Management Certification",
      issuer: "FarmKonnect Academy",
      issueDate: "2025-10-15",
      expiryDate: "2027-10-15",
      certificateNumber: "FC-PEST-2025-045",
      status: "active",
      score: 88,
    },
  ];

  // Mock workers
  const workers = [
    {
      id: 1,
      name: "John Doe",
      skills: ["Organic Farming", "Pest Management", "Crop Management"],
      certifications: 2,
      experience: 8,
      rating: 4.8,
      matchScore: 95,
      availability: "Available",
      hourlyRate: 50,
    },
    {
      id: 2,
      name: "Jane Smith",
      skills: ["Sustainable Farming", "Water Conservation"],
      certifications: 1,
      experience: 5,
      rating: 4.6,
      matchScore: 82,
      availability: "Available",
      hourlyRate: 40,
    },
    {
      id: 3,
      name: "Peter Johnson",
      skills: ["Advanced Crop Management", "Soil Health", "Pest Management"],
      certifications: 3,
      experience: 12,
      rating: 4.9,
      matchScore: 98,
      availability: "Limited",
      hourlyRate: 60,
    },
  ];

  // Mock dashboard
  const dashboard = {
    coursesEnrolled: 5,
    coursesCompleted: 2,
    certificationsEarned: 2,
    skillsAcquired: 8,
    totalLearningHours: 45,
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training & Certification</h1>
            <p className="text-gray-600 mt-1">Online courses, certifications, and skill-based worker matching</p>
          </div>
          <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("dashboard")}
            variant={viewMode === "dashboard" ? "default" : "outline"}
            className={viewMode === "dashboard" ? "bg-blue-600 text-white" : ""}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setViewMode("courses")}
            variant={viewMode === "courses" ? "default" : "outline"}
            className={viewMode === "courses" ? "bg-blue-600 text-white" : ""}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </Button>
          <Button
            onClick={() => setViewMode("certifications")}
            variant={viewMode === "certifications" ? "default" : "outline"}
            className={viewMode === "certifications" ? "bg-blue-600 text-white" : ""}
          >
            <Award className="w-4 h-4 mr-2" />
            Certifications
          </Button>
          <Button
            onClick={() => setViewMode("workers")}
            variant={viewMode === "workers" ? "default" : "outline"}
            className={viewMode === "workers" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Worker Matching
          </Button>
          <Button
            onClick={() => setViewMode("progress")}
            variant={viewMode === "progress" ? "default" : "outline"}
            className={viewMode === "progress" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Progress
          </Button>
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Courses Enrolled</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.coursesEnrolled}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.coursesCompleted}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Certifications</p>
                <p className="text-3xl font-bold text-purple-600">{dashboard.certificationsEarned}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Skills Acquired</p>
                <p className="text-3xl font-bold text-orange-600">{dashboard.skillsAcquired}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Learning Hours</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.totalLearningHours}h</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("courses")}>
                <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
                <p className="font-bold text-gray-900">Explore Courses</p>
                <p className="text-sm text-gray-600 mt-2">Browse and enroll in training programs</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("certifications")}>
                <Award className="w-8 h-8 text-purple-600 mb-3" />
                <p className="font-bold text-gray-900">My Certifications</p>
                <p className="text-sm text-gray-600 mt-2">View and download your certificates</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("workers")}>
                <Users className="w-8 h-8 text-green-600 mb-3" />
                <p className="font-bold text-gray-900">Skilled Workers</p>
                <p className="text-sm text-gray-600 mt-2">Find workers by skills and certifications</p>
              </Card>
            </div>
          </>
        )}

        {/* Courses View */}
        {viewMode === "courses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedLevel(null)}
                  variant={selectedLevel === null ? "default" : "outline"}
                  className={selectedLevel === null ? "bg-blue-600 text-white" : ""}
                >
                  All Levels
                </Button>
                <Button
                  onClick={() => setSelectedLevel("beginner")}
                  variant={selectedLevel === "beginner" ? "default" : "outline"}
                  className={selectedLevel === "beginner" ? "bg-green-600 text-white" : ""}
                >
                  Beginner
                </Button>
                <Button
                  onClick={() => setSelectedLevel("intermediate")}
                  variant={selectedLevel === "intermediate" ? "default" : "outline"}
                  className={selectedLevel === "intermediate" ? "bg-yellow-600 text-white" : ""}
                >
                  Intermediate
                </Button>
                <Button
                  onClick={() => setSelectedLevel("advanced")}
                  variant={selectedLevel === "advanced" ? "default" : "outline"}
                  className={selectedLevel === "advanced" ? "bg-red-600 text-white" : ""}
                >
                  Advanced
                </Button>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </div>

            {courses.map((course) => (
              <Card key={course.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{course.title}</p>
                    <p className="text-sm text-gray-600">{course.category}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getLevelColor(course.level)}`}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Instructor</p>
                    <p className="font-bold text-gray-900">{course.instructor}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Duration</p>
                    <p className="font-bold text-gray-900">{course.duration} weeks</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Students</p>
                    <p className="font-bold text-gray-900">{course.students}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Rating</p>
                    <p className="font-bold text-yellow-600 flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {course.rating}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Price</p>
                    <p className="font-bold text-gray-900">
                      {course.isFree ? "Free" : `GH₵${course.price}`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Enroll Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Certifications View */}
        {viewMode === "certifications" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Certifications</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            {certifications.map((cert) => (
              <Card key={cert.id} className="p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{cert.name}</p>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Certificate #</p>
                    <p className="font-bold text-gray-900 text-sm">{cert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Issued Date</p>
                    <p className="font-bold text-gray-900">{cert.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Expiry Date</p>
                    <p className="font-bold text-gray-900">{cert.expiryDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Score</p>
                    <p className="font-bold text-green-600">{cert.score}%</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full">
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Worker Matching View */}
        {viewMode === "workers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Skilled Workers</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Skills
              </Button>
            </div>

            {workers.map((worker) => (
              <Card key={worker.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{worker.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-600">
                        <Zap className="w-4 h-4 inline mr-1" />
                        {worker.experience} years experience
                      </span>
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {worker.rating}/5.0
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{worker.matchScore}%</p>
                    <p className="text-xs text-gray-600">Match Score</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-900 mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span key={idx} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Certifications</p>
                    <p className="font-bold text-gray-900">{worker.certifications}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Availability</p>
                    <p className="font-bold text-gray-900">{worker.availability}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Hourly Rate</p>
                    <p className="font-bold text-gray-900">GH₵{worker.hourlyRate}</p>
                  </div>
                  <div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Hire
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Progress View */}
        {viewMode === "progress" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Progress</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">Sustainable Farming Practices</p>
                  <span className="text-sm font-bold text-blue-600">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 rounded-full bg-blue-600" style={{ width: "65%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">Organic Farming Certification</p>
                  <span className="text-sm font-bold text-green-600">100% - Completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 rounded-full bg-green-600" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">Pest & Disease Management</p>
                  <span className="text-sm font-bold text-yellow-600">40%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 rounded-full bg-yellow-600" style={{ width: "40%" }} />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FarmerTrainingCertification;
