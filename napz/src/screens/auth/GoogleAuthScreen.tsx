import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppLogoImage } from '../../components/common/AppBranding';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../../constants/branding';
import { GOOGLE_WEB_CLIENT_ID } from '../../constants/googleSignIn';
import { AUTH_ONBOARDING_COMPLETE_KEY, USER_PROFILE_KEY } from '../../constants/authStorage';
import type { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { syncGoogleProfileToFirebase, type UserProfile } from '../../services/firebase/userProfileSync';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GoogleAuth'>;

export default function GoogleAuthScreen() {
  const navigation = useNavigation<Nav>();
  const { refresh: refreshAuthSession } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }, []);

  const goToMain = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  const completeSession = async (profile: UserProfile) => {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    await AsyncStorage.setItem(AUTH_ONBOARDING_COMPLETE_KEY, 'true');
  };

  const signInWithGoogle = async () => {
    try {
      setIsSigningIn(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      if (result.type === 'cancelled') {
        return;
      }

      const userData = result.data.user;
      const profile: UserProfile = {
        name: userData.name || 'Google User',
        email: userData.email,
        mobile: '',
        pincode: '',
        photoUrl: userData.photo ?? null,
        provider: 'google',
      };

      let sessionProfile = profile;
      try {
        sessionProfile = await syncGoogleProfileToFirebase(profile);
      } catch (e) {
        console.warn('Cloud sync after sign-in (non-blocking):', e);
      }

      await completeSession(sessionProfile);
      await refreshAuthSession();
      goToMain();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (err?.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Please wait', 'Google sign-in is already in progress.');
        return;
      }
      if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available on this device.');
        return;
      }
      if (String(err?.code) === '10' || err?.message?.includes('DEVELOPER_ERROR')) {
        Alert.alert(
          'Google Sign-In setup',
          'Add this app’s SHA-1 in Firebase → Project settings → Android app, then download google-services.json and rebuild.',
        );
        return;
      }
      console.error('Google sign-in error:', e);
      Alert.alert('Error', `Google sign-in failed${err?.message ? `: ${err.message}` : '.'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FB" />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.logoRing}>
              <AppLogoImage width={168} height={148} />
            </View>
            <Text style={styles.kicker}>NAPZ</Text>
            <Text style={styles.title}>Arrive, then wake</Text>
            <Text style={styles.subtitle}>
              Sign in to set your stop and get an alarm when you’re close.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.googleBtn, isSigningIn && styles.googleBtnDisabled]}
              onPress={signInWithGoogle}
              disabled={isSigningIn}
              activeOpacity={0.88}
            >
              {isSigningIn ? (
                <ActivityIndicator color={BRAND_ROYAL} />
              ) : (
                <Icon name="logo-google" size={20} color={BRAND_ROYAL} />
              )}
              <Text style={styles.googleBtnText}>
                {isSigningIn ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.footnote}>
              Location is used only to wake you at your destination.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  glowTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 47, 167, 0.10)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(13, 27, 42, 0.06)',
  },
  safe: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  logoRing: {
    width: 196,
    height: 176,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3.2,
    color: BRAND_ROYAL,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_NAVY,
    letterSpacing: -0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    maxWidth: 340,
  },
  actions: {
    paddingBottom: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 47, 167, 0.14)',
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  googleBtnDisabled: {
    opacity: 0.72,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_NAVY,
    letterSpacing: -0.2,
  },
  footnote: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
