import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, NativeModules, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, BUILT_IN_SOUNDS } from '../../constants/theme';
import { ANDROID_APPLICATION_ID } from '../../constants/androidApplicationId';
import {
  canUseBuiltInSound,
  canUseCustomSound,
  resolveAllowedAlarmSound,
} from '../../entitlement/PremiumGate';
import { FreeBannerAd } from '../../ads/FreeBannerAd';
import { initAdMob } from '../../ads/initAdMob';
import { showUpgradePrompt } from '../../entitlement/showUpgradePrompt';
import { usePremiumEntitlement } from '../../entitlement/usePremiumEntitlement';

const { SoundModule } = NativeModules;

const soundAssets: Record<string, string> = {
  classic: `android.resource://${ANDROID_APPLICATION_ID}/raw/classic`,
  radar:   `android.resource://${ANDROID_APPLICATION_ID}/raw/radar`,
  beacon:  `android.resource://${ANDROID_APPLICATION_ID}/raw/beacon`,
  gentle:  `android.resource://${ANDROID_APPLICATION_ID}/raw/gentle`,
  urgent:  `android.resource://${ANDROID_APPLICATION_ID}/raw/urgent`,
};

type SoundsScreenNavigationProp = NativeStackNavigationProp<any>;

export default function SoundsScreen() {
  const navigation = useNavigation<SoundsScreenNavigationProp>();
  const { entitlement, canUseCustomSound: customSoundAllowed } = usePremiumEntitlement();
  const [selectedSound, setSelectedSound] = useState('classic');
  const [customSoundUri, setCustomSoundUri] = useState<string | null>(null);
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initAdMob();
    loadSettings();
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const sound = await AsyncStorage.getItem('alarmSound');
      const uri = await AsyncStorage.getItem('customSoundUri');
      const name = await AsyncStorage.getItem('customSoundName');
      if (sound) setSelectedSound(resolveAllowedAlarmSound(entitlement, sound));
      if (uri) setCustomSoundUri(uri);
      if (name) setCustomSoundName(name);
    } catch {}
  };

  const selectSound = async (soundId: string) => {
    if (!canUseBuiltInSound(entitlement, soundId)) {
      showUpgradePrompt(
        navigation,
        'Free plan includes Classic and Gentle sounds. Upgrade for all built-in sounds and custom audio.'
      );
      return;
    }
    setSelectedSound(soundId);
    await AsyncStorage.setItem('alarmSound', soundId);
  };

  const pickCustomSound = async () => {
    if (!canUseCustomSound(entitlement)) {
      showUpgradePrompt(
        navigation,
        'Custom alarm sounds are a Premium feature. Upgrade to pick audio from your device.'
      );
      return;
    }
    try {
      const [file] = await pick({
        type: [types.audio],
        allowMultiSelection: false,
      });
      if (file.error) {
        Alert.alert('Could not use this file', file.error);
        return;
      }
      const displayName = file.name ?? 'Custom sound';
      const fileNameForCopy = file.name ?? 'custom-alarm.m4a';
      const fileToCopy: {
        uri: string;
        fileName: string;
        convertVirtualFileToType?: string;
      } = { uri: file.uri, fileName: fileNameForCopy };
      if (file.isVirtual && file.convertibleToMimeTypes?.length) {
        const audio =
          file.convertibleToMimeTypes.find(m => m.mimeType.startsWith('audio/')) ??
          file.convertibleToMimeTypes[0];
        fileToCopy.convertVirtualFileToType = audio.mimeType;
      }
      const [copy] = await keepLocalCopy({
        files: [fileToCopy],
        destination: 'cachesDirectory',
      });
      const uri = copy.status === 'success' ? copy.localUri : file.uri;
      if (copy.status === 'error') {
        console.warn('keepLocalCopy failed, using picked uri:', copy.copyError);
      }
      setCustomSoundUri(uri);
      setCustomSoundName(displayName);
      setSelectedSound('custom');
      await AsyncStorage.setItem('alarmSound', 'custom');
      await AsyncStorage.setItem('customSoundUri', uri);
      await AsyncStorage.setItem('customSoundName', displayName);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error('Error picking sound:', err);
      Alert.alert(
        'Could not open file',
        'Pick an audio file from this device, or use a built-in sound.',
      );
    }
  };

  const stopPreview = () => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    if (SoundModule) { try { SoundModule.stopSound(); } catch {} }
    setPlaying(null);
  };

  const previewBuiltIn = async (soundId: string) => {
    // Stop current preview first
    if (SoundModule) {
      try { await SoundModule.stopSound(); } catch {}
    }
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);

    if (playing === soundId) {
      setPlaying(null);
      return;
    }
    setPlaying(soundId);

    try {
      const soundUri = soundAssets[soundId];
      if (soundUri && SoundModule) {
        await SoundModule.playSound(soundUri);
      } else {
        Alert.alert('Error', 'Sound module not available');
        setPlaying(null);
        return;
      }
    } catch (err) {
      console.error('Error playing preview:', err);
      setPlaying(null);
      return;
    }

    playTimeoutRef.current = setTimeout(() => {
      if (SoundModule) { try { SoundModule.stopSound(); } catch {} }
      setPlaying(null);
    }, 3000);
  };

  const previewCustom = async () => {
    if (!customSoundUri) return;

    if (SoundModule) {
      try { await SoundModule.stopSound(); } catch {}
    }
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);

    if (playing === 'custom') {
      setPlaying(null);
      return;
    }
    setPlaying('custom');

    try {
      if (SoundModule) {
        await SoundModule.playSound(customSoundUri);
      }
    } catch (err) {
      console.error('Error playing custom preview:', err);
      setPlaying(null);
      return;
    }

    playTimeoutRef.current = setTimeout(() => {
      if (SoundModule) { try { SoundModule.stopSound(); } catch {} }
      setPlaying(null);
    }, 10000);
  };

  const iconMap: Record<string, string> = {
    'alarm-outline': 'alarm-outline',
    'radio-outline': 'radio-outline',
    'navigate-outline': 'navigate-outline',
    'musical-note-outline': 'musical-note-outline',
    'warning-outline': 'warning-outline',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity testID="sounds-close-btn" onPress={() => { stopPreview(); navigation.goBack(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="close" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alarm Sound</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.adSlot}>
        <FreeBannerAd />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionLabel}>BUILT-IN SOUNDS</Text>
        <View style={styles.soundsCard}>
          {BUILT_IN_SOUNDS.map((sound, idx) => {
            const locked = !canUseBuiltInSound(entitlement, sound.id);
            return (
              <TouchableOpacity
                key={sound.id}
                testID={`sound-${sound.id}`}
                style={[
                  styles.soundItem,
                  idx < BUILT_IN_SOUNDS.length - 1 && styles.soundItemBorder,
                  selectedSound === sound.id && styles.soundItemActive,
                  locked && styles.soundItemLocked,
                ]}
                onPress={() => selectSound(sound.id)}
              >
                <View style={styles.soundItemLeft}>
                  <View style={[styles.soundIconWrap, selectedSound === sound.id && styles.soundIconWrapActive]}>
                    <Icon
                      name={locked ? 'lock-closed' : iconMap[sound.icon] || 'musical-note'}
                      size={18}
                      color={selectedSound === sound.id ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <Text style={[styles.soundItemName, selectedSound === sound.id && styles.soundItemNameActive]}>
                    {sound.name}
                    {locked ? ' · Premium' : ''}
                  </Text>
                </View>
                <View style={styles.soundItemRight}>
                  {!locked ? (
                    <TouchableOpacity
                      testID={`preview-${sound.id}`}
                      onPress={() => previewBuiltIn(sound.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={playing === sound.id ? 'stop-circle' : 'play-circle'}
                        size={28}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  ) : null}
                  {selectedSound === sound.id && (
                    <Icon name="checkmark-circle" size={22} color={COLORS.primary} style={{ marginLeft: 8 }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CUSTOM SOUND</Text>
        {!customSoundAllowed ? (
          <Text style={styles.premiumHint}>
            Custom alarm sounds are included with Napz Premium.
          </Text>
        ) : null}
        <TouchableOpacity
          testID="pick-custom-sound-btn"
          style={[styles.customPicker, !customSoundAllowed && styles.customPickerLocked]}
          onPress={pickCustomSound}
        >
          <View style={styles.customPickerLeft}>
            <View style={styles.customIconWrap}>
              <Icon
                name={customSoundAllowed ? 'folder-open-outline' : 'lock-closed'}
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.customPickerText}>
              {customSoundAllowed
                ? customSoundName || 'Pick audio from device...'
                : 'Premium — pick audio from device'}
            </Text>
          </View>
          <Icon
            name={customSoundAllowed ? 'add-circle-outline' : 'chevron-forward'}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {customSoundUri && customSoundAllowed && (
          <View style={styles.soundsCard}>
            <TouchableOpacity
              testID="sound-custom"
              style={[styles.soundItem, selectedSound === 'custom' && styles.soundItemActive]}
              onPress={() => selectSound('custom')}
            >
              <View style={styles.soundItemLeft}>
                <View style={[styles.soundIconWrap, selectedSound === 'custom' && styles.soundIconWrapActive]}>
                  <Icon name="musical-notes" size={18} color={selectedSound === 'custom' ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <Text
                  style={[styles.soundItemName, selectedSound === 'custom' && styles.soundItemNameActive]}
                  numberOfLines={1}
                >
                  {customSoundName}
                </Text>
              </View>
              <View style={styles.soundItemRight}>
                <TouchableOpacity
                  testID="preview-custom"
                  onPress={previewCustom}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={playing === 'custom' ? 'stop-circle' : 'play-circle'}
                    size={28}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                {selectedSound === 'custom' && (
                  <Icon name="checkmark-circle" size={22} color={COLORS.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  adSlot: { paddingTop: 8, alignItems: 'center', backgroundColor: COLORS.background },
  list: { flex: 1 },
  listContent: { padding: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: COLORS.textSecondary,
    letterSpacing: 1.5, marginBottom: 10,
  },
  soundsCard: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  soundItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14,
  },
  soundItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  soundItemActive: { backgroundColor: 'rgba(0,47,167,0.04)' },
  soundItemLocked: { opacity: 0.72 },
  premiumHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  soundItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  soundIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  soundIconWrapActive: { backgroundColor: 'rgba(0,47,167,0.1)' },
  soundItemName: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  soundItemNameActive: { fontWeight: '700', color: COLORS.primary },
  soundItemRight: { flexDirection: 'row', alignItems: 'center' },
  customPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    marginBottom: 12,
  },
  customPickerLocked: { borderStyle: 'solid', backgroundColor: COLORS.background },
  customPickerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  customIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,47,167,0.08)', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  customPickerText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
});
