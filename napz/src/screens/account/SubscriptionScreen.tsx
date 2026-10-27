import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppWordmark } from '../../components/common/AppBranding';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY, BRAND_ROYAL } from '../../constants/branding';
import { useSubscriptionTier } from '../../context/SubscriptionTierContext';
import { activePlanLabel, FREE_TRIAL_PLAN_ID } from '../../subscription/subscriptionTier';
import {
  RAZORPAY_PACKAGES,
  RAZORPAY_PLAN_ORDER,
  type RazorpayPackageId,
} from '../../billing/razorpayPackages';
import { CheckoutCancelledError, describeBillingError } from '../../billing/razorpayBilling';
import type { AccountStackParamList } from '../../types/navigation';

const PREMIUM_FEATURES = [
  'Cloud backup and cross-device sync',
  'Google Maps and advanced place search',
  'Advanced radius and custom alarm settings',
  'Destination alarms stay free on every plan',
] as const;

export default function SubscriptionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const {
    subscriptionTier,
    entitlement,
    purchasing,
    ensureSubscriptionCurrent,
    purchasePremium,
  } = useSubscriptionTier();
  const isFreeTrial =
    (entitlement.productId ?? entitlement.planId) === FREE_TRIAL_PLAN_ID;
  const [buyingId, setBuyingId] = useState<RazorpayPackageId | null>(null);

  useFocusEffect(
    useCallback(() => {
      void ensureSubscriptionCurrent();
    }, [ensureSubscriptionCurrent])
  );

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

  const busy = purchasing;
  const currentPlanId = entitlement.productId;

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
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>
          Destination alarms stay free. Premium adds cloud-saved places, Google Maps, and
          advanced controls. Yearly is the best value for regular users.
        </Text>

        <View style={styles.planCard}>
          <Text style={styles.sectionLabel}>Your plan</Text>
          <Text style={styles.planCurrent}>
            {activePlanLabel(entitlement.productId ?? entitlement.planId, subscriptionTier)}
          </Text>
          {entitlement.expiresAt && subscriptionTier !== 'lifetime' ? (
            <Text style={styles.expiry}>
              {isFreeTrial ? 'Trial ends ' : 'Valid until '}
              {new Date(entitlement.expiresAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.sectionLabel}>Included with Premium</Text>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Icon name="checkmark" size={16} color={BRAND_ROYAL} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.catalogTitle}>All plans</Text>

        {RAZORPAY_PLAN_ORDER.map((packageId) => {
          const plan = RAZORPAY_PACKAGES[packageId];
          const isCurrent = currentPlanId === packageId;
          const isBuyingThis = buyingId === packageId;
          const disabled = busy || subscriptionTier === 'lifetime';
          const featured = plan.featured === true;
          return (
            <View
              key={packageId}
              style={[
                styles.catalogCard,
                isCurrent && styles.catalogCardCurrent,
                featured && styles.catalogCardFeatured,
              ]}
            >
              <View style={styles.planHead}>
                <View style={styles.planHeadText}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                </View>
                <Text style={styles.planPrice}>{plan.priceLabel}</Text>
              </View>
              {featured ? <Text style={styles.currentBadge}>Recommended</Text> : null}
              {isCurrent ? <Text style={styles.currentBadge}>Current plan</Text> : null}
              <Text style={styles.duration}>{plan.durationLabel}</Text>
              <Text style={styles.billing}>{plan.billingNote}</Text>
              <Text style={styles.billing}>Up to {plan.savedPlaceLimit} cloud-saved locations</Text>
              <Text style={styles.detail}>{plan.detail}</Text>
              <TouchableOpacity
                style={[styles.buyBtn, disabled && styles.btnDisabled]}
                onPress={() => onPurchase(packageId)}
                disabled={disabled}
                activeOpacity={0.85}
              >
                {isBuyingThis ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buyText}>
                    {subscriptionTier === 'lifetime'
                      ? 'Lifetime already active'
                      : isCurrent
                        ? `Extend ${plan.title}`
                        : `Buy ${plan.title}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
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
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planCurrent: { fontSize: 22, fontWeight: '800', color: BRAND_NAVY },
  planMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  expiry: { fontSize: 14, color: BRAND_ROYAL, fontWeight: '700', marginTop: 8 },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  catalogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_NAVY,
    marginBottom: 12,
    marginTop: 4,
  },
  catalogCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  catalogCardCurrent: {
    borderColor: BRAND_ROYAL,
    borderWidth: 1.5,
  },
  catalogCardFeatured: {
    borderColor: BRAND_ROYAL,
    borderWidth: 2,
    backgroundColor: 'rgba(0,47,167,0.04)',
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  planHeadText: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY },
  planTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  planPrice: { fontSize: 22, fontWeight: '800', color: BRAND_ROYAL },
  currentBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: BRAND_ROYAL,
    textTransform: 'uppercase',
  },
  duration: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 10 },
  billing: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  detail: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, marginTop: 8 },
  buyBtn: {
    backgroundColor: BRAND_ROYAL,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  buyText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.65 },
});
