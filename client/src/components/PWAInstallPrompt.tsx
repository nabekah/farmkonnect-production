import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

/**
 * PWA Installation Prompt Component
 * Shows a prompt to install the app as a Progressive Web App
 */
export function PWAInstallPrompt() {
  const { canInstall, isInstalled, install, dismiss } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (canInstall && !isInstalled) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  if (!showPrompt || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await install();
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900">Install FarmKonnect</h3>
            <p className="text-sm text-gray-600 mt-1">
              Install the app for faster access and offline support
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Install
        </Button>
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="outline"
          className="flex-1"
        >
          Not Now
        </Button>
      </div>
    </div>
  );
}
