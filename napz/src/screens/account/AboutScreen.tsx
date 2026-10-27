import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppWordmark } from '../../components/common/AppBranding';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../../constants/branding';
import { USER_PROFILE_KEY } from '../../constants/authStorage';
import { useAuth } from '../../context/AuthContext';
import { resetToGoogleAuth } from '../../navigation/rootNavigationRef';
import {
  deleteCurrentUserAccount,
  signOutAndClearLocalData,
} from '../../services/firebase/deleteAccount';
import {
  firestoreErrorMessage,
  saveProfileContactToFirebase,
  type UserProfile,
} from '../../services/firebase/userProfileSync';
import type { NapzSubscriptionTier } from '../../subscription/subscriptionTier';

type StoredProfile = {
  name: string;
  email: string;
  mobile?: string;
  pincode?: string;
  photoUrl?: string | null;
  provider?: string;
  subscriptionTier?: NapzSubscriptionTier;
};

export default function AboutScreen() {
  const navigation = useNavigation();
  const { refresh: refreshAuthSession } = useAuth();
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (!raw) {
        setProfile(null);
        return;
      }
      const parsed = JSON.parse(raw) as StoredProfile;
      setProfile(parsed);
      setMobile((parsed.mobile || '').replace(/\D/g, '').slice(0, 10));
      setPincode((parsed.pincode || '').replace(/\D/g, '').slice(0, 6));
    } catch {
      setProfile(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const logout = () => {
    if (signingOut || deleting) return;
    Alert.alert(
      'Sign out',
      'This removes your profile, saved places, plan, and trip data from this phone. Saved places and Premium stay on your account and come back after you sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOutAndClearLocalData();
              await refreshAuthSession();
              resetToGoogleAuth();
            } catch {
              Alert.alert('Sign out', 'Could not sign out. Try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Napz account and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCurrentUserAccount();
              await refreshAuthSession();
              resetToGoogleAuth();
            } catch (e) {
              const err = e as { message?: string };
              Alert.alert('Could not delete account', err?.message || 'Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const saveContact = async () => {
    if (!profile) return;
    const mobileDigits = mobile.replace(/\D/g, '');
    const pinDigits = pincode.replace(/\D/g, '');
    if (mobileDigits.length !== 10) {
      Alert.alert('Mobile number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    if (pinDigits.length !== 6) {
      Alert.alert('PIN code', 'Enter a valid 6-digit PIN code.');
      return;
    }

    const next: StoredProfile = { ...profile, mobile: mobileDigits, pincode: pinDigits };
    const firebaseProfile: UserProfile = {
      name: next.name,
      email: next.email,
      mobile: mobileDigits,
      pincode: pinDigits,
      photoUrl: next.photoUrl ?? null,
      provider: next.provider === 'manual' ? 'manual' : 'google',
    };

    setSaving(true);
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(next));
      setProfile(next);
      try {
        await saveProfileContactToFirebase(firebaseProfile);
        Alert.alert('Saved', 'Your details were saved.');
      } catch (e) {
        Alert.alert(
          'Saved on this device',
          `Cloud save had an issue: ${firestoreErrorMessage(e)}`,
        );
      }
    } catch {
      Alert.alert('Error', 'Could not save your details. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={BRAND_NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBand}>
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
                <AppWordmark size="small" />
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.name?.trim() || 'Your profile'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{profile?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile</Text>
            <View style={styles.inputContainer}>
              <Icon name="call-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile"
                placeholderTextColor={COLORS.textSecondary}
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PIN code</Text>
            <View style={styles.inputContainer}>
              <Icon name="map-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6-digit PIN"
                placeholderTextColor={COLORS.textSecondary}
                value={pincode}
                onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveContact}
            activeOpacity={0.85}
            disabled={saving || !profile}
          >
            <Icon name="save-outline" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save details'}</Text>
          </TouchableOpacity>

          <Text style={styles.dangerHint}>Account</Text>
          <TouchableOpacity
            style={[styles.logoutBtn, (signingOut || deleting) && styles.saveBtnDisabled]}
            onPress={logout}
            activeOpacity={0.85}
            disabled={signingOut || deleting}
          >
            <Text style={styles.logoutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
            onPress={confirmDeleteAccount}
            activeOpacity={0.85}
            disabled={deleting || signingOut}
          >
            <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {(signingOut || deleting) ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={BRAND_ROYAL} />
          <Text style={styles.busyText}>
            {signingOut ? 'Signing out…' : 'Deleting account…'}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: BRAND_NAVY },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  headerBand: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: BRAND_ROYAL,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  avatarFallback: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: 'rgba(0,47,167,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, minWidth: 0, gap: 6 },
  profileName: { fontSize: 20, fontWeight: '800', color: BRAND_NAVY },
  field: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  valueBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
    paddingVertical: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_ROYAL,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  dangerHint: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 32,
    marginBottom: 10,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  deleteBtn: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 14,
  },
  deleteBtnDisabled: { opacity: 0.7 },
  deleteText: { fontSize: 14, fontWeight: '600', color: COLORS.alarm },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  busyText: { fontSize: 15, fontWeight: '700', color: BRAND_NAVY },
});
