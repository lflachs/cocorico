'use client';

import { useEffect, useState } from 'react';
import { Mic, Bell, Volume2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { requestNotificationPermission } from '@/lib/notifications';
import { useLanguage } from '@/providers/LanguageProvider';

/**
 * Permission Manager
 * Shows a modal dialog to configure app permissions (notifications, microphone, sound & wake word)
 */
export function PermissionManager({
  open,
  onOpenChange
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const { t } = useLanguage();
  const [internalShowDialog, setInternalShowDialog] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const showDialog = open !== undefined ? open : internalShowDialog;
  const setShowDialog = onOpenChange || setInternalShowDialog;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');

  useEffect(() => {
    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Only auto-show if not being controlled externally
    if (open === undefined) {
      checkAndShowDialog();
    }
    // Check if sound is enabled in localStorage
    const soundPref = localStorage.getItem('soundEnabled');
    if (soundPref !== null) {
      setSoundEnabled(soundPref === 'true');
    }
    // Check if wake word is enabled in localStorage
    const wakeWordPref = localStorage.getItem('voiceAssistantWakeWordEnabled');
    if (wakeWordPref !== null) {
      setWakeWordEnabled(wakeWordPref === 'true');
    }
  }, [open]);

  async function checkAndShowDialog() {
    // Check if user has already dismissed or completed setup
    const dismissed = localStorage.getItem('permissionsDialogDismissed');
    if (dismissed) {
      return;
    }

    let shouldShow = false;

    // Check if we need to ask for microphone
    if ('permissions' in navigator) {
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (micPermission.state === 'prompt') {
          shouldShow = true;
        }
      } catch (error) {
        // permissions API not fully supported, that's ok
      }
    }

    // Check if we need to ask for notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        shouldShow = true;
      }
    }

    if (shouldShow) {
      setInternalShowDialog(true);
    }
  }

  async function handleNotificationToggle(checked: boolean) {
    if (checked && notificationPermission === 'default') {
      setIsProcessing(true);
      try {
        const permission = await requestNotificationPermission();
        setNotificationsEnabled(permission === 'granted');
        setNotificationPermission(permission);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setNotificationsEnabled(checked);
    }
  }

  async function handleMicrophoneToggle(checked: boolean) {
    if (checked) {
      setIsProcessing(true);
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop the stream - we just needed to get permission
        stream.getTracks().forEach(track => track.stop());
        setMicrophoneEnabled(true);
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicrophoneEnabled(false);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setMicrophoneEnabled(checked);
    }
  }

  function handleSoundToggle(checked: boolean) {
    setSoundEnabled(checked);
    localStorage.setItem('soundEnabled', checked.toString());
  }

  function handleWakeWordToggle(checked: boolean) {
    setWakeWordEnabled(checked);
    localStorage.setItem('voiceAssistantWakeWordEnabled', checked.toString());
  }

  function handleContinue() {
    setShowDialog(false);
    localStorage.setItem('permissionsDialogDismissed', new Date().toISOString());
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl">{t('permissions.title')}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t('permissions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notifications */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 shrink-0">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base">{t('permissions.notifications.title')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('permissions.notifications.description')}
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={isProcessing || notificationPermission === 'denied'}
                  className="ml-4"
                />
              </div>
              {notificationPermission === 'denied' && (
                <p className="text-xs text-orange-600">
                  {t('permissions.notifications.blocked')}
                </p>
              )}
            </div>
          </div>

          {/* Microphone */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 shrink-0">
              <Mic className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base">{t('permissions.microphone.title')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('permissions.microphone.description')}
                  </p>
                </div>
                <Switch
                  checked={microphoneEnabled}
                  onCheckedChange={handleMicrophoneToggle}
                  disabled={isProcessing}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 shrink-0">
              <Volume2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base">{t('permissions.sound.title')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('permissions.sound.description')}
                  </p>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {/* Wake Word Detection */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 shrink-0">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-base">{t('permissions.wakeWord.title')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('permissions.wakeWord.description')}
                  </p>
                </div>
                <Switch
                  checked={wakeWordEnabled}
                  onCheckedChange={handleWakeWordToggle}
                  disabled={!microphoneEnabled || (typeof window !== 'undefined' && !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))}
                  className="ml-4"
                />
              </div>
              {!microphoneEnabled && (
                <p className="text-xs text-orange-600">
                  {t('permissions.wakeWord.needsMicrophone')}
                </p>
              )}
              {microphoneEnabled && typeof window !== 'undefined' && !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
                <p className="text-xs text-orange-600">
                  {t('permissions.wakeWord.notSupported')}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto"
            disabled={isProcessing}
          >
            {t('permissions.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
