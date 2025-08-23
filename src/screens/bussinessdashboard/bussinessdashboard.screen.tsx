import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, ScrollView, TouchableOpacity, View, StyleSheet , SafeAreaView} from 'react-native';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext, usercontextactions} from '../../redux/usercontext.redux';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrgLocationReq,
  AppointmentPaymentsummary,
  PaymentSummary,
} from '../../models/organisationlocation.model';
import {useFocusEffect} from '@react-navigation/native';
import {FormSelect} from '../../components/formselect.component';
import {CustomHeader} from '../../components/customheader.component';
import {Colors} from '../../constants/colors';

type DashboardScreenProps = {
  // Add any props if needed
};

export function BussinessDashboardScreen() {
  const dispatch = useAppDispatch();
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
    dispatch(
      usercontextactions.setOrganisationLocation({
        id: item.organisationlocationid,
        name: item.name,
      }),
    );
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
    <View style={[styles.statCard, {borderLeftColor: color}]}>
      <View style={styles.statIconContainer}>
        <CustomIcon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statTextContainer}>
        <AppText style={styles.statValue}>{value}</AppText>
        <AppText style={styles.statTitle}>{title}</AppText>
      </View>
    </View>
  );

  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={[$.flex_1, {backgroundColor: '#F5F7FA'}]}>
      <CustomHeader
        title="Dashboard"
        backgroundColor={Colors.light.background}
        titleColor={Colors.light.text}
        rightComponent={
          <TouchableOpacity
            onPress={() =>
              selectlocation &&
              getLocationDetail(selectlocation.organisationlocationid)
            }
            style={styles.refreshButton}>
            <CustomIcon name={CustomIcons.Refresh} size={20} color={$.tint_3} />
          </TouchableOpacity>
        }
      />

      {locationlist.length > 1 && (
        <View style={styles.locationSelectorContainer}>
          <FormSelect
            label="Select Location"
            options={locationlist.map(loc => ({
              id: loc.organisationlocationid,
              name: loc.name
            }))}
            selectedId={selectlocation?.organisationlocationid || 0}
            onSelect={(option) => {
              const selectedLocation = locationlist.find(
                loc => loc.organisationlocationid === option.id
              );
              if (selectedLocation) {
                handleLocationChange(selectedLocation);
              }
            }}
          />
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={styles.loadingText}>Loading dashboard...</AppText>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                {renderStatCard(
                  'Total Appointments',
                  paymentSummary.totalappointments,
                  CustomIcons.Dashboard,
                  '#4A6DA7',
                )}
                {renderStatCard(
                  'Confirmed',
                  paymentSummary.confirmedcount,
                  CustomIcons.StatusIndicator,
                  '#4CAF50',
                )}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard(
                  'Completed',
                  paymentSummary.completedcount,
                  CustomIcons.OnlinePayment,
                  '#2196F3',
                )}
                {renderStatCard(
                  'Total Revenue',
                  paymentSummary.paymentsummary.reduce(
                    (sum, item) => sum + item.totalamount,
                    0,
                  ),
                  CustomIcons.TimeCard,
                  '#FF9800',
                )}
              </View>
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
                <View style={styles.totalRevenueLeft}>
                  <AppText style={styles.totalRevenueLabel}>
                    Total Revenue
                  </AppText>
                  <AppText style={styles.totalRevenueSubLabel}>
                    All payment methods
                  </AppText>
                </View>
                <AppText style={styles.totalRevenueAmount}>
                  ₹
                  {paymentSummary.paymentsummary
                    .reduce((sum, item) => sum + item.totalamount, 0)
                    .toLocaleString('en-IN')}
                </AppText>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </AppView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  locationSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    paddingBottom: 20,
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
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
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
    color: '#333333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#666666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  paymentList: {
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  paymentMethodAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A6DA7',
  },
  totalRevenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  totalRevenueLeft: {
    flex: 1,
  },
  totalRevenueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  totalRevenueSubLabel: {
    fontSize: 13,
    color: '#666',
  },
  totalRevenueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A6DA7',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
