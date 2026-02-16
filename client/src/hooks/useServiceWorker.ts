import { useEffect, useState } from 'react'

interface ServiceWorkerStatus {
  isSupported: boolean
  isRegistered: boolean
  isUpdating: boolean
  hasUpdate: boolean
  error?: string
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
  })

  useEffect(() => {
    if (!status.isSupported) {
      console.log('Service Workers not supported')
      return
    }

    const registerServiceWorker = async () => {
      try {
        setStatus((prev) => ({ ...prev, isUpdating: true }))

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('[App] Service Worker registered:', registration)

        setStatus((prev) => ({
          ...prev,
          isRegistered: true,
          isUpdating: false,
        }))

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60000) // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setStatus((prev) => ({
                  ...prev,
                  hasUpdate: true,
                }))

                // Notify user about update
                console.log('[App] Service Worker update available')
              }
            })
          }
        })

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[App] Service Worker controller changed')
          window.location.reload()
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[App] Message from Service Worker:', event.data)

          if (event.data.type === 'BACKGROUND_SYNC') {
            // Handle background sync
            console.log('[App] Background sync triggered')
          }
        })
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error)
        setStatus((prev) => ({
          ...prev,
          error: String(error),
          isUpdating: false,
        }))
      }
    }

    registerServiceWorker()
  }, [status.isSupported])

  const updateServiceWorker = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING',
      })
    }
  }

  const requestBackgroundSync = async (tag: string) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register(tag)
        console.log('[App] Background sync registered:', tag)
      } catch (error) {
        console.error('[App] Background sync registration failed:', error)
      }
    }
  }

  return {
    ...status,
    updateServiceWorker,
    requestBackgroundSync,
  }
}
