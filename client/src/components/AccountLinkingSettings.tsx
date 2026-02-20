import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, Unlink, Check, AlertCircle } from "lucide-react";
import { getGoogleLoginUrl } from "@/const";

export function AccountLinkingSettings() {
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  
  const { data: linkingStatus, isLoading, refetch } = trpc.accountLinking.getLinkingStatus.useQuery();
  const linkGoogleMutation = trpc.accountLinking.linkGoogleAccount.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const unlinkMutation = trpc.accountLinking.unlinkProvider.useMutation({
    onSuccess: () => {
      setUnlinkingProvider(null);
      refetch();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading account settings...</div>;
  }

  const handleUnlink = async (provider: string) => {
    if (confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      await unlinkMutation.mutateAsync({ provider: provider as "google" | "manus" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage the authentication methods linked to your FarmKonnect account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manus Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Manus Account</h3>
                <p className="text-sm text-muted-foreground">{linkingStatus?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              {linkingStatus?.providers && linkingStatus.providers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink("manus")}
                  disabled={unlinkMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Unlink
                </Button>
              )}
            </div>
          </div>

          {/* Google Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Google Account</h3>
                {linkingStatus?.googleId ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {linkingStatus.providers?.find(p => p.provider === "google")?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Linked on {new Date(linkingStatus.providers?.find(p => p.provider === "google")?.linkedAt || "").toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {linkingStatus?.googleId ? (
                <>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  {linkingStatus?.providers && linkingStatus.providers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink("google")}
                      disabled={unlinkMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={async () => {
                    const authUrl = await getGoogleLoginUrl();
                    if (authUrl) {
                      window.location.href = authUrl;
                    }
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Link className="w-4 h-4 mr-1" />
                  Link Account
                </Button>
              )}
            </div>
          </div>

          {/* Info Message */}
          {linkingStatus?.providers && linkingStatus.providers.length === 1 && (
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You must keep at least one authentication method linked to your account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Linking multiple authentication methods allows you to sign in using any of your connected accounts
          </p>
          <p>
            • Your email address is used to match accounts across different authentication providers
          </p>
          <p>
            • You must maintain at least one active authentication method at all times
          </p>
          <p>
            • Unlinking an account does not delete your data, only removes that login method
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
