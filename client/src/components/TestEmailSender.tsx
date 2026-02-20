import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { EmailTemplateType } from "./EmailTemplatePreview";

export function TestEmailSender() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [testType, setTestType] = useState<EmailTemplateType>("basic");
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

  const templateOptions = [
    {
      type: "basic" as EmailTemplateType,
      label: "Basic",
      icon: "📧",
      description: "Simple test email",
    },
    {
      type: "welcome" as EmailTemplateType,
      label: "Welcome",
      icon: "👋",
      description: "Welcome email",
    },
    {
      type: "alert" as EmailTemplateType,
      label: "Alert",
      icon: "⚠️",
      description: "Alert email",
    },
  ];

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

        {/* Email Template Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Template
          </label>
          <div className="grid grid-cols-3 gap-2">
            {templateOptions.map(({ type, label, icon, description }) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                disabled={isLoading}
                className={`p-3 rounded-lg border-2 transition-all ${
                  testType === type
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  {label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </div>
              </button>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

        {/* Template Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-xs text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          <p className="font-semibold mb-1">Template Info:</p>
          <p>
            {testType === "basic" &&
              "Simple test email to verify delivery is working"}
            {testType === "welcome" &&
              "Welcome email for new users with onboarding information"}
            {testType === "alert" &&
              "Critical alert email with warning styling and urgency"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
