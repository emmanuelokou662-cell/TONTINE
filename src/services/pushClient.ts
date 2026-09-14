import { apiFetch } from './apiClient';

/**
 * Convertit une clé VAPID base64 en Uint8Array pour l'API Push W3C
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Demande la permission et abonne le navigateur aux notifications push Web (RF-88, RF-89)
 */
export const registerPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Ce navigateur ne supporte pas les notifications push Web.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission de notification refusée par l\'utilisateur.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidRes = await apiFetch<{ publicKey: string }>('/notifications/vapid-public-key');

    if (!vapidRes.success || !vapidRes.data?.publicKey) {
      console.warn('Impossible de récupérer la clé publique VAPID du serveur.');
      return false;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidRes.data.publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any
    });

    // Envoyer l'objet d'abonnement au serveur pour sauvegarde en base
    const saveRes = await apiFetch('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });

    return saveRes.success;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement aux notifications push :', error);
    return false;
  }
};
