"use client";

import { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Sparkles, Check, AlertCircle, Loader2, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationBell({ className = '' }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default'); // 'default' | 'granted' | 'denied'
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);

      // Check existing subscription
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      }).catch(err => {
        console.warn('Service worker check error:', err);
      });
    }
  }, []);

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const subscribeToPush = async () => {
    if (!supported) {
      showStatus('⚠️ Web Push is not supported on this browser.');
      return;
    }

    setLoading(true);
    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        showStatus('⚠️ Notification permission was not granted.');
        setLoading(false);
        return;
      }

      // 2. Fetch VAPID key
      const keyRes = await fetch('/api/notifications/push/vapid-key');
      const keyData = await keyRes.json();
      const vapidPublicKey = keyData.publicKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured on server.');
      }

      // 3. Subscribe with Service Worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // 4. Save to server
      const saveRes = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to register subscription on server.');
      }

      setIsSubscribed(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      showStatus('✨ Lock-screen notifications successfully enabled!');

    } catch (err) {
      console.error('Push subscription failed:', err);
      showStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/notifications/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }
      setIsSubscribed(false);
      showStatus('Notifications disabled for this device.');
    } catch (err) {
      showStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPush = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Paper Thoughts Sanctuary 🍃',
          body: 'Native lock-screen notifications are active on this device!'
        })
      });
      const data = await res.json();
      if (data.success) {
        showStatus('🚀 Test push notification sent to your device!');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showStatus(`❌ Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {isSubscribed ? (
        <div className="flex items-center gap-2">
          <button
            onClick={testPush}
            disabled={loading}
            title="Send test notification to this device"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif hover:bg-emerald-900 transition-all shadow-sm"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Push Active</span>
          </button>
          
          <button
            onClick={unsubscribeFromPush}
            disabled={loading}
            title="Turn off notifications on this device"
            className="text-[11px] font-serif text-[#F2A98A]/60 hover:text-red-300 transition-colors underline"
          >
            Turn off
          </button>
        </div>
      ) : permission === 'denied' ? (
        <div className="flex items-center gap-1 text-[11px] font-serif text-amber-400/80 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
          <BellOff className="w-3 h-3" />
          <span>Blocked in browser settings</span>
        </div>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#20070e] to-[#c96a42] text-[#FBF7EE] border border-[#F2A98A]/40 text-xs font-serif font-bold hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-[#F2A98A]" />
          )}
          <span>Enable Lock-Screen Notifications</span>
        </button>
      )}

      {/* Floating Status Toast */}
      {statusMessage && (
        <div className="absolute top-full left-0 mt-2 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#120308] border border-[#c96a42] text-[#FBF7EE] text-xs font-serif shadow-2xl animate-fadeIn">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
