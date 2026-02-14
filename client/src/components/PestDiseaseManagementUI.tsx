import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bug, Leaf, Pill, Shield, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PestDiseaseIncident {
  id: string;
  type: 'pest' | 'disease';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: number;
  detectionDate: string;
  status: 'detected' | 'treated' | 'monitored' | 'resolved';
  treatments: number;
  effectiveness: number;
}

interface TreatmentMethod {
  name: string;
  type: 'chemical' | 'biological' | 'cultural' | 'mechanical';
  effectiveness: number;
  cost: number;
  waitingPeriod: number;
  environmentalImpact: 'low' | 'medium' | 'high';
}

const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
};

const IMPACT_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function PestDiseaseManagementUI() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIncident, setSelectedIncident] = useState<PestDiseaseIncident | null>(null);
  const [searchSymptoms, setSearchSymptoms] = useState('');

  const incidents: PestDiseaseIncident[] = [
    {
      id: '1',
      type: 'pest',
      name: 'Rice Stem Borer',
      severity: 'high',
      affectedArea: 35,
      detectionDate: '2026-02-10',
      status: 'treated',
      treatments: 2,
      effectiveness: 85,
    },
    {
      id: '2',
      type: 'disease',
      name: 'Rice Blast',
      severity: 'critical',
      affectedArea: 20,
      detectionDate: '2026-02-12',
      status: 'detected',
      treatments: 0,
      effectiveness: 0,
    },
    {
      id: '3',
      type: 'pest',
      name: 'Rice Leaf Folder',
      severity: 'medium',
      affectedArea: 15,
      detectionDate: '2026-02-08',
      status: 'resolved',
      treatments: 3,
      effectiveness: 92,
    },
  ];

  const treatments: TreatmentMethod[] = [
    {
      name: 'Carbofuran',
      type: 'chemical',
      effectiveness: 85,
      cost: 500,
      waitingPeriod: 7,
      environmentalImpact: 'high',
    },
    {
      name: 'Tricyclazole',
      type: 'chemical',
      effectiveness: 90,
      cost: 400,
      waitingPeriod: 7,
      environmentalImpact: 'low',
    },
    {
      name: 'Bacillus thuringiensis',
      type: 'biological',
      effectiveness: 75,
      cost: 300,
      waitingPeriod: 3,
      environmentalImpact: 'low',
    },
  ];

  const preventionStrategies = [
    { strategy: 'Field Sanitation', effectiveness: 70, difficulty: 'Easy' },
    { strategy: 'Crop Rotation', effectiveness: 80, difficulty: 'Medium' },
    { strategy: 'Resistant Varieties', effectiveness: 85, difficulty: 'Medium' },
    { strategy: 'Biological Controls', effectiveness: 75, difficulty: 'Hard' },
  ];

  const treatmentTrends = [
    { month: 'Jan', incidents: 5, resolved: 3, effectiveness: 78 },
    { month: 'Feb', incidents: 8, resolved: 6, effectiveness: 82 },
    { month: 'Mar', incidents: 6, resolved: 5, effectiveness: 85 },
    { month: 'Apr', incidents: 4, resolved: 3, effectiveness: 88 },
  ];

  const getSeverityColor = (severity: string) => SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#gray';
  const getImpactColor = (impact: string) => IMPACT_COLORS[impact as keyof typeof IMPACT_COLORS] || '#gray';

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pest & Disease Management</h1>
        <p className="text-gray-600 mt-1">Monitor, identify, and manage crop pests and diseases</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Active Incidents</p>
              <p className="text-3xl font-bold text-red-600">{incidents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Avg Effectiveness</p>
              <p className="text-3xl font-bold text-green-600">86%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-blue-600">1</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Pill className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Treatments</p>
              <p className="text-3xl font-bold text-purple-600">5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Treatment Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Effectiveness Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={treatmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="effectiveness" stroke="#10b981" strokeWidth={2} name="Effectiveness %" />
                    <Line type="monotone" dataKey="resolved" stroke="#3b82f6" strokeWidth={2} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Incident Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: 1, fill: '#7c3aed' },
                        { name: 'High', value: 1, fill: '#ef4444' },
                        { name: 'Medium', value: 1, fill: '#f59e0b' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={['#7c3aed', '#ef4444', '#f59e0b'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Symptom Identifier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identify Pest/Disease</CardTitle>
              <CardDescription>Enter symptoms to identify potential pests or diseases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Enter symptoms (e.g., 'white heads', 'leaf spots', 'wilting')"
                  value={searchSymptoms}
                  onChange={(e) => setSearchSymptoms(e.target.value)}
                />
                <Button className="w-full">Search Symptoms</Button>
                {searchSymptoms && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      Possible matches: Rice Stem Borer, Rice Blast, Rice Leaf Folder
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {incident.type === 'pest' ? (
                            <Bug className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Leaf className="w-5 h-5 text-green-600" />
                          )}
                          <p className="font-semibold">{incident.name}</p>
                          <Badge style={{ backgroundColor: getSeverityColor(incident.severity) }} className="text-white">
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Affected Area: {incident.affectedArea}% | Detected: {incident.detectionDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {incident.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-2">{incident.treatments} treatments</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Incident Details */}
          {selectedIncident && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedIncident.name} - Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold">{selectedIncident.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Severity</p>
                    <Badge style={{ backgroundColor: getSeverityColor(selectedIncident.severity) }} className="text-white">
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Affected Area</p>
                    <p className="font-semibold">{selectedIncident.affectedArea}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Effectiveness</p>
                    <p className="font-semibold text-green-600">{selectedIncident.effectiveness}%</p>
                  </div>
                </div>
                <Button className="w-full">Record Treatment</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommended Treatments</CardTitle>
              <CardDescription>Sorted by effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {treatments.map((treatment, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{treatment.name}</p>
                        <p className="text-sm text-gray-600">{treatment.type.toUpperCase()}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {treatment.effectiveness}% effective
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Cost</p>
                        <p className="font-semibold">₹{treatment.cost}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Waiting Period</p>
                        <p className="font-semibold">{treatment.waitingPeriod} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Environmental</p>
                        <Badge style={{ backgroundColor: getImpactColor(treatment.environmentalImpact) }} className="text-white text-xs">
                          {treatment.environmentalImpact}
                        </Badge>
                      </div>
                      <div>
                        <Button size="sm" className="w-full">Apply</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prevention Tab */}
        <TabsContent value="prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prevention Strategies</CardTitle>
              <CardDescription>Proactive measures to prevent pest and disease outbreaks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preventionStrategies.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{item.strategy}</p>
                        <div className="flex gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-600">Effectiveness</p>
                            <p className="text-sm font-semibold text-green-600">{item.effectiveness}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Difficulty</p>
                            <p className="text-sm font-semibold">{item.difficulty}</p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Implement</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
