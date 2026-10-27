import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppLogoImage, AppWordmark } from '../../components/common/AppBranding';
import { COLORS, SOUND_NAMES } from '../../constants/theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../../constants/branding';
import { USER_PROFILE_KEY } from '../../constants/authStorage';
import { useSubscriptionTier } from '../../context/SubscriptionTierContext';
import { isPremium, maxSavedPlaces } from '../../entitlement/PremiumGate';
import { activePlanLabel } from '../../subscription/subscriptionTier';
import type { AccountStackParamList } from '../../types/navigation';

type StoredProfile = {
  name: string;
  email: string;
  photoUrl?: string | null;
  provider?: string;
};

export default function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [selectedSound, setSelectedSound] = useState('classic');
  const { subscriptionTier, entitlement, ensureSubscriptionCurrent, claimFreeTrial } =
    useSubscriptionTier();
  const [claiming, setClaiming] = useState(false);
  const planLabel = activePlanLabel(
    entitlement.productId ?? entitlement.planId,
    subscriptionTier
  );
  const canClaimTrial = !isPremium(entitlement) && entitlement.freeTrialUsed !== true;
  const subscriptionSubtitle = isPremium(entitlement)
    ? `${planLabel} · ${maxSavedPlaces(entitlement)} cloud places`
    : `${planLabel} · 5 places on this device`;

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (!raw) {
        setProfile(null);
      } else {
        setProfile(JSON.parse(raw) as StoredProfile);
      }
    } catch {
      setProfile(null);
    }
    try {
      const sound = await AsyncStorage.getItem('alarmSound');
      if (sound) setSelectedSound(sound);
    } catch {
      /* keep default */
    }
    try {
      await ensureSubscriptionCurrent();
    } catch {
      /* keep local plan */
    }
  }, [ensureSubscriptionCurrent]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const menuRow = (
    icon: string,
    label: string,
    onPress: () => void,
    subtitle?: string
  ) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.85}>
      <Icon name={icon} size={20} color={COLORS.primary} />
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBand}>
          <View style={styles.headerGlow} />
          <View style={styles.brandRow}>
            <AppLogoImage width={36} height={36} />
            <AppWordmark size="small" />
          </View>
          <View style={styles.profileRow}>
            <View style={styles.avatarRing}>
              {profile?.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Icon name="person" size={28} color={BRAND_ROYAL} />
                </View>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.name?.trim() || 'Account'}
              </Text>
              {profile?.email ? (
                <Text style={styles.profileEmail} numberOfLines={1}>{profile.email}</Text>
              ) : null}
              <Text style={styles.profilePlan} numberOfLines={1}>
                {planLabel}
              </Text>
            </View>
          </View>
        </View>

        {canClaimTrial ? (
          <View style={styles.claimCard}>
            <Text style={styles.claimTitle}>10 days free trial</Text>
            <Text style={styles.claimHint}>Claim once on this account. Premium unlocks after you tap Claim.</Text>
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={async () => {
                setClaiming(true);
                try {
                  await claimFreeTrial();
                  Alert.alert('Trial started', 'Your 10-day free trial is active.');
                } catch (e) {
                  Alert.alert('Free trial', String((e as Error)?.message ?? e));
                } finally {
                  setClaiming(false);
                }
              }}
              disabled={claiming}
              activeOpacity={0.85}
            >
              {claiming ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.claimBtnText}>Claim</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {menuRow('person-outline', 'About', () => navigation.navigate('About'), 'Name, mobile, PIN')}
        {menuRow(
          'card-outline',
          'Subscription',
          () => navigation.navigate('Subscription'),
          subscriptionSubtitle
        )}
        {menuRow(
          'musical-notes',
          'Alarm sound',
          () => navigation.navigate('Sounds'),
          SOUND_NAMES[selectedSound] || 'Classic Alarm'
        )}
        {menuRow('document-text-outline', 'Privacy Policy', () => navigation.navigate('PrivacyPolicy'))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  headerBand: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,47,167,0.08)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: BRAND_ROYAL,
    backgroundColor: COLORS.surface,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  avatarFallback: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: 'rgba(0,47,167,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND_NAVY,
    marginBottom: 3,
  },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  profilePlan: {
    fontSize: 13,
    color: BRAND_ROYAL,
    fontWeight: '700',
    marginTop: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  claimCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BRAND_ROYAL,
    marginBottom: 16,
  },
  claimTitle: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY },
  claimHint: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginTop: 6 },
  claimBtn: {
    backgroundColor: BRAND_ROYAL,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  claimBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
