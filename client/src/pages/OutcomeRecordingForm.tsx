import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

interface PredictionToRecord {
  id: string;
  type: "yield" | "disease" | "market";
  cropType?: string;
  productType?: string;
  predictedValue: number;
  confidence: number;
  predictionDate: string;
  unit: string;
}

interface OutcomeRecord {
  predictionId: string;
  actualValue: number;
  notes: string;
  recordedDate: string;
}

export default function OutcomeRecordingForm() {
  const [activeTab, setActiveTab] = useState<"pending" | "recorded">("pending");
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionToRecord | null>(null);
  const [actualValue, setActualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Mock data for pending predictions
  const pendingPredictions: PredictionToRecord[] = [
    {
      id: "pred-1",
      type: "yield",
      cropType: "Maize",
      predictedValue: 4.2,
      confidence: 0.85,
      predictionDate: "2026-02-01",
      unit: "tons/ha",
    },
    {
      id: "pred-2",
      type: "yield",
      cropType: "Wheat",
      predictedValue: 3.5,
      confidence: 0.72,
      predictionDate: "2026-02-01",
      unit: "tons/ha",
    },
    {
      id: "pred-3",
      type: "market",
      productType: "Maize",
      predictedValue: 245,
      confidence: 0.78,
      predictionDate: "2026-02-05",
      unit: "$/ton",
    },
    {
      id: "pred-4",
      type: "disease",
      cropType: "Poultry",
      predictedValue: 0.75,
      confidence: 0.65,
      predictionDate: "2026-02-03",
      unit: "probability",
    },
  ];

  const recordedOutcomes: OutcomeRecord[] = [
    {
      predictionId: "pred-5",
      actualValue: 4.15,
      notes: "Excellent harvest conditions",
      recordedDate: "2026-02-15",
    },
    {
      predictionId: "pred-6",
      actualValue: 3.2,
      notes: "Slightly lower due to late rainfall",
      recordedDate: "2026-02-15",
    },
  ];

  const handleRecordOutcome = async () => {
    if (!selectedPrediction || !actualValue) {
      alert("Please select a prediction and enter the actual value");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage(`✓ Outcome recorded successfully for ${selectedPrediction.cropType || selectedPrediction.productType}`);
      setActualValue("");
      setNotes("");
      setSelectedPrediction(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      alert("Error recording outcome. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAccuracy = (predicted: number, actual: number) => {
    if (actual === 0) return 0;
    const percentError = Math.abs((predicted - actual) / actual) * 100;
    return Math.max(0, 100 - percentError);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Record Prediction Outcomes</h1>
        <p className="text-gray-600 mt-1">Log actual results to improve AI model accuracy</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium ${
            activeTab === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending Outcomes ({pendingPredictions.length})
        </button>
        <button
          onClick={() => setActiveTab("recorded")}
          className={`px-4 py-2 font-medium ${
            activeTab === "recorded"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Recorded ({recordedOutcomes.length})
        </button>
      </div>

      {/* Pending Outcomes Tab */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction List */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Pending Predictions</h3>
            {pendingPredictions.map((pred) => (
              <Card
                key={pred.id}
                className={`cursor-pointer transition-all ${
                  selectedPrediction?.id === pred.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedPrediction(pred)}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{pred.cropType || pred.productType}</p>
                      <p className="text-xs text-gray-500 capitalize">{pred.type}</p>
                    </div>
                    <Badge variant="outline">{(pred.confidence * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Predicted: <span className="font-semibold">{pred.predictedValue} {pred.unit}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(pred.predictionDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recording Form */}
          <div className="lg:col-span-2">
            {selectedPrediction ? (
              <Card>
                <CardHeader>
                  <CardTitle>Record Outcome</CardTitle>
                  <CardDescription>
                    Enter the actual value for {selectedPrediction.cropType || selectedPrediction.productType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prediction Details */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-semibold capitalize">{selectedPrediction.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="font-semibold">{(selectedPrediction.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Predicted Value</p>
                        <p className="font-semibold">
                          {selectedPrediction.predictedValue} {selectedPrediction.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Prediction Date</p>
                        <p className="font-semibold">
                          {new Date(selectedPrediction.predictionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Actual Value ({selectedPrediction.unit}) *
                      </label>
                      <Input
                        type="number"
                        placeholder={`Enter actual value in ${selectedPrediction.unit}`}
                        value={actualValue}
                        onChange={(e) => setActualValue(e.target.value)}
                        step="0.01"
                      />
                      {actualValue && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Expected Accuracy:</span>{" "}
                            <span className="font-semibold text-blue-600">
                              {calculateAccuracy(
                                selectedPrediction.predictedValue,
                                parseFloat(actualValue)
                              ).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        placeholder="Add any notes about the outcome (e.g., weather conditions, management practices, etc.)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleRecordOutcome}
                      disabled={!actualValue || loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Record Outcome
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPrediction(null);
                        setActualValue("");
                        setNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Info Alert */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Recording outcomes helps improve the AI model's accuracy. The more outcomes you record, the better
                      predictions become over time.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a prediction from the list to record its outcome</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Recorded Outcomes Tab */}
      {activeTab === "recorded" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recorded Outcomes</CardTitle>
              <CardDescription>History of recorded prediction outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recordedOutcomes.map((outcome, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Prediction #{outcome.predictionId}</p>
                        <p className="text-sm text-gray-600">Recorded: {new Date(outcome.recordedDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Recorded</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Actual Value:</span> {outcome.actualValue}
                    </p>
                    {outcome.notes && (
                      <p className="text-sm text-gray-600 italic">
                        <span className="font-medium">Notes:</span> {outcome.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
