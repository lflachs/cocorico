'use client';

import { useEffect, useState } from 'react';
import { Mic, Bell, Volume2, MessageSquare, ChevronDown } from 'lucide-react';
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const PermissionItem = ({
    id,
    icon: Icon,
    iconBg,
    iconColor,
    title,
    description,
    checked,
    onCheckedChange,
    disabled,
    warningMessage,
  }: {
    id: string;
    icon: typeof Bell;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    warningMessage?: string;
  }) => {
    const isExpanded = expandedSection === id;

    return (
      <div className="border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <button
            onClick={() => setExpandedSection(isExpanded ? null : id)}
            className="flex-1 text-left"
          >
            <h4 className="font-semibold text-sm">{title}</h4>
          </button>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform cursor-pointer shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            onClick={() => setExpandedSection(isExpanded ? null : id)}
          />
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            className="shrink-0"
          />
        </div>
        {isExpanded && (
          <div className="mt-3 pl-13 space-y-2">
            <p className="text-sm text-muted-foreground">{description}</p>
            {warningMessage && (
              <p className="text-xs text-orange-600">{warningMessage}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t('permissions.title')}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base pt-1">
            {t('permissions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <PermissionItem
            id="notifications"
            icon={Bell}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            title={t('permissions.notifications.title')}
            description={t('permissions.notifications.description')}
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
            disabled={isProcessing || notificationPermission === 'denied'}
            warningMessage={
              notificationPermission === 'denied'
                ? t('permissions.notifications.blocked')
                : undefined
            }
          />

          <PermissionItem
            id="microphone"
            icon={Mic}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            title={t('permissions.microphone.title')}
            description={t('permissions.microphone.description')}
            checked={microphoneEnabled}
            onCheckedChange={handleMicrophoneToggle}
            disabled={isProcessing}
          />

          <PermissionItem
            id="sound"
            icon={Volume2}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            title={t('permissions.sound.title')}
            description={t('permissions.sound.description')}
            checked={soundEnabled}
            onCheckedChange={handleSoundToggle}
          />

          <PermissionItem
            id="wakeword"
            icon={MessageSquare}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            title={t('permissions.wakeWord.title')}
            description={t('permissions.wakeWord.description')}
            checked={wakeWordEnabled}
            onCheckedChange={handleWakeWordToggle}
            disabled={
              !microphoneEnabled ||
              (typeof window !== 'undefined' &&
                !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
            }
            warningMessage={
              !microphoneEnabled
                ? t('permissions.wakeWord.needsMicrophone')
                : microphoneEnabled &&
                  typeof window !== 'undefined' &&
                  !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
                ? t('permissions.wakeWord.notSupported')
                : undefined
            }
          />
        </div>

        <DialogFooter className="pt-2">
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
