import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../constants/branding';
import {
  ACTIVE_TRACKING_DISCLOSURE_BODY,
  ACTIVE_TRACKING_DISCLOSURE_TITLE,
  BACKGROUND_DISCLOSURE_BODY,
  BACKGROUND_DISCLOSURE_FOOTER,
  BACKGROUND_DISCLOSURE_TITLE,
  DISCLOSURE_FOOTER,
  FOREGROUND_DISCLOSURE_BODY,
  FOREGROUND_DISCLOSURE_TITLE,
  ENABLE_DEVICE_LOCATION_BODY,
  ENABLE_DEVICE_LOCATION_FOOTER,
  ENABLE_DEVICE_LOCATION_TITLE,
  TURN_ON_LOCATION_BODY,
  TURN_ON_LOCATION_FOOTER,
  TURN_ON_LOCATION_TITLE,
} from './LocationDisclosure';
import {
  isDeviceLocationEnabled,
  openDeviceLocationSettings,
} from './deviceLocationSettings';
import {
  hasAcceptedBackgroundLocationDisclosure,
  hasAcceptedLocationDisclosure,
  markBackgroundLocationDisclosureAccepted,
  markLocationDisclosureAccepted,
} from '../location/locationPermissionStorage';
import {
  isBackgroundLocationGranted,
  isForegroundLocationGranted,
  requestBackgroundLocationSystem,
  requestForegroundLocationSystem,
  type LocationPermissionOutcome,
} from '../location/LocationPermission';

export type LocationPermissionFlowMode =
  | 'foreground_only'
  | 'startup_foreground'
  | 'tracking';

/**
 * Steps:
 * - disclosure: full usage disclosure (Agree records consent)
 * - turn_on_location: in-app prompt immediately before Android FINE permission
 * - enable_device_location: device Location switch off — open Android Location settings
 * - background_intro: background disclosure before BACKGROUND permission
 * - active_tracking: notice after permissions, before native LocationManager GPS
 */
type FlowStep =
  | 'disclosure'
  | 'turn_on_location'
  | 'enable_device_location'
  | 'background_intro'
  | 'active_tracking';

type Props = {
  visible: boolean;
  mode: LocationPermissionFlowMode;
  onComplete: (result: LocationPermissionOutcome) => void;
};

