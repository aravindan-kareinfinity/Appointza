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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
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
} from '../../models/appoinment.model';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrgLocationReq,
  AppointmentPaymentsummary,
  PaymentSummary,
} from '../../models/organisationlocation.model';
import {StaffSelectReq, StaffUser} from '../../models/staff.model';
import {ReferenceTypeSelectReq} from '../../models/referencetype.model';
import {REFERENCETYPE} from '../../models/users.model';
import {ReferenceValue} from '../../models/referencevalue.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {AppStackParamList} from '../../appstack.navigation';
import { environment } from '../../utils/environment';

const statusColors: Record<string, string> = {
  'CONFIRMED': '#4CAF50',
  'PENDING': '#FFC107',
  'CANCELLED': '#F44336',
  'COMPLETED': '#2196F3',
};

type UserDashboardScreenProp = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export function UserDashboardScreen() {
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [UserApponmentlist, setUserAppoinmentList] = useState<BookedAppoinmentRes[]>([]);
  
  // Dashboard stats
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<BookedAppoinmentRes[]>([]);

  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const navigation = useNavigation<UserDashboardScreenProp['navigation']>();

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );

  const loadInitialData = async () => {
    setIsloading(true);
    try {
      console.log(
        "usercontext.value.userid ",usercontext.value.userid 
      );
      
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
      calculateDashboardStats(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const calculateDashboardStats = (appointments: BookedAppoinmentRes[]) => {
    // Calculate counts
    setTotalAppointments(appointments.length);
    
    const confirmed = appointments.filter(a => a.statuscode === 'CONFIRMED').length;
    const pending = appointments.filter(a => a.statuscode === 'PENDING').length;
    const cancelled = appointments.filter(a => a.statuscode === 'CANCELLED').length;
    const completed = appointments.filter(a => a.statuscode === 'COMPLETED').length;
    
    setConfirmedCount(confirmed);
    setPendingCount(pending);
    setCancelledCount(cancelled);
    setCompletedCount(completed);
    
    // Calculate total spent
    const spent = appointments.reduce((total, appointment) => {
      if (appointment.attributes?.servicelist) {
        return total + appointment.attributes.servicelist.reduce(
          (sum, service) => sum + (Number(service.serviceprice) || 0), 0
        );
      }
      return total;
    }, 0);
    setTotalSpent(spent);
    
    // Get upcoming appointments (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcoming = appointments.filter(appointment => {
      const appDate = new Date(appointment.appoinmentdate);
      return appDate >= today && appDate <= nextWeek && 
             ['CONFIRMED', 'PENDING'].includes(appointment.statuscode);
    }).sort((a, b) => new Date(a.appoinmentdate).getTime() - new Date(b.appoinmentdate).getTime());
    
    setUpcomingAppointments(upcoming.slice(0, 3)); // Show only next 3 upcoming
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

  const handleAppointmentPress = (appointmentId: number) => {
    navigation.navigate('AppointmentTimeline', { appointmentid: appointmentId });
  };

  const renderStatsCard = (icon: CustomIcons, title: string, value: string | number, color: string) => (
    <View style={[styles.statsCard, {backgroundColor: color}]}>
      <View style={styles.statsIconContainer}>
        <CustomIcon name={icon} size={24} color="#FFF" />
      </View>
      <View style={styles.statsTextContainer}>
        <AppText style={styles.statsValue}>{value}</AppText>
        <AppText style={styles.statsTitle}>{title}</AppText>
      </View>
    </View>
  );

  const renderUpcomingAppointment = ({item}: {item: BookedAppoinmentRes}) => (
    <TouchableOpacity style={styles.upcomingCard}>
      <View style={styles.upcomingHeader}>
        <AppText style={styles.upcomingDate}>
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </AppText>
        <View style={[
          styles.upcomingStatus,
          {backgroundColor: statusColors[item.statuscode] || $.tint_3}
        ]}>
          <AppText style={styles.upcomingStatusText}>{item.statuscode}</AppText>
        </View>
      </View>
      <AppText style={styles.upcomingTime}>
        {item.fromtime.toString().substring(0, 5)} - {item.totime.toString().substring(0, 5)}
      </AppText>
      <AppText style={styles.upcomingLocation}>{item.organisationname}</AppText>
    </TouchableOpacity>
  );

  return (
    <AppView style={styles.container}>
      {/* Header Section */}
      <View style={[$.flex_row, $.m_small,$.px_small]}>
        <AppText style={[$.fs_regular,$.fw_bold,$.flex_1,$.text_tint_1]}>Dashboard</AppText>
        <TouchableOpacity onPress={handleRefresh}>
          <CustomIcon name={CustomIcons.Clock} size={24} color={$.tint_3} />
        </TouchableOpacity>
      </View>
      
      {isloading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={$.tint_3} />
          <AppText style={styles.loadingText}>Loading dashboard...</AppText>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[$.tint_3]}
              tintColor={$.tint_3}
            />
          }
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            {renderStatsCard(CustomIcons.Scheduled, 'Total Appointments', totalAppointments, $.primary2)}
            {renderStatsCard(CustomIcons.Tick, 'Confirmed', confirmedCount, '#4CAF50')}
            {renderStatsCard(CustomIcons.Clock, 'Pending', pendingCount, '#FFC107')}
            {renderStatsCard(CustomIcons.Cancel, 'Cancelled', cancelledCount, '#F44336')}
            {renderStatsCard(CustomIcons.Completed, 'Completed', completedCount, '#2196F3')}
           
          </View>
          
          {/* Upcoming Appointments */}
          {/* <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Upcoming Appointments</AppText>
              {upcomingAppointments.length > 0 && (
                <TouchableOpacity>
                  <AppText style={styles.seeAllText}>See All</AppText>
                </TouchableOpacity>
              )}
            </View>
            
            {upcomingAppointments.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={upcomingAppointments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderUpcomingAppointment}
                contentContainerStyle={styles.upcomingList}
              />
            ) : (
              <View style={styles.emptySection}>
                <CustomIcon
                  color={$.tint_5}
                  name={CustomIcons.Scheduled}
                  size={48}
                />
                <AppText style={styles.emptyText}>
                  No upcoming appointments
                </AppText>
              </View>
            )}
          </View> */}
          
          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Recent Activity</AppText>
              {/* {UserApponmentlist.length > 0 && (
                <TouchableOpacity>
                  <AppText style={styles.seeAllText}>See All</AppText>
                </TouchableOpacity>
              )} */}
            </View>
            
            {UserApponmentlist.length > 0 ? (
              <FlatList
                data={[...UserApponmentlist].sort((a, b) => new Date(b.createdon).getTime() - new Date(a.createdon).getTime())}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.activityItem}
                    onPress={() => handleAppointmentPress(item.id)}
                  >
                    <View style={styles.activityIcon}>
                      <CustomIcon
                        name={
                          item.statuscode === 'COMPLETED' ? CustomIcons.Completed :
                          item.statuscode === 'CANCELLED' ? CustomIcons.Cancel :
                          item.statuscode === 'CONFIRMED' ? CustomIcons.Tick :
                          CustomIcons.Clock
                        }
                        size={20}
                        color={
                          item.statuscode === 'COMPLETED' ? '#2196F3' :
                          item.statuscode === 'CANCELLED' ? '#F44336' :
                          item.statuscode === 'CONFIRMED' ? '#4CAF50' :
                          '#FFC107'
                        }
                      />
                    </View>
                    
                    <View style={styles.activityContent}>
                      <AppText style={styles.activityTitle}>
                        {item.organisationname}
                      </AppText>
                      <AppText style={styles.activitySubtitle}>
                        {new Date(item.appoinmentdate).toLocaleDateString()} • {item.fromtime.toString().substring(0, 5)}
                      </AppText>
                    </View>
                    <AppText style={[
                      styles.activityStatus,
                      {
                        color: item.statuscode === 'COMPLETED' ? '#2196F3' :
                              item.statuscode === 'CANCELLED' ? '#F44336' :
                              item.statuscode === 'CONFIRMED' ? '#4CAF50' :
                              '#FFC107'
                      }
                    ]}>
                      {item.statuscode}
                    </AppText>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptySection}>
                <CustomIcon
                  color={$.tint_5}
                  name={CustomIcons.History}
                  size={48}
                />
                <AppText style={styles.emptyText}>
                  No recent activity
                </AppText>
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollContainer: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  statsIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statsTitle: {
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
  seeAllText: {
    color: $.tint_3,
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingList: {
    paddingBottom: 8,
  },
  upcomingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    width: 200,
    marginRight: 12,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  upcomingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  upcomingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  upcomingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  upcomingLocation: {
    fontSize: 13,
    color: '#777',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#777',
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});