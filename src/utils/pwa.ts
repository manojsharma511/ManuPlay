export function registerPwaServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }
}

export function listenToOnlineStatus(onStatusChange: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