export function LocationPermissionFlowModal({ visible, mode, onComplete }: Props) {
  const [step, setStep] = useState<FlowStep>('disclosure');
  const [busy, setBusy] = useState(false);

  const needsBackground = mode === 'tracking';
  const isStartupForeground = mode === 'startup_foreground';
  // Disclosure step is always full Location Access (immediately before FINE).
  const disclosure = {
    title: FOREGROUND_DISCLOSURE_TITLE,
    body: FOREGROUND_DISCLOSURE_BODY,
    footer: DISCLOSURE_FOOTER,
  };

  const finish = useCallback(
    async (cancelled: boolean) => {
      const foregroundGranted = await isForegroundLocationGranted();
      const backgroundGranted = await isBackgroundLocationGranted();
      onComplete({
        foregroundGranted,
        backgroundGranted: needsBackground ? backgroundGranted : true,
        cancelled,
      });
    },
    [needsBackground, onComplete]
  );

  const resolveInitialStep = useCallback(async () => {
    const fg = await isForegroundLocationGranted();
    const bg = needsBackground ? await isBackgroundLocationGranted() : true;
    const fgDisclosed = await hasAcceptedLocationDisclosure();
    const bgDisclosed = needsBackground
      ? await hasAcceptedBackgroundLocationDisclosure()
      : true;

    if (isStartupForeground) {
      setStep('disclosure');
      return;
    }

    // foreground_only with !fgDisclosed — full disclosure (handled in provider when already disclosed).
    // Always show Napz Location Access immediately before any runtime permission.
    if (!needsBackground) {
      setStep('disclosure');
      return;
    }

    // Tracking must obtain foreground permission first. Even when launch consent
    // was stored earlier, this disclosure immediately precedes the FINE prompt.
    if (!fgDisclosed || !fg) {
      setStep('disclosure');
      return;
    }

    if (!bgDisclosed || !bg) {
      setStep('background_intro');
      return;
    }

    setStep('active_tracking');
  }, [needsBackground, isStartupForeground]);

  useEffect(() => {
    if (!visible) {
      setStep('disclosure');
      setBusy(false);
      return;
    }
    setBusy(false);
    resolveInitialStep();
  }, [visible, resolveInitialStep]);

  const handleNotNow = () => {
    if (Platform.OS === 'android') {
      console.log('LOCATION_AUDIT NotNow — no consent recorded');
    }
    finish(true);
  };

  const continueAfterForegroundGranted = async () => {
    if (!needsBackground) {
      onComplete({ foregroundGranted: true, backgroundGranted: true, cancelled: false });
      return;
    }

    const bg = await isBackgroundLocationGranted();
    const bgDisclosed = await hasAcceptedBackgroundLocationDisclosure();
    if (bg && bgDisclosed) {
      setStep('active_tracking');
      return;
    }
    setStep('background_intro');
  };

  const advanceAfterForegroundReady = useCallback(async () => {
    const deviceOn = await isDeviceLocationEnabled();
    if (!deviceOn) {
      setStep('enable_device_location');
      return;
    }
    if (isStartupForeground) {
      onComplete({
        foregroundGranted: true,
        backgroundGranted: await isBackgroundLocationGranted(),
        cancelled: false,
      });
      return;
    }
    await continueAfterForegroundGranted();
  }, [isStartupForeground, onComplete, needsBackground]);

  useEffect(() => {
    if (!visible || step !== 'enable_device_location') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      isDeviceLocationEnabled().then((on) => {
        if (on) {
          advanceAfterForegroundReady();
        }
      });
    });
    return () => sub.remove();
  }, [visible, step, advanceAfterForegroundReady]);

  /** Disclosure Agree → in-app Turn on location (then Android permission). */
  const handleDisclosureContinue = async () => {
    if (Platform.OS === 'android') {
      console.log('LOCATION_AUDIT AgreeAndContinue — recording foreground disclosure consent');
    }
    await markLocationDisclosureAccepted();

    const fg = await isForegroundLocationGranted();
    if (fg) {
      await advanceAfterForegroundReady();
      return;
    }

    setStep('turn_on_location');
  };

  const handleTurnOnLocationContinue = async () => {
    if (Platform.OS === 'android') {
      console.log('LOCATION_AUDIT TurnOnLocation — requesting Android foreground permission');
    }
    setBusy(true);
    const granted = await requestForegroundLocationSystem();
    setBusy(false);
    if (!granted) {
      finish(true);
      return;
    }

    await advanceAfterForegroundReady();
  };

  const handleEnableDeviceLocationContinue = () => {
    if (Platform.OS === 'android') {
      console.log('LOCATION_AUDIT OpenDeviceLocationSettings — from enable_device_location step');
    }
    openDeviceLocationSettings();
  };

  const handleBackgroundContinue = async () => {
    await markBackgroundLocationDisclosureAccepted();
    setBusy(true);
    const granted = await requestBackgroundLocationSystem();
    setBusy(false);
    if (!granted) {
      finish(true);
      return;
    }
    setStep('active_tracking');
  };

  const handleActiveTrackingContinue = async () => {
    const fg = await isForegroundLocationGranted();
    const bg = needsBackground ? await isBackgroundLocationGranted() : true;
    onComplete({
      foregroundGranted: fg,
      backgroundGranted: needsBackground ? bg : true,
      cancelled: false,
    });
  };

  const fullScreenStartup =
    visible &&
    isStartupForeground &&
    (step === 'disclosure' ||
      step === 'turn_on_location' ||
      step === 'enable_device_location');

  const primaryLabel = (() => {
    if (busy) return 'Please wait…';
    if (step === 'turn_on_location') return 'Turn on location';
    if (step === 'enable_device_location') return 'Open Location Settings';
    return 'Agree & Continue';
  })();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={!fullScreenStartup}
      statusBarTranslucent
      onRequestClose={() => {
        // Android back / dismiss is NOT consent — same as Not Now.
        handleNotNow();
      }}
    >
      <View style={fullScreenStartup ? styles.fullScreenBackdrop : styles.backdrop}>
        {!fullScreenStartup && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleNotNow}
            disabled={busy}
          />
        )}
        <View style={fullScreenStartup ? styles.fullScreenCard : styles.card}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {step === 'disclosure' && (
              <>
                <View style={styles.iconCircle}>
                  <Icon name="location" size={28} color={BRAND_ROYAL} />
                </View>
                <Text style={styles.title}>{disclosure.title}</Text>
                {disclosure.body.map((paragraph, i) => (
                  <Text key={i} style={styles.body}>
                    {paragraph}
                  </Text>
                ))}
                <Text style={styles.bodyMuted}>{disclosure.footer}</Text>
              </>
            )}

            {step === 'turn_on_location' && (
              <>
                <View style={styles.iconCircle}>
                  <Icon name="navigate" size={28} color={BRAND_ROYAL} />
                </View>
                <Text style={styles.title}>{TURN_ON_LOCATION_TITLE}</Text>
                {TURN_ON_LOCATION_BODY.map((paragraph, i) => (
                  <Text key={i} style={styles.body}>
                    {paragraph}
                  </Text>
                ))}
                <Text style={styles.bodyMuted}>{TURN_ON_LOCATION_FOOTER}</Text>
              </>
            )}

            {step === 'enable_device_location' && (
              <>
                <View style={styles.iconCircle}>
                  <Icon name="settings-outline" size={28} color={BRAND_ROYAL} />
                </View>
                <Text style={styles.title}>{ENABLE_DEVICE_LOCATION_TITLE}</Text>
                {ENABLE_DEVICE_LOCATION_BODY.map((paragraph, i) => (
                  <Text key={i} style={styles.body}>
                    {paragraph}
                  </Text>
                ))}
                <Text style={styles.bodyMuted}>{ENABLE_DEVICE_LOCATION_FOOTER}</Text>
              </>
            )}

            {step === 'background_intro' && (
              <>
                <View style={styles.iconCircle}>
                  <Icon name="shield-checkmark" size={28} color={BRAND_ROYAL} />
                </View>
                <Text style={styles.title}>{BACKGROUND_DISCLOSURE_TITLE}</Text>
                {BACKGROUND_DISCLOSURE_BODY.map((paragraph, i) => (
                  <Text key={i} style={styles.body}>
                    {paragraph}
                  </Text>
                ))}
                <Text style={styles.bodyMuted}>{BACKGROUND_DISCLOSURE_FOOTER}</Text>
              </>
            )}

            {step === 'active_tracking' && (
              <>
                <View style={styles.iconCircle}>
                  <Icon name="navigate-circle" size={28} color={BRAND_ROYAL} />
                </View>
                <Text style={styles.title}>{ACTIVE_TRACKING_DISCLOSURE_TITLE}</Text>
                <Text style={styles.body}>{ACTIVE_TRACKING_DISCLOSURE_BODY}</Text>
              </>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.actionHalf]}
              onPress={handleNotNow}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.actionHalf, busy && styles.primaryBtnDisabled]}
              onPress={() => {
                if (busy) return;
                if (step === 'disclosure') handleDisclosureContinue();
                else if (step === 'turn_on_location') handleTurnOnLocationContinue();
                else if (step === 'enable_device_location') handleEnableDeviceLocationContinue();
                else if (step === 'background_intro') handleBackgroundContinue();
                else if (step === 'active_tracking') handleActiveTrackingContinue();
              }}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenBackdrop: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  fullScreenCard: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    paddingTop: 48,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '72%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8EEF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_NAVY,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textPrimary,
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  bodyMuted: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    alignSelf: 'stretch',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actionHalf: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
