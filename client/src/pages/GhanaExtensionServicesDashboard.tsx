import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, AlertCircle, TrendingUp, Phone, Mail, MapPin } from "lucide-react";

type Species = "cattle" | "poultry" | "goats" | "sheep" | "pigs" | "rabbits";

export const GhanaExtensionServicesDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("Greater Accra");
  const [selectedSpecies, setSelectedSpecies] = useState<Species>("cattle");

  // Fetch Ghana regions
  const { data: regions } = trpc.ghanaExtensionServices.getGhanaRegions.useQuery();

  // Fetch disease alerts
  const { data: diseaseAlerts } = trpc.ghanaExtensionServices.getDiseaseAlerts.useQuery({
    species: selectedSpecies,
    region: selectedRegion
  });

  // Fetch market prices
  const { data: marketPrices } = trpc.ghanaExtensionServices.getMarketPrices.useQuery({
    region: selectedRegion
  });

  // Fetch extension officers
  const { data: extensionOfficers } = trpc.ghanaExtensionServices.getExtensionOfficers.useQuery({
    region: selectedRegion
  });

  // Fetch weather risk assessment
  const { data: weatherRisk } = trpc.ghanaExtensionServices.getWeatherRiskAssessment.useQuery({
    region: selectedRegion,
    species: selectedSpecies
  });

  // Fetch farming calendar
  const { data: farmingCalendar } = trpc.ghanaExtensionServices.getFarmingCalendar.useQuery({
    species: selectedSpecies
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-600";
      case "moderate":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ghana Agricultural Extension Services</h1>
        <p className="text-gray-600 mt-2">Real-time agricultural information and support for Ghanaian farmers</p>
      </div>

      {/* Region and Species Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Region</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {regions?.regions.map((region) => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Species</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value as Species)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="cattle">Cattle</option>
              <option value="poultry">Poultry</option>
              <option value="goats">Goats</option>
              <option value="sheep">Sheep</option>
              <option value="pigs">Pigs</option>
              <option value="rabbits">Rabbits</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList>
          <TabsTrigger value="alerts">Disease Alerts</TabsTrigger>
          <TabsTrigger value="prices">Market Prices</TabsTrigger>
          <TabsTrigger value="weather">Weather Risk</TabsTrigger>
          <TabsTrigger value="calendar">Farming Calendar</TabsTrigger>
          <TabsTrigger value="officers">Extension Officers</TabsTrigger>
        </TabsList>

        {/* Disease Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Disease Alerts for {selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)}</CardTitle>
              <CardDescription>Current disease threats and prevention measures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diseaseAlerts?.alerts.map((alert: any) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{alert.name}</h3>
                        <p className="text-sm mt-1"><strong>Symptoms:</strong> {alert.symptoms}</p>
                        <p className="text-sm"><strong>Prevention:</strong> {alert.prevention}</p>
                        <p className="text-xs mt-2 opacity-75">Last updated: {alert.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Prices Tab */}
        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Market Prices in {selectedRegion}</CardTitle>
              <CardDescription>Current market prices for livestock and products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketPrices?.prices && Object.entries(marketPrices.prices).map(([product, data]: [string, any]) => (
                  <div key={product} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold capitalize">{product.replace(/_/g, " ")}</h3>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          GHS {data.price}
                        </p>
                        <p className="text-sm text-gray-600">{data.unit}</p>
                      </div>
                      <div className={`flex items-center gap-1 ${data.trend === 'up' ? 'text-green-600' : data.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm capitalize">{data.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Risk Tab */}
        <TabsContent value="weather">
          <Card>
            <CardHeader>
              <CardTitle>Weather Risk Assessment</CardTitle>
              <CardDescription>Current weather conditions and livestock risk factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weatherRisk?.riskFactors && Object.entries(weatherRisk.riskFactors).map(([factor, data]: [string, any]) => (
                  <div key={factor} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold capitalize">{factor}</h3>
                        <p className="text-lg font-bold mt-2">{data.current}°C</p>
                        <p className={`text-sm mt-1 ${getRiskColor(data.risk)}`}>
                          Risk Level: <span className="font-semibold capitalize">{data.risk}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{data.recommendation}</p>
                      </div>
                      <AlertCircle className={`h-6 w-6 ${getRiskColor(data.risk)}`} />
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900">Overall Risk Level</h4>
                  <p className={`text-lg font-bold mt-2 ${getRiskColor(weatherRisk?.overallRisk)}`}>
                    {weatherRisk?.overallRisk?.toUpperCase()}
                  </p>
                  <div className="mt-3 space-y-2">
                    {weatherRisk?.recommendations?.map((rec: string, idx: number) => (
                      <p key={idx} className="text-sm text-blue-800">• {rec}</p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Farming Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Farming Calendar for {selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)}</CardTitle>
              <CardDescription>Recommended activities for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900">This Month's Activities</h3>
                  <ul className="mt-3 space-y-2">
                    {farmingCalendar?.activities?.map((activity: string, idx: number) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900">Best Practices</h3>
                  <ul className="mt-3 space-y-2">
                    {farmingCalendar?.bestPractices?.map((practice: string, idx: number) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        {practice}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extension Officers Tab */}
        <TabsContent value="officers">
          <Card>
            <CardHeader>
              <CardTitle>Extension Officers in {selectedRegion}</CardTitle>
              <CardDescription>Contact information for agricultural extension services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extensionOfficers?.officers && extensionOfficers.officers.length > 0 ? (
                  extensionOfficers.officers.map((officer: any) => (
                    <div key={officer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h3 className="font-semibold text-lg">{officer.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Specialty:</strong> {officer.specialty}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <a href={`tel:${officer.phone}`} className="text-blue-600 hover:underline">
                            {officer.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <a href={`mailto:${officer.email}`} className="text-blue-600 hover:underline">
                            {officer.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No extension officers listed for this region</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
