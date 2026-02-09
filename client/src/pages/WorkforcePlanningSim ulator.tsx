import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";

interface Scenario {
  name: string;
  salaryIncrease: number; // percentage
  newHires: number;
  expectedTurnoverReduction: number; // percentage
  monthlyCostIncrease: number; // GHS
}

interface SimulationResult {
  scenario: Scenario;
  currentTurnoverRisk: number;
  projectedTurnoverRisk: number;
  turnoverReduction: number;
  currentMonthlyPayroll: number;
  projectedMonthlyPayroll: number;
  payrollIncrease: number;
  roi: number; // Return on Investment percentage
  breakEvenMonths: number;
}

export default function WorkforcePlanningSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<string>("baseline");
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  // Base data
  const baselineData = {
    currentWorkers: 45,
    currentTurnoverRisk: 15.6, // percentage
    currentMonthlyPayroll: 125000, // GHS
    criticalRiskWorkers: 2,
    highRiskWorkers: 5,
  };

  // Predefined scenarios
  const scenarios: { [key: string]: Scenario } = {
    baseline: {
      name: "Baseline (No Changes)",
      salaryIncrease: 0,
      newHires: 0,
      expectedTurnoverReduction: 0,
      monthlyCostIncrease: 0,
    },
    conservative: {
      name: "Conservative: Salary Increase 5%",
      salaryIncrease: 5,
      newHires: 0,
      expectedTurnoverReduction: 8,
      monthlyCostIncrease: 6250,
    },
    moderate: {
      name: "Moderate: Salary +8% + 2 New Hires",
      salaryIncrease: 8,
      newHires: 2,
      expectedTurnoverReduction: 12,
      monthlyCostIncrease: 14000,
    },
    aggressive: {
      name: "Aggressive: Salary +12% + 5 New Hires + Training",
      salaryIncrease: 12,
      newHires: 5,
      expectedTurnoverReduction: 18,
      monthlyCostIncrease: 28000,
    },
  };

  const runSimulation = () => {
    const results: SimulationResult[] = [];

    Object.entries(scenarios).forEach(([key, scenario]) => {
      const projectedTurnoverRisk = Math.max(
        0,
        baselineData.currentTurnoverRisk - (baselineData.currentTurnoverRisk * scenario.expectedTurnoverReduction) / 100
      );

      const projectedMonthlyPayroll =
        baselineData.currentMonthlyPayroll + scenario.monthlyCostIncrease;

      const turnoverReduction = baselineData.currentTurnoverRisk - projectedTurnoverRisk;

      // Calculate ROI (simplified: cost savings from reduced turnover)
      const costPerTurnover = 15000; // GHS - estimated cost of replacing a worker
      const expectedTurnoverReduction = (baselineData.currentWorkers * turnoverReduction) / 100;
      const costSavings = expectedTurnoverReduction * costPerTurnover;
      const annualCostIncrease = scenario.monthlyCostIncrease * 12;
      const roi = ((costSavings - annualCostIncrease) / annualCostIncrease) * 100;

      // Calculate break-even months
      const breakEvenMonths =
        scenario.monthlyCostIncrease > 0
          ? Math.ceil((scenario.monthlyCostIncrease * 12) / (costSavings / 12))
          : 0;

      results.push({
        scenario,
        currentTurnoverRisk: baselineData.currentTurnoverRisk,
        projectedTurnoverRisk,
        turnoverReduction,
        currentMonthlyPayroll: baselineData.currentMonthlyPayroll,
        projectedMonthlyPayroll,
        payrollIncrease: scenario.monthlyCostIncrease,
        roi,
        breakEvenMonths,
      });
    });

    setSimulationResults(results);
  };

  // Run simulation on component mount
  React.useEffect(() => {
    runSimulation();
  }, []);

  const selectedResult = simulationResults.find((r) => r.scenario.name === scenarios[selectedScenario].name);

  // Chart data for turnover risk comparison
  const turnoverChartData = simulationResults.map((r) => ({
    scenario: r.scenario.name.split(":")[0],
    current: r.currentTurnoverRisk,
    projected: r.projectedTurnoverRisk,
  }));

  // Chart data for cost comparison
  const costChartData = simulationResults.map((r) => ({
    scenario: r.scenario.name.split(":")[0],
    current: r.currentMonthlyPayroll,
    projected: r.projectedMonthlyPayroll,
  }));

  // Chart data for ROI
  const roiChartData = simulationResults.map((r) => ({
    scenario: r.scenario.name.split(":")[0],
    roi: Math.max(-100, r.roi),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workforce Planning Simulator</h1>
        <p className="text-gray-600 mt-2">Model different scenarios and forecast impact on turnover, costs, and ROI</p>
      </div>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Scenario</CardTitle>
          <CardDescription>Choose a workforce planning scenario to simulate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <Button
                key={key}
                onClick={() => setSelectedScenario(key)}
                variant={selectedScenario === key ? "default" : "outline"}
                className="h-auto py-3 px-4 text-left justify-start"
              >
                <div>
                  <p className="font-semibold">{scenario.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Cost: +GHS {scenario.monthlyCostIncrease.toLocaleString()}/month
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Scenario Details */}
      {selectedResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Turnover Risk Reduction</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {selectedResult.turnoverReduction.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-2">
                From {selectedResult.currentTurnoverRisk.toFixed(1)}% to{" "}
                {selectedResult.projectedTurnoverRisk.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Monthly Cost Increase</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                GHS {selectedResult.payrollIncrease.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                From GHS {selectedResult.currentMonthlyPayroll.toLocaleString()} to GHS{" "}
                {selectedResult.projectedMonthlyPayroll.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Projected ROI</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  selectedResult.roi >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {selectedResult.roi.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {selectedResult.roi >= 0
                  ? "Positive return on investment"
                  : "Initial investment period"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Break-even Period</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {selectedResult.breakEvenMonths} months
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Time to recover investment costs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover Risk Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Turnover Risk Comparison</CardTitle>
            <CardDescription>Current vs Projected turnover risk by scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnoverChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#ef4444" name="Current" />
                <Bar dataKey="projected" fill="#22c55e" name="Projected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Payroll Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll Impact</CardTitle>
            <CardDescription>Current vs Projected monthly payroll costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="projected" fill="#f59e0b" name="Projected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Analysis</CardTitle>
          <CardDescription>Return on investment for each scenario</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Bar
                dataKey="roi"
                fill="#8b5cf6"
                name="ROI %"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Based on simulation results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedResult && selectedResult.roi >= 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Positive ROI:</strong> This scenario shows a positive return on investment. The cost savings from
                reduced turnover exceed the investment costs within {selectedResult.breakEvenMonths} months.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Investment Period:</strong> This scenario requires an initial investment period of{" "}
                {Math.abs(selectedResult?.breakEvenMonths || 0)} months before showing positive returns.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-700">
            <p>
              <strong>Current Situation:</strong> {baselineData.criticalRiskWorkers} workers at critical risk,{" "}
              {baselineData.highRiskWorkers} at high risk
            </p>
            <p>
              <strong>Projected Impact:</strong> Reduce turnover risk by{" "}
              {selectedResult?.turnoverReduction.toFixed(1)}%, potentially retaining{" "}
              {Math.round((baselineData.currentWorkers * (selectedResult?.turnoverReduction || 0)) / 100)} workers
            </p>
            <p>
              <strong>Cost-Benefit:</strong> Monthly investment of GHS {selectedResult?.payrollIncrease.toLocaleString()}{" "}
              to save approximately GHS{" "}
              {Math.round(
                ((baselineData.currentWorkers * (selectedResult?.turnoverReduction || 0)) / 100) * 15000 / 12
              ).toLocaleString()}{" "}
              in turnover costs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
