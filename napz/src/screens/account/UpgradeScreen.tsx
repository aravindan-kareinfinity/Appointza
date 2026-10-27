import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppWordmark } from '../../components/common/AppBranding';
import { useSubscriptionTier } from '../../context/SubscriptionTierContext';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../../constants/branding';
import { isPremium } from '../../entitlement/PremiumGate';
import { SUBSCRIPTION_TIER_LABELS } from '../../subscription/subscriptionTier';
import {
  RAZORPAY_PACKAGES,
  RAZORPAY_PLAN_ORDER,
  type RazorpayPackageId,
} from '../../billing/razorpayPackages';
import { CheckoutCancelledError, describeBillingError } from '../../billing/razorpayBilling';

const PREMIUM_FEATURES = [
  'Cloud backup and cross-device sync',
  'Google Maps and advanced place search',
  'Advanced radius and custom alarm settings',
  'Destination alarms stay free — Premium is for maps, cloud, and controls',
] as const;

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const {
    subscriptionTier,
    entitlement,
    purchasing,
    purchasePremium,
    refreshSubscriptionTier,
  } = useSubscriptionTier();
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<RazorpayPackageId | null>(null);

  const onPurchase = async (packageId: RazorpayPackageId) => {
    setBuyingId(packageId);
    try {
      await purchasePremium(packageId);
    } catch (e) {
      if (e instanceof CheckoutCancelledError) return;
      Alert.alert('Could not start checkout', describeBillingError(e));
    } finally {
      setBuyingId(null);
    }
  };

  const onRefreshPlan = async () => {
    setRefreshing(true);
    try {
      const tier = await refreshSubscriptionTier();
      Alert.alert(
        'Plan updated',
        tier === 'free'
          ? 'No active Premium plan yet. If you just paid, wait a moment and try again.'
          : `Your plan: ${SUBSCRIPTION_TIER_LABELS[tier]}.`
      );
    } catch (e) {
      Alert.alert('Could not refresh', String((e as Error)?.message ?? e));
    } finally {
      setRefreshing(false);
    }
  };

  const busy = purchasing || refreshing;
  const isFreeTrial = entitlement.productId === 'napz_free_trial_10_days';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={BRAND_NAVY} />
        </TouchableOpacity>
        <AppWordmark size="small" />
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Never miss your stop again</Text>
        <Text style={styles.subtitle}>
          Upgrade for unlimited alarms, no ads, custom sounds, and Google Maps — Napz Premium
          is built for commuters and travelers.
        </Text>

        {isPremium(entitlement) ? (
          <View style={styles.activeCard}>
            <Icon name="checkmark-circle" size={28} color={BRAND_ROYAL} />
            <Text style={styles.activeTitle}>
              {isFreeTrial ? 'Your 10-day free trial is active' : `You have ${SUBSCRIPTION_TIER_LABELS[subscriptionTier]}`}
            </Text>
            {entitlement.expiresAt && subscriptionTier !== 'lifetime' ? (
              <Text style={styles.linkBtnText}>
                {isFreeTrial ? 'Trial ends ' : 'Valid until '}
                {new Date(entitlement.expiresAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.featureCard}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Icon name="checkmark" size={18} color={BRAND_ROYAL} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {RAZORPAY_PLAN_ORDER.map((packageId) => {
          const plan = RAZORPAY_PACKAGES[packageId];
          const isYearly = packageId === 'napz_yearly';
          const isLifetime = packageId === 'napz_lifetime';
          const isBuyingThis = buyingId === packageId;
          const disabled = busy || subscriptionTier === 'lifetime';
          return (
            <TouchableOpacity
              key={packageId}
              style={[
                isYearly ? styles.primaryBtn : styles.secondaryBtn,
                busy && styles.btnDisabled,
              ]}
              onPress={() => onPurchase(packageId)}
              disabled={disabled}
              activeOpacity={0.85}
            >
              {isBuyingThis ? (
                <ActivityIndicator color={isYearly ? '#FFF' : BRAND_ROYAL} />
              ) : (
                <>
                  <Text style={isYearly ? styles.primaryBtnTitle : styles.secondaryBtnTitle}>
                    {plan.title}
                    {isYearly ? ' · best value' : ''}
                  </Text>
                  <Text style={isYearly ? styles.primaryBtnPrice : styles.secondaryBtnPrice}>
                    {plan.priceLabel}
                    {packageId === 'napz_daily' ? ' · 24 hours' : ''}
                    {packageId === 'napz_monthly' ? ' · 1 month' : ''}
                    {isLifetime ? ' one-time' : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={onRefreshPlan}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={styles.restoreText}>
            {refreshing ? 'Refreshing…' : 'I’ve paid — refresh plan'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          1 Day and Lifetime are one-time purchases. 1 Month and 1 Year are prepaid periods in
          this app version. Yearly is recommended (₹33.25/month, save ₹189 vs paying monthly).
          Cloud-saved places are kept if Premium expires; Free stores up to 5 places on this
          device only.
        </Text>
      </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND_NAVY,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  activeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  activeTitle: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  trialCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: BRAND_ROYAL,
  },
  trialTitle: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY },
  trialHint: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginTop: 6 },
  claimBtn: {
    backgroundColor: BRAND_ROYAL,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  claimBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  primaryBtn: {
    backgroundColor: BRAND_ROYAL,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  primaryBtnPrice: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  secondaryBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: BRAND_ROYAL,
  },
  secondaryBtnTitle: { color: BRAND_NAVY, fontSize: 16, fontWeight: '800' },
  secondaryBtnPrice: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  btnDisabled: { opacity: 0.65 },
  restoreBtn: { alignItems: 'center', paddingVertical: 14 },
  restoreText: { color: BRAND_ROYAL, fontSize: 15, fontWeight: '700' },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  note: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginVertical: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  linkBtn: { marginTop: 4 },
  linkBtnText: { color: BRAND_ROYAL, fontSize: 14, fontWeight: '700' },
});
