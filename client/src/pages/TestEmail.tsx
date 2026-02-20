import { TestEmailSender } from "@/components/TestEmailSender";

export function TestEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Email Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send a test email to verify that your email notification system is working correctly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Email Sender */}
          <div>
            <TestEmailSender />
          </div>

          {/* Information Panel */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About Email Testing
              </h2>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-0.5">1.</span>
                  <span>
                    <strong>Basic Test:</strong> Sends a simple test email to verify email delivery
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-0.5">2.</span>
                  <span>
                    <strong>Welcome Test:</strong> Sends a welcome-style email with formatted content
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-0.5">3.</span>
                  <span>
                    <strong>Alert Test:</strong> Sends an alert-style email with warning styling
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                📧 Configuration Required
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Make sure your SendGrid API key is configured in the environment variables for emails to be sent successfully.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
                ✓ Tips for Testing
              </h3>
              <ul className="text-sm text-green-800 dark:text-green-300 space-y-2">
                <li>• Use your own email address to receive test emails</li>
                <li>• Check your spam folder if you don't see the email</li>
                <li>• Try different test types to see various email formats</li>
                <li>• Verify email delivery in your email provider's logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
