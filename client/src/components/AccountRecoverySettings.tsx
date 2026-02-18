import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { Copy, CheckCircle, AlertCircle, Download, Shield } from "lucide-react";

export function AccountRecoverySettings() {
  const [activeTab, setActiveTab] = useState<"backup_codes" | "security_questions" | "recovery_methods">("backup_codes");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ question: string; answer: string }>>([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  const generateBackupCodesMutation = trpc.securityFeatures.generateBackupCodes.useMutation();
  const getSecurityQuestionsMutation = trpc.securityFeatures.getSecurityQuestions.useQuery();
  const setSecurityQuestionsMutation = trpc.securityFeatures.setSecurityQuestions.useMutation();
  const recoveryStatusQuery = trpc.securityFeatures.getRecoveryStatus.useQuery();

  const handleGenerateBackupCodes = async () => {
    try {
      const result = await generateBackupCodesMutation.mutateAsync();
      setBackupCodes(result.backupCodes);
      setShowCodes(true);
    } catch (error) {
      console.error("Failed to generate backup codes:", error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadCodes = () => {
    const content = backupCodes.join("\n");
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", "farmkonnect-backup-codes.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveSecurityQuestions = async () => {
    if (securityQuestions.some((q) => !q.question || !q.answer)) {
      alert("Please fill in all security questions and answers");
      return;
    }

    try {
      await setSecurityQuestionsMutation.mutateAsync({ questions: securityQuestions });
    } catch (error) {
      console.error("Failed to save security questions:", error);
    }
  };

  const recoveryStatus = recoveryStatusQuery.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Recovery Options</CardTitle>
          <CardDescription>
            Set up multiple ways to recover your account if you lose access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="backup_codes" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Backup Codes
              </TabsTrigger>
              <TabsTrigger value="security_questions">Security Questions</TabsTrigger>
              <TabsTrigger value="recovery_methods">Recovery Methods</TabsTrigger>
            </TabsList>

            {/* Backup Codes Tab */}
            <TabsContent value="backup_codes" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Backup codes are one-time use codes that can help you recover your account if you lose access to your 2FA device.
                </AlertDescription>
              </Alert>

              {!showCodes ? (
                <Button
                  onClick={handleGenerateBackupCodes}
                  disabled={generateBackupCodesMutation.isPending}
                  className="w-full"
                >
                  {generateBackupCodesMutation.isPending ? "Generating..." : "Generate Backup Codes"}
                </Button>
              ) : (
                <>
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      Save these codes in a secure location. Each code can only be used once.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {backupCodes.map((code) => (
                      <div
                        key={code}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border"
                      >
                        <code className="font-mono text-sm font-semibold">{code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(code)}
                        >
                          {copiedCode === code ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleDownloadCodes}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Codes as Text File
                  </Button>

                  <Button
                    onClick={() => setShowCodes(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Hide Codes
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Security Questions Tab */}
            <TabsContent value="security_questions" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Set up security questions to help verify your identity during account recovery.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {securityQuestions.map((item, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <label className="text-sm font-medium">Question {index + 1}</label>
                    <select
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[index].question = e.target.value;
                        setSecurityQuestions(updated);
                      }}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Select a question</option>
                      {getSecurityQuestionsMutation.data?.questions.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>

                    <label className="text-sm font-medium">Your Answer</label>
                    <Input
                      type="text"
                      placeholder="Enter your answer"
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[index].answer = e.target.value;
                        setSecurityQuestions(updated);
                      }}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveSecurityQuestions}
                disabled={setSecurityQuestionsMutation.isPending}
                className="w-full"
              >
                {setSecurityQuestionsMutation.isPending ? "Saving..." : "Save Security Questions"}
              </Button>

              {setSecurityQuestionsMutation.isSuccess && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Security questions saved successfully
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Recovery Methods Tab */}
            <TabsContent value="recovery_methods" className="space-y-4">
              <div className="space-y-3">
                {/* Email Recovery */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Email Recovery</h3>
                    <p className="text-sm text-muted-foreground">
                      {recoveryStatus?.canRecoverWithEmail ? "Enabled" : "Not available"}
                    </p>
                  </div>
                  {recoveryStatus?.canRecoverWithEmail && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                {/* Backup Code Recovery */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Backup Codes</h3>
                    <p className="text-sm text-muted-foreground">
                      {recoveryStatus?.canRecoverWithBackupCode ? "Enabled" : "Not set up"}
                    </p>
                  </div>
                  {recoveryStatus?.canRecoverWithBackupCode && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                {/* Security Questions Recovery */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Security Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      {recoveryStatus?.canRecoverWithSecurityQuestion ? "Enabled" : "Not set up"}
                    </p>
                  </div>
                  {recoveryStatus?.canRecoverWithSecurityQuestion && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You have {recoveryStatus?.availableMethods.length || 0} recovery method(s) active. We recommend setting up at least 2.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recovery Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recovery Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Store backup codes in a secure location (password manager, safe, etc.)</p>
          <p>• Use unique answers for security questions that only you would know</p>
          <p>• Keep your email address and phone number up to date</p>
          <p>• Regenerate backup codes periodically</p>
          <p>• Never share your recovery codes or security answers with anyone</p>
        </CardContent>
      </Card>
    </div>
  );
}
