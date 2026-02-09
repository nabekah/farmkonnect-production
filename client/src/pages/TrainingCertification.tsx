import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TrainingCertification() {
  const [activeTab, setActiveTab] = useState<'courses' | 'sessions' | 'analytics'>('courses');

  // Mock data for courses
  const courses = [
    {
      id: 1,
      title: 'Sustainable Farming Practices',
      description: 'Learn modern sustainable farming techniques for improved crop yield',
      duration: 40,
      category: 'Agriculture',
      level: 'beginner',
      instructor: 'Dr. Kwame Mensah',
      participants: 24,
      maxParticipants: 30
    },
    {
      id: 2,
      title: 'Livestock Health Management',
      description: 'Comprehensive guide to animal health, disease prevention, and treatment',
      duration: 35,
      category: 'Livestock',
      level: 'intermediate',
      instructor: 'Dr. Abena Owusu',
      participants: 18,
      maxParticipants: 25
    },
    {
      id: 3,
      title: 'Advanced Crop Breeding',
      description: 'Master advanced techniques in crop selection and breeding',
      duration: 50,
      category: 'Agriculture',
      level: 'advanced',
      instructor: 'Prof. Kofi Asante',
      participants: 12,
      maxParticipants: 20
    }
  ];

  // Mock data for training sessions
  const trainingSessions = [
    {
      id: 1,
      courseTitle: 'Sustainable Farming Practices',
      enrollmentDate: '2026-01-15',
      status: 'in-progress',
      progress: 65,
      certificateIssued: false
    },
    {
      id: 2,
      courseTitle: 'Livestock Health Management',
      enrollmentDate: '2025-12-10',
      status: 'completed',
      progress: 100,
      certificateIssued: true,
      certificateNumber: 'CERT-2026-001'
    },
    {
      id: 3,
      courseTitle: 'Soil Testing & Analysis',
      enrollmentDate: '2025-11-20',
      status: 'completed',
      progress: 100,
      certificateIssued: true,
      certificateNumber: 'CERT-2026-002'
    }
  ];

  // Analytics data
  const analyticsData = {
    totalEnrolled: 45,
    completed: 28,
    inProgress: 12,
    certified: 26,
    completionRate: 62,
    certificationRate: 58
  };

  const chartData = [
    { name: 'Enrolled', value: analyticsData.totalEnrolled, fill: '#3b82f6' },
    { name: 'Completed', value: analyticsData.completed, fill: '#10b981' },
    { name: 'In Progress', value: analyticsData.inProgress, fill: '#f59e0b' },
    { name: 'Certified', value: analyticsData.certified, fill: '#8b5cf6' }
  ];

  const progressData = [
    { name: 'Completion Rate', value: analyticsData.completionRate },
    { name: 'Certification Rate', value: analyticsData.certificationRate }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training & Certification</h1>
        <p className="text-gray-600 mt-2">Manage farmer training programs and certifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-medium ${activeTab === 'courses' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Available Courses
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 font-medium ${activeTab === 'sessions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          My Training
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Analytics
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </div>
                  <Badge variant={course.level === 'beginner' ? 'default' : course.level === 'intermediate' ? 'secondary' : 'destructive'}>
                    {course.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{course.duration} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold">{course.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Instructor</p>
                    <p className="font-semibold">{course.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participants</p>
                    <p className="font-semibold">{course.participants}/{course.maxParticipants}</p>
                  </div>
                </div>
                <Button className="w-full">Enroll Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Training Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="grid gap-4">
          {trainingSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{session.courseTitle}</CardTitle>
                  <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-medium">{session.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Enrollment Date</p>
                      <p className="font-semibold">{session.enrollmentDate}</p>
                    </div>
                    {session.certificateIssued && (
                      <div>
                        <p className="text-sm text-gray-600">Certificate</p>
                        <p className="font-semibold text-green-600">{session.certificateNumber}</p>
                      </div>
                    )}
                  </div>
                  {session.status === 'in-progress' && (
                    <Button className="w-full">Continue Training</Button>
                  )}
                  {session.certificateIssued && (
                    <Button variant="outline" className="w-full">Download Certificate</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalEnrolled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{analyticsData.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Certified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analyticsData.certified}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
