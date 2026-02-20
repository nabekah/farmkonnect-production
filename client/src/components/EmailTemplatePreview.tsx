import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, AlertCircle, Heart } from "lucide-react";

export type EmailTemplateType = "basic" | "welcome" | "alert";

interface EmailTemplatePreviewProps {
  templateType: EmailTemplateType;
  recipientName?: string;
}

export function EmailTemplatePreview({
  templateType,
  recipientName = "User",
}: EmailTemplatePreviewProps) {
  const getTemplateContent = () => {
    switch (templateType) {
      case "welcome":
        return {
          icon: Heart,
          title: "Welcome Email",
          description: "A warm welcome email for new users",
          color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          badgeColor: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
          content: `
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to FarmKonnect!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hello ${recipientName},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              This is a test email to confirm that your email notifications are working correctly.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You can now receive important updates about your farms, crops, and tasks directly in your inbox.
            </p>
          `,
        };

      case "alert":
        return {
          icon: AlertCircle,
          title: "Alert Email",
          description: "An alert-style email with warning styling",
          color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          badgeColor: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
          content: `
            <h1 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Alert Notification Test</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hello ${recipientName},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              This is a test alert email to verify that critical notifications are being delivered to your inbox.
            </p>
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0;">
                <strong>Test Alert:</strong> This is a sample alert to demonstrate notification delivery.
              </p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              If you received this email, your alert notifications are working properly.
            </p>
          `,
        };

      case "basic":
      default:
        return {
          icon: Mail,
          title: "Basic Email",
          description: "A simple test email for basic verification",
          color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          badgeColor: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
          content: `
            <h1 style="color: #2c3e50; margin-bottom: 20px;">FarmKonnect Test Email</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Hello ${recipientName},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              This is a test email from FarmKonnect to verify that your email notifications are working correctly.
            </p>
            <div style="background-color: #e8f4f8; border: 1px solid #b3d9e8; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #2c3e50; margin: 0;">
                <strong>✓ Email Delivery Confirmed</strong><br/>
                Your email notifications are active and working properly.
              </p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You can manage your notification preferences in your account settings.
            </p>
          `,
        };
    }
  };

  const template = getTemplateContent();
  const IconComponent = template.icon;

  return (
    <Card className={`w-full ${template.color}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className="h-6 w-6" />
            <div>
              <CardTitle>{template.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {template.description}
              </p>
            </div>
          </div>
          <Badge className={template.badgeColor}>{templateType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Email Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: template.content }}
            />
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <p>FarmKonnect Team</p>
              <p>© 2026 FarmKonnect. All rights reserved.</p>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3 text-sm">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Template Details:
            </p>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• <strong>Type:</strong> {templateType.charAt(0).toUpperCase() + templateType.slice(1)}</li>
              <li>• <strong>Use Case:</strong> {template.description}</li>
              <li>• <strong>Format:</strong> HTML Email</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
