import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export function TestEmailSender() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [testType, setTestType] = useState<"basic" | "welcome" | "alert">("basic");
  const [subject, setSubject] = useState("FarmKonnect Test Email");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const sendTestEmailMutation = trpc.email.sendTestEmail.useMutation();

  const handleSendTestEmail = async () => {
    if (!recipientEmail) {
      setResult({
        success: false,
        message: "Please enter a recipient email address",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await sendTestEmailMutation.mutateAsync({
        recipientEmail,
        subject,
        testType,
      });

      setResult({
        success: response.success,
        message: response.message,
      });

      if (response.success) {
        // Clear form on success
        setRecipientEmail("");
        setSubject("FarmKonnect Test Email");
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to send test email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email Sender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recipient Email
          </label>
          <Input
            type="email"
            placeholder="test@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Subject Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <Input
            type="text"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Test Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Test Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["basic", "welcome", "alert"] as const).map((type) => (
              <Button
                key={type}
                variant={testType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setTestType(type)}
                disabled={isLoading}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg ${
              result.success
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                result.success
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendTestEmail}
          disabled={isLoading || !recipientEmail}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This will send a test email to verify that your email notifications are working correctly.
        </p>
      </CardContent>
    </Card>
  );
}
