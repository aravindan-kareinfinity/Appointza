import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppAlert} from '../../components/appalert.component';
import {AppSwitch} from '../../components/appswitch.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppoinmentService} from '../../services/appoinment.service';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {StaffService} from '../../services/staff.service';
import {ReferenceValueService} from '../../services/referencevalue.service';
import {
  BookedAppoinmentRes,
  AppoinmentSelectReq,
  AddStaffReq,
  UpdateStatusReq,
  UpdatePaymentReq,
} from '../../models/appoinment.model';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
} from '../../models/organisationlocation.model';
import {StaffSelectReq, StaffUser} from '../../models/staff.model';
import {ReferenceTypeSelectReq} from '../../models/referencetype.model';
import {REFERENCETYPE} from '../../models/users.model';
import {ReferenceValue} from '../../models/referencevalue.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {AppStackParamList} from '../../appstack.navigation';
import { environment } from '../../utils/environment';

import { AppTextInput } from '../../components/apptextinput.component';

type UserAppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'UserAppoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

const statusColors: Record<string, string> = {
  'CONFIRMED': '#4CAF50',
  'PENDING': '#FFC107',
  'CANCELLED': '#F44336',
  'COMPLETED': '#2196F3',
};

export function UserAppoinmentScreen() {
  const navigation = useNavigation<UserAppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [UserApponmentlist, setUserAppoinmentList] = useState<BookedAppoinmentRes[]>([]);

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );

  const loadInitialData = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        await getuserappoinment();
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const getuserappoinment = async () => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.userid = usercontext.value.userid;
      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setUserAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({message});
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await getuserappoinment();
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };



  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const renderAppointmentItem = ({item}: {item: BookedAppoinmentRes}) => (
    <TouchableOpacity
      style={[
        styles.appointmentCard,
        {
          borderLeftColor: statusColors[item.statuscode] || $.tint_3,
        },
      ]}
      onPress={() => {}}>
      
      {/* Header with date and status */}
      <View style={styles.cardHeader}>
        <AppText style={styles.dateText}>
        {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </AppText>
        <View style={[
          styles.statusBadge,
          { backgroundColor: statusColors[item.statuscode] || $.tint_3 }
        ]}>
          <AppText style={styles.statusText}>
            {item.statuscode || 'PENDING'}
          </AppText>
        </View>
      </View>
      
      {/* Time slot */}
      <View style={styles.timeContainer}>
        <CustomIcon
          size={20}
          color={$.tint_3}
          name={CustomIcons.Clock}
        />
        <AppText style={styles.timeText}>
        {item.fromtime.toString().substring(0, 5)}-  {item.totime.toString().substring(0, 5)}
        </AppText>
      </View>
      
      {/* Staff and location */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <CustomIcon
            size={20}
            color={$.tint_3}
            name={CustomIcons.Account}
          />
          <AppText style={styles.infoText}>
            {item.staffname || 'Not assigned'}
          </AppText>
        </View>
        
        <View style={styles.infoRow}>
          <CustomIcon
            size={20}
            color={$.tint_3}
            name={CustomIcons.Shop}
          />
          <View style={styles.locationTextContainer}>
            <AppText style={styles.organisationText}>
              {item.organisationname}
            </AppText>
            <AppText style={styles.locationText}>
              {item.city || 'No location specified'}
            </AppText>
          </View>
        </View>
      </View>
      
      {/* Services list */}
      {item.attributes?.servicelist?.length > 0 && (
        <View style={styles.servicesContainer}>
          <AppText style={styles.servicesTitle}>Services</AppText>
          
          {item.attributes.servicelist.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <AppText style={styles.serviceName} >
                {service.servicename}
              </AppText>
              <AppText style={styles.servicePrice}>
                ₹{service.serviceprice}
              </AppText>
            </View>
          ))}
          
          <View style={styles.totalContainer}>
            <AppText style={styles.totalText}>Total</AppText>
            <AppText style={styles.totalAmount}>
              ₹{item.attributes.servicelist.reduce(
                (total, service) => total + (Number(service.serviceprice) || 0),
                0
              )}
            </AppText>
          </View>
        </View>
      )}
      
      {/* Payment status */}
      <View style={[
        styles.paymentBadge,
        item.ispaid ? styles.paidBadge : styles.unpaidBadge
      ]}>
        <AppText style={styles.paymentText}>
          {item.ispaid ? 'PAID' : 'PENDING PAYMENT'}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>My Appointments</AppText>
        <TouchableOpacity onPress={handleRefresh}>
          <CustomIcon
            name={CustomIcons.Clock}
            size={24}
            color={$.tint_3}
          />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {isloading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={$.tint_3} />
          <AppText style={styles.loadingText}>Loading appointments...</AppText>
        </View>
      ) : (
        <FlatList
          data={UserApponmentlist}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAppointmentItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[$.tint_3]}
              tintColor={$.tint_3}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomIcon
                color={$.tint_5}
                name={CustomIcons.Scheduled}
                size={48}
              />
              <AppText style={styles.emptyText}>
                You have no appointments yet
              </AppText>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}>
                <AppText style={styles.refreshButtonText}>Refresh</AppText>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  locationTextContainer: {
    marginLeft: 8,
  },
  organisationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  locationText: {
    fontSize: 13,
    color: '#777',
  },
  servicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  serviceName: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    marginRight: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  paymentBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  paidBadge: {
    backgroundColor: '#4CAF50',
  },
  unpaidBadge: {
    backgroundColor: '#F44336',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});