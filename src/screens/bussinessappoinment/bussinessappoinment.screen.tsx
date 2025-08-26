import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import {
  CustomIcon,
  CustomIcons,
} from '../../components/customicons.component';
import { AppAlert } from '../../components/appalert.component';
import { AppSwitch } from '../../components/appswitch.component';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { BottomSheetComponent } from '../../components/bottomsheet.component';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import { AppoinmentService } from '../../services/appoinment.service';
import { StaffService } from '../../services/staff.service';
import { ReferenceValueService } from '../../services/referencevalue.service';
import {
  BookedAppoinmentRes,
  AppoinmentSelectReq,
  AddStaffReq,
  UpdateStatusReq,
  UpdatePaymentReq,
} from '../../models/appoinment.model';
// Remove unused imports since we're no longer using location selection
// import {
//   OrganisationLocationStaffReq,
//   OrganisationLocationStaffRes,
// } from '../../models/organisationlocation.model';
import { StaffSelectReq, StaffUser } from '../../models/staff.model';
import { ReferenceTypeSelectReq } from '../../models/referencetype.model';
import { REFERENCETYPE } from '../../models/users.model';
import { ReferenceValue } from '../../models/referencevalue.model';
import { HomeTabParamList } from '../../hometab.navigation';
import { AppStackParamList } from '../../appstack.navigation';
import { environment } from '../../utils/environment';
import { AppTextInput } from '../../components/apptextinput.component';
import { DatePickerComponent } from '../../components/Datetimepicker.component';
import { FormInput } from '../../components/forminput.component';

type BussinessAppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'BussinessAppoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function BussinessAppoinmentScreen() {
  const navigation =
    useNavigation<BussinessAppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for bottom sheets
  const addStaffSheetRef = useRef<any>(null);
  const statusSheetRef = useRef<any>(null);
  const paymentSheetRef = useRef<any>(null);

  // Data states
  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<
    BookedAppoinmentRes[]
  >([]);
  // Remove locationlist state since we're using Redux location
  // const [locationlist, Setlocationlist] = useState<
  //   OrganisationLocationStaffRes[]
  // >([]);

  const [stafflist, setStafflist] = useState<StaffUser[]>([]);
  const [AppinmentStatuslist, setAppoinmentStatuslist] = useState<
    ReferenceValue[]
  >([]);
  const [updatedAppointmentId, setUpdatedAppointmentId] = useState<
    number | null
  >(null);
  const flatListRef = useRef<FlatList>(null);
  const itemHeights = useRef<{ [key: number]: number }>({});
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<string>('Cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentName, setPaymentName] = useState<string>('');
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [seletecedappinmentid, Setselectedappoinmentid] = useState(0);

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const dispatch = useAppDispatch();
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const staffservice = useMemo(() => new StaffService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, []),
  );

  // Load organization appointments when location changes
  useEffect(() => {

      getorganisationappoinment(orgId, locId);
      getstafflist();
    
  }, [ usercontext.value.organisationlocationid]);
  const [showdatepicker, setshowdatepicker] = useState(false);
  const [seleteddate, setselectedate] = useState<Date | null>(null);
  const loadInitialData = async () => {
    setIsloading(true);
    try {
      // Remove getstafflocation call since we're using Redux location
      // await getstafflocation();
      await fetchStatusReferenceTypes();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const orgId  = useAppSelector(selectusercontext).value.organisationid || 0;
  const locId =useAppSelector(selectusercontext).value.organisationlocationid || 0;
  

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
    
        await getorganisationappoinment(orgId, locId);
      
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Remove getstafflocation function since it's no longer needed
  // const getstafflocation = async () => {
  //   try {
  //     const req = new OrganisationLocationStaffReq();
  //     req.userid = usercontext.value.userid;
  //     const res = await organisationLocationService.Selectlocation(req);

  //     if (res && res.length > 0) {
  //       // Setlocationlist(res); // This line is removed
  //       // Remove local location selection - Redux handles this
  //       // Prefer stored redux location if available and valid
  //       // const storedLocId = usercontext.value.organisationlocationid || 0;
  //       // const preferred =
  //       //   storedLocId > 0
  //       //     ? res.find(r => r.organisationlocationid === storedLocId)
  //       //     : undefined;
  //       // const chosen = preferred || res[0];
        
  //       // Persist to redux if changed or not set
  //       // if (!preferred || storedLocId !== chosen.organisationlocationid) {
  //       //   dispatch(
  //       //     usercontextactions.setOrganisationLocation({
  //       //       id: chosen.organisationlocationid,
  //       //       name: chosen.name,
  //       //     }),
  //       //   );
  //       // }
  //     } else {
  //       // Setlocationlist([]); // This line is removed
  //     }
  //   } catch (error: any) {
  //     handleError(error);
  //     // }
  //   };
  // };

  const getorganisationappoinment = async (orgid: number, locid: number) => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
      if (seleteddate) {
        req.appointmentdate = seleteddate;
      }
      console.log('resssssssssss', req);

      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setOrganisationAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const getstafflist = async () => {
    const orgId  = useAppSelector(selectusercontext).value.organisationid || 0;
    const locId =useAppSelector(selectusercontext).value.organisationlocationid || 0;
    if (orgId === 0 || locId === 0) return;

    try {
      setIsloading(true);
      const req = new StaffSelectReq();
      req.organisationid = orgId;
      req.organisationlocationid = locId;
      const res = await staffservice.SelectStaffDetail(req);
      if (res) {
        setStafflist(res);
      } else {
        setStafflist([]);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      Alert.alert('Error', 'Failed to fetch staff data. Please try again.');
    } finally {
      setIsloading(false);
    }
  };

  const fetchStatusReferenceTypes = async () => {
    try {
      setIsloading(true);
      var req = new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.APPOINTMENTSTATUS;
      const response = await referenceValueService.select(req);
      if (response) {
        setAppoinmentStatuslist(response);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    AppAlert({ message });
  };

  // Remove handleLocationChange - no longer needed
  // const handleLocationChange = (item: OrganisationLocationStaffRes) => {
  //   dispatch(
  //     usercontextactions.setOrganisationLocation({
  //       id: item.organisationlocationid,
  //       name: item.name,
  //     }),
  //   );
  // };

  // No local selection; rely on redux organisationlocationid exclusively

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELLED':
        return '#F44336';
      case 'CONFIRMED':
        return '#4CAF50';
      default:
        return '#FFC107';
    }
  };

  const scrollToUpdatedAppointment = (appointmentId: number) => {
    setTimeout(() => {
      const index = OrganisationApponmentlist.findIndex(
        item => item.id === appointmentId,
      );
      if (index !== -1) {
        // Calculate offset by summing up heights of previous items
        let offset = 0;
        for (let i = 0; i < index; i++) {
          const itemId = OrganisationApponmentlist[i].id;
          offset += itemHeights.current[itemId] || 250; // Default height if not measured
        }

        flatListRef.current?.scrollToOffset({
          offset: offset,
          animated: true,
        });
      }
    }, 300);
  };

  const onLayoutItem = (id: number, event: any) => {
    const { height } = event.nativeEvent.layout;
    itemHeights.current[id] = height;
  };

  const Assignstaff = async (staffid: number, staffname: string) => {
    try {
      setIsloading(true);
      var req = new AddStaffReq();
      (req.appoinmentid = seletecedappinmentid),
        (req.organisationid = usercontext.value.organisationid || 0),
        (req.organisationlocationid =
          usercontext.value.organisationlocationid || 0),
        (req.staffid = staffid);
      req.staffname = staffname;
      const response = await appoinmentservices.Assignstaff(req);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? { ...appointment, staffid, staffname }
              : appointment,
          ),
        );
        addStaffSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'staff assigned succesfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const Updatestatus = async (statusid: number, statuscode: string) => {
    try {
      setIsloading(true);
      var req = new UpdateStatusReq();
      req.appoinmentid = seletecedappinmentid;
      (req.organisationid = usercontext.value.organisationid || 0),
        (req.organisationlocationid =
          usercontext.value.organisationlocationid || 0),
        (req.statusid = statusid);
      req.statuscode = statuscode;
      req.statustype = '';

      const response = await appoinmentservices.UpdateStatus(req);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? { ...appointment, statusid, statuscode }
              : appointment,
          ),
        );
        statusSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'status updated successfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const Updatepayment = async (paymentData: UpdatePaymentReq) => {
    try {
      setIsloading(true);
      const response = await appoinmentservices.UpdatePayment(paymentData);
      if (response) {
        setOrganisationAppoinmentList(prevList =>
          prevList.map(appointment =>
            appointment.id === seletecedappinmentid
              ? {
                  ...appointment,
                  ispaid: true,
                  paymenttype: paymentData.paymenttype,
                  paymentamount: paymentData.amount,
                  paymentname: paymentData.paymentname,
                  paymentcode: paymentData.paymentcode,
                }
              : appointment,
          ),
        );
        paymentSheetRef.current?.close();
        setTimeout(() => {
          scrollToUpdatedAppointment(seletecedappinmentid);
          Alert.alert(environment.baseurl, 'Payment updated successfully');
        }, 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const renderAppointmentItem = ({ item }: { item: BookedAppoinmentRes }) => (
    <TouchableOpacity
      onLayout={event => onLayoutItem(item.id, event)}
      style={{
        marginHorizontal: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#4a6da7',
      }}
      activeOpacity={0.9}
      onPress={() => {}}
    >
      {/* Header with Date and Time */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <Text
          style={{ fontWeight: 'bold', fontSize: 16, color: '#333', flex: 1 }}
        >
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
              marginRight: 4,
            }}
          >
            {item.fromtime.toString().substring(0, 5)}
          </Text>
          <Text style={{ fontWeight: '300', fontSize: 12, color: '#adb5bd' }}>
            -
          </Text>
          <Text
            style={{
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
              marginLeft: 4,
            }}
          >
            {item.totime.toString().substring(0, 5)}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <View
          style={{
            backgroundColor: '#e9ecef',
            padding: 8,
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center',
            width: 40,
            height: 40,
          }}
        >
          <CustomIcon size={24} color="#4a6da7" name={CustomIcons.Account} />
        </View>

        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 16, color: '#333' }}>
            {item.username}
          </Text>
          <Text style={{ fontWeight: '400', fontSize: 12, color: '#6c757d' }}>
            {item.mobile || 'No mobile provided'}
          </Text>
        </View>
      </View>

      {/* Status and Staff Badges */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
            paddingHorizontal: 8,
          }}
        >
          <CustomIcon
            name={
              item.statuscode === 'COMPLETED'
                ? CustomIcons.OnlinePayment
                : item.statuscode === 'CANCELLED'
                ? CustomIcons.CashPayment
                : item.statuscode === 'CONFIRMED'
                ? CustomIcons.StatusIndicator
                : CustomIcons.TimeCard
            }
            size={20}
            color={getStatusColor(item.statuscode)}
          />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
            }}
          >
            {item.statuscode || 'No status'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e9ecef',
            padding: 4,
            borderRadius: 4,
            paddingHorizontal: 8,
          }}
        >
          <CustomIcon size={14} color="#adb5bd" name={CustomIcons.Account} />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#495057',
            }}
          >
            {item.staffname || 'Unassigned'}
          </Text>
        </View>

        {item.ispaid && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#28a745',
              padding: 4,
              borderRadius: 4,
              paddingHorizontal: 8,
            }}
          >
            <CustomIcon size={14} color="#28a745" name={CustomIcons.Circle} />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#28a745',
              }}
            >
              Paid
            </Text>
          </View>
        )}
      </View>

      {/* Services List */}
      {item.attributes?.servicelist?.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 12,
              color: '#6c757d',
              marginBottom: 8,
            }}
          >
            SERVICES
          </Text>

          <View
            style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4 }}
          >
            {item.attributes.servicelist.map((service, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: index % 2 === 0 ? '#f1f3f5' : '#f8f9fa',
                  borderBottomWidth:
                    index === item.attributes.servicelist.length - 1 ? 0 : 1,
                  borderBottomColor: '#e0e0e0',
                }}
              >
                <Text
                  style={{ fontWeight: '400', fontSize: 12, color: '#6c757d' }}
                >
                  {service.servicename}
                </Text>
                <Text
                  style={{ fontWeight: '600', fontSize: 12, color: '#4a6da7' }}
                >
                  ₹{service.serviceprice}
                </Text>
              </View>
            ))}

            {/* Total Price */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 8,
                backgroundColor: '#e9ecef',
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 12, color: '#333' }}>
                Total
              </Text>
              <Text
                style={{ fontWeight: '700', fontSize: 12, color: '#4a6da7' }}
              >
                ₹
                {item.attributes.servicelist
                  .reduce(
                    (total, service) =>
                      total + (Number(service.serviceprice) || 0),
                    0,
                  )
                  .toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}
      >
        {stafflist.length > 0 && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#4a6da7',
              borderRadius: 4,
              backgroundColor: '#f1f3f5',
            }}
            onPress={() => {
              addStaffSheetRef.current?.open();
              Setselectedappoinmentid(item.id);
            }}
          >
            <CustomIcon
              size={16}
              color="#4a6da7"
              name={CustomIcons.AddAccount}
            />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#4a6da7',
              }}
            >
              Assign
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            borderWidth: 1,
            borderColor: '#28a745',
            borderRadius: 4,
            backgroundColor: '#f1f3f5',
          }}
          onPress={() => {
            Setselectedappoinmentid(item.id);
            statusSheetRef.current?.open();
          }}
        >
          <CustomIcon size={16} color="#28a745" name={CustomIcons.Edit} />
          <Text
            style={{
              marginLeft: 4,
              fontWeight: '500',
              fontSize: 12,
              color: '#28a745',
            }}
          >
            Status
          </Text>
        </TouchableOpacity>

        {item.ispaid && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#4a6da7',
              borderRadius: 4,
              backgroundColor: '#f1f3f5',
            }}
            onPress={() => {
              Setselectedappoinmentid(item.id);
              paymentSheetRef.current?.open();
            }}
          >
            <CustomIcon size={16} color="#4a6da7" name={CustomIcons.Save} />
            <Text
              style={{
                marginLeft: 4,
                fontWeight: '500',
                fontSize: 12,
                color: '#4a6da7',
              }}
            >
              Payment
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const orgId = usercontext.value.organisationid || 0;
    const locId = usercontext.value.organisationlocationid || 0;
    if (orgId > 0 && locId > 0) {
      getorganisationappoinment(orgId, locId);
      getstafflist();
    }
  }, [seleteddate]);

  // Add useEffect to handle scrolling after updates
  useEffect(() => {
    if (updatedAppointmentId) {
      scrollToUpdatedAppointment(updatedAppointmentId);
      setUpdatedAppointmentId(null);
    }
  }, [updatedAppointmentId, OrganisationApponmentlist]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <AppView style={[$.flex_1, { backgroundColor: '#F5F7FA' }]}>
        {/* Header Section */}
        <AppView
          style={[$.flex_row, $.mb_tiny, $.p_small, $.align_items_center]}
        >
          <AppText
            style={[
              $.fs_medium,
              $.fw_semibold,
              $.py_small,
              $.text_primary5,
              $.flex_1,
            ]}
          >
            Appointments
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setshowdatepicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <CustomIcon
                name={CustomIcons.TimeCard}
                size={18}
                color="#4a6da7"
              />
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#333',
                  marginLeft: 6,
                }}
              >
                {seleteddate ? seleteddate.toDateString() : 'All Dates'}
              </AppText>
            </TouchableOpacity>

            {seleteddate && (
              <TouchableOpacity
                onPress={() => setselectedate(null)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <CustomIcon
                  name={CustomIcons.Refresh}
                  size={18}
                  color="#4a6da7"
                />
                <AppText
                  style={{ fontSize: 14, fontWeight: '500', color: '#4a6da7' }}
                >
                  Clear
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </AppView>

        {/* Show current location info - Uses location stored in Redux from account screen */}
        {usercontext.value.organisationlocationname && (
          <AppView style={[$.mx_normal, $.mb_tiny, $.p_small, {backgroundColor: '#FFFFFF'}]}>
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_primary5]}>
              Location: {usercontext.value.organisationlocationname}
            </AppText>
          </AppView>
        )}

        {/* Location Selector - Remove this section as it's now handled in account screen */}
        {/* {locationlist.length > 1 && (
          <AppView style={[$.mb_tiny, { paddingLeft: 10, paddingRight: 10 }]}>
            <FormSelect
              label="Select Location"
              options={locationlist.map(loc => ({
                id: loc.organisationlocationid,
                name: loc.name,
              }))}
              selectedId={usercontext.value.organisationlocationid || 0}
              onSelect={option => {
                const selectedLocation = locationlist.find(
                  loc => loc.organisationlocationid === option.id,
                );
                if (selectedLocation) {
                  handleLocationChange(selectedLocation);
                }
              }}
            />
          </AppView>
        )} */}

        {/* Loading Indicator / List */}
        {isloading && !isRefreshing ? (
          <AppView
            style={[$.flex_1, $.justify_content_center, $.align_items_center]}
          >
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={[$.mt_medium, $.text_primary1]}>
              Loading appointments...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={OrganisationApponmentlist}
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
              <AppView
                style={[
                  $.flex_1,
                  $.justify_content_center,
                  $.align_items_center,
                  $.p_large,
                ]}
              >
                <CustomIcon
                  color={$.tint_5}
                  name={CustomIcons.Scheduled}
                  size={$.s_large}
                />
                <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                  No appointments for this location
                </AppText>
                <TouchableOpacity
                  style={[
                    $.mt_medium,
                    $.p_small,
                    $.bg_tint_3,
                    $.border_rounded,
                  ]}
                  onPress={handleRefresh}
                >
                  <AppText style={[$.text_tint_11, $.fw_semibold]}>
                    Refresh
                  </AppText>
                </TouchableOpacity>
              </AppView>
            }
            contentContainerStyle={[$.flex_1]}
            style={[$.flex_1]}
          />
        )}

        {/* Bottom Sheets */}
        <BottomSheetComponent
          ref={addStaffSheetRef}
          screenname="Assign Staff"
          Save={() => {
            addStaffSheetRef.current?.close();
          }}
          close={() => addStaffSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {stafflist.length > 0 ? (
              stafflist.map(staff => (
                <TouchableOpacity
                  key={staff.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => {
                    Assignstaff(staff.id, staff.name);
                    addStaffSheetRef.current?.close();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#E3F2FD',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <CustomIcon
                        name={CustomIcons.Account}
                        size={24}
                        color="#1976D2"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        style={[$.fw_semibold, { color: '#333', fontSize: 16 }]}
                      >
                        {staff.name}
                      </AppText>
                      <AppText
                        style={[$.text_tint_3, $.fs_small, { marginTop: 4 }]}
                      >
                        {staff.mobile}
                      </AppText>
                    </View>
                    <CustomIcon
                      name={CustomIcons.RightChevron}
                      size={20}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={{
                  padding: 24,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderStyle: 'dashed',
                }}
              >
                <CustomIcon
                  name={CustomIcons.Account}
                  size={32}
                  color="#ADB5BD"
                />
                <AppText style={[$.text_tint_3, $.mt_small, $.text_center]}>
                  No staff members available
                </AppText>
              </View>
            )}
          </ScrollView>
        </BottomSheetComponent>

        <BottomSheetComponent
          ref={statusSheetRef}
          screenname="Select Appointment Status"
          Save={() => {
            statusSheetRef.current?.close();
          }}
          showbutton={false}
          close={() => statusSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {AppinmentStatuslist.length > 0 ? (
              AppinmentStatuslist.map(status => (
                <TouchableOpacity
                  key={status.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPress={() => {
                    Updatestatus(status.id, status.identifier);
                    statusSheetRef.current?.close();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          getStatusColor(status.identifier) + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <CustomIcon
                        name={
                          status.identifier === 'COMPLETED'
                            ? CustomIcons.OnlinePayment
                            : status.identifier === 'CANCELLED'
                            ? CustomIcons.CashPayment
                            : status.identifier === 'CONFIRMED'
                            ? CustomIcons.StatusIndicator
                            : CustomIcons.TimeCard
                        }
                        size={24}
                        color={getStatusColor(status.identifier)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        style={[$.fw_semibold, { color: '#333', fontSize: 16 }]}
                      >
                        {status.displaytext}
                      </AppText>
                    </View>
                    <CustomIcon
                      name={CustomIcons.RightChevron}
                      size={20}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={{
                  padding: 24,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E9ECEF',
                  borderStyle: 'dashed',
                }}
              >
                <CustomIcon
                  name={CustomIcons.StatusIndicator}
                  size={32}
                  color="#ADB5BD"
                />
                <AppText style={[$.text_tint_3, $.mt_small, $.text_center]}>
                  No status options available
                </AppText>
              </View>
            )}
          </ScrollView>
        </BottomSheetComponent>

        <DatePickerComponent
          date={seleteddate || new Date()}
          show={showdatepicker}
          mode="date"
          setShow={setshowdatepicker}
          setDate={date => {
            // Set to null when "clearing" the date
            setselectedate(date);
          }}
        />

        <BottomSheetComponent
          ref={paymentSheetRef}
          screenname="Payment Details"
          Save={() => {
            const paymentReq = new UpdatePaymentReq();
            paymentReq.appoinmentid = seletecedappinmentid;
            paymentReq.paymenttype = selectedPaymentType;
            paymentReq.paymenttypeid =
              selectedPaymentType === 'Cash'
                ? 1
                : selectedPaymentType === 'Card'
                ? 2
                : 3;
            paymentReq.amount = Number(paymentAmount) || 0;
            paymentReq.paymentname = paymentName;
            paymentReq.paymentcode = paymentCode;
            paymentReq.statusid = 1;
            paymentReq.customername = '';
            paymentReq.customerid = 0;
            paymentReq.organisationid = usercontext.value.organisationid || 0;
            paymentReq.organisationlocationid =
              usercontext.value.organisationlocationid || 0;

            Updatepayment(paymentReq);
            paymentSheetRef.current?.close();
          }}
          close={() => paymentSheetRef.current?.close()}
        >
          <ScrollView contentContainerStyle={[]} nestedScrollEnabled={true}>
            {/* Payment Type Selection */}
            <View style={{ marginBottom: 20 }}>
              <AppText style={[$.fw_medium, $.mb_small, { color: '#495057' }]}>
                Payment Method
              </AppText>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {['Cash', 'Card', 'Online'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        selectedPaymentType === type ? '#1976D2' : '#E0E0E0',
                      backgroundColor:
                        selectedPaymentType === type ? '#E3F2FD' : '#FFFFFF',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => setSelectedPaymentType(type)}
                  >
                    <CustomIcon
                      name={
                        type === 'Cash'
                          ? CustomIcons.CashPayment
                          : type === 'Card'
                          ? CustomIcons.OnlinePayment
                          : CustomIcons.OnlinePayment
                      }
                      size={24}
                      color={
                        selectedPaymentType === type ? '#1976D2' : '#666666'
                      }
                    />
                    <AppText
                      style={{
                        marginTop: 8,
                        color:
                          selectedPaymentType === type ? '#1976D2' : '#666666',
                        fontWeight: '500',
                      }}
                    >
                      {type}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Input */}
            <FormInput
              label="Amount"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              containerStyle={{ marginBottom: 16 }}
            />

            {/* Payment Name */}
            <FormInput
              label="Payment Name (Optional)"
              value={paymentName}
              onChangeText={setPaymentName}
              placeholder="e.g., Credit Card, UPI, etc."
              containerStyle={{ marginBottom: 16 }}
            />

            {/* Payment Code */}
            <FormInput
              label="Payment Code/Reference"
              value={paymentCode}
              onChangeText={setPaymentCode}
              placeholder="Transaction ID or Reference"
              containerStyle={{ marginBottom: 16 }}
            />
          </ScrollView>
        </BottomSheetComponent>
      </AppView>
    </SafeAreaView>
  );
}
