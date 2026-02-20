import { useState } from "react";
import { TestEmailSender } from "@/components/TestEmailSender";
import { EmailTemplatePreview, EmailTemplateType } from "@/components/EmailTemplatePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TestEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>("basic");
  const [previewName, setPreviewName] = useState("User");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Email Testing Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send test emails and preview different email templates to verify your notification system is working correctly.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Test Email Sender */}
          <div className="lg:col-span-1">
            <TestEmailSender />
          </div>

          {/* Right Column: Template Preview and Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Preview */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Email Template Preview
              </h2>
              <Tabs value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as EmailTemplateType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="alert">Alert</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4">
                  <EmailTemplatePreview templateType="basic" recipientName={previewName} />
                </TabsContent>

                <TabsContent value="welcome" className="mt-4">
                  <EmailTemplatePreview templateType="welcome" recipientName={previewName} />
                </TabsContent>

                <TabsContent value="alert" className="mt-4">
                  <EmailTemplatePreview templateType="alert" recipientName={previewName} />
                </TabsContent>
              </Tabs>

              {/* Preview Name Input */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview Recipient Name
                </label>
                <input
                  type="text"
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="Enter name for preview"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Information Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* About Templates */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base">About Email Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">📧 Basic Template</p>
                    <p>A simple, straightforward test email to verify that your email delivery system is working correctly.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">👋 Welcome Template</p>
                    <p>A warm welcome email designed for new users with onboarding information and next steps.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">⚠️ Alert Template</p>
                    <p>A critical alert email with warning styling to test urgent notification delivery.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Info */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-200">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                  <div>
                    <p className="font-semibold mb-1">✓ SendGrid Integration</p>
                    <p>Your SendGrid API is configured and ready to send emails.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">📤 Sender Email</p>
                    <p>noreply@farmconnekt.com</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">🔑 API Status</p>
                    <p>Active and verified</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Testing Tips */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-base text-green-900 dark:text-green-200">Testing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Use your own email address to receive test emails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Check your spam folder if you don't see the email immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Try all three template types to verify different email formats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Verify email delivery in your SendGrid dashboard logs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Test with different email providers (Gmail, Outlook, etc.)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
