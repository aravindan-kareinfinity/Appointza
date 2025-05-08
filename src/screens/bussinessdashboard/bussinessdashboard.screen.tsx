import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrgLocationReq,
  AppointmentPaymentsummary,
  PaymentSummary,
} from '../../models/organisationlocation.model';
import {useFocusEffect} from '@react-navigation/native';

type DashboardScreenProps = {
  // Add any props if needed
};

export function BussinessDashboardScreen() {
  const usercontext = useAppSelector(selectusercontext);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [selectlocation, Setselectlocation] =
    useState<OrganisationLocationStaffRes | null>(null);
  const [locationlist, Setlocationlist] = useState<
    OrganisationLocationStaffRes[]
  >([]);
  const [paymentSummary, setPaymentSummary] =
    useState<AppointmentPaymentsummary>(new AppointmentPaymentsummary());

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );

  useEffect(() => {
    if (selectlocation) {
      getLocationDetail(selectlocation.organisationlocationid);
    }
  }, [selectlocation]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await getstafflocation();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getstafflocation = async () => {
    try {
      const req = new OrganisationLocationStaffReq();
      req.userid = usercontext.value.userid;
      const res = await organisationlocationservice.Selectlocation(req);

      if (res && res.length > 0) {
        Setlocationlist(res);
        Setselectlocation(res[0]);
      } else {
        Setlocationlist([]);
        Setselectlocation(null);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const getLocationDetail = async (id: number) => {
    try {
      setIsLoading(true);
      const req = new OrgLocationReq();
      req.orglocid = id;
      const res =
        await organisationlocationservice.SelectAppointmentPaymentsummary(req);

      if (res) {
        setPaymentSummary(res);
      }
    } catch (error) {
      console.error('Error loading location details:', error);
      AppAlert({message: 'Failed to load location details'});
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (item: OrganisationLocationStaffRes) => {
    Setselectlocation(item);
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({message});
  };

  const renderPaymentMethod = ({item}: {item: PaymentSummary}) => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodLeft}>
        <CustomIcon
          name={getPaymentMethodIcon(item.paymentmodetype)}
          size={20}
          color={$.tint_3}
        />
        <AppText style={styles.paymentMethodName}>
          {item.paymentmodetype}
        </AppText>
      </View>
      <AppText style={styles.paymentMethodAmount}>
        ₹{item.totalamount.toLocaleString('en-IN')}
      </AppText>
    </View>
  );

  const getPaymentMethodIcon = (method: string): CustomIcons => {
    switch (method.toLowerCase()) {
      case 'cash':
        return CustomIcons.Circle;
      case 'card':
        return CustomIcons.Circle;
      case 'upi':
        return CustomIcons.Qrcode;
      case 'online':
        return CustomIcons.Global;
      default:
        return CustomIcons.Circle;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'appointment':
        return CustomIcons.Dashboard;
      case 'service':
        return CustomIcons.ServiceList;
      case 'qr':
        return CustomIcons.QRCode;
      case 'global':
        return CustomIcons.Global;
      default:
        return CustomIcons.Dashboard;
    }
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: CustomIcons,
    color: string,
  ) => (
    <View style={[styles.statCard, {backgroundColor: color}]}>
      <View style={styles.statIconContainer}>
        <CustomIcon name={icon} size={24} color="#FFF" />
      </View>
      <View style={styles.statTextContainer}>
        <AppText style={styles.statValue}>{value}</AppText>
        <AppText style={styles.statTitle}>{title}</AppText>
      </View>
    </View>
  );

  return (
    <AppView style={[$.flex_1]}>
      <View >
        <AppView style={[$.flex_row, $.m_small,$.px_small]}>

        <AppText style={[$.fs_regular,$.fw_bold,$.flex_1,$.text_tint_1]}>Dashboard</AppText>
        <TouchableOpacity
          onPress={() =>
            selectlocation &&
            getLocationDetail(selectlocation.organisationlocationid)
          }>
          <CustomIcon name={CustomIcons.Clock} size={24} color={$.tint_3} />
        </TouchableOpacity>
        </AppView>

        {locationlist.length > 1 && (
          <View style={[ ]}>
            <AppSingleSelect
              data={locationlist}
              keyExtractor={e => e.organisationlocationid.toString()}
              searchKeyExtractor={e => e.name}
              renderItemLabel={item => (
                <AppText style={styles.locationItemText}>{item.name}</AppText>
              )}
              selecteditemid={
                selectlocation?.organisationlocationid.toString() || ''
              }
              onSelect={handleLocationChange}
              title="Select Location"
             
            />
          </View>
        )}

        
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}>
        {/* Location Selector */}
     

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={styles.loadingText}>Loading dashboard...</AppText>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              {renderStatCard(
                'Total',
                paymentSummary.totalappointments,
                CustomIcons.Dashboard,
                $.primary2,
              )}
              {renderStatCard(
                'Confirmed',
                paymentSummary.confirmedcount,
                CustomIcons.StatusIndicator,
                '#4CAF50',
              )}
              {renderStatCard(
                'Completed',
                paymentSummary.completedcount,
                CustomIcons.OnlinePayment,
                '#2196F3',
              )}
              {renderStatCard(
                'Revenue',
                paymentSummary.paymentsummary.reduce(
                  (sum, item) => sum + item.totalamount,
                  0,
                ),
                CustomIcons.TimeCard,
                '#FFC107',
              )}
            </View>

            {/* Payment Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>Payment Methods</AppText>
                <CustomIcon
                  name={CustomIcons.Associate}
                  size={20}
                  color={$.tint_3}
                />
              </View>

              {paymentSummary.paymentsummary.length > 0 ? (
                <FlatList
                  data={paymentSummary.paymentsummary}
                  renderItem={renderPaymentMethod}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                  style={styles.paymentList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <CustomIcon
                    name={CustomIcons.Warning}
                    size={32}
                    color={$.tint_5}
                  />
                  <AppText style={styles.emptyText}>
                    No payment data available
                  </AppText>
                </View>
              )}

              {/* Total Revenue */}
              <View style={styles.totalRevenueCard}>
                <AppText style={styles.totalRevenueLabel}>
                  Total Revenue
                </AppText>
                <AppText style={styles.totalRevenueAmount}>
                  ₹
                  {paymentSummary.paymentsummary
                    .reduce((sum, item) => sum + item.totalamount, 0)
                    .toLocaleString('en-IN')}
                </AppText>
              </View>
            </View>

            {/* Refresh Button */}
          </>
        )}
      </ScrollView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  locationSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  locationItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  statIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  paymentList: {
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  paymentMethodAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: $.primary2,
  },
  totalRevenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: $.tint_10,
    borderRadius: 8,
    marginTop: 8,
  },
  totalRevenueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRevenueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: $.primary2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: $.primary2,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
