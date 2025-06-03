import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import { DatePickerComponent } from '../../components/Datetimepicker.component';
import {FormSelect} from '../../components/formselect.component';

type BussinessAppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'BussinessAppoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function BussinessAppoinmentScreen() {
  const navigation = useNavigation<BussinessAppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for bottom sheets
  const addStaffSheetRef = useRef<any>(null);
  const statusSheetRef = useRef<any>(null);
  const paymentSheetRef = useRef<any>(null);

  // Data states
  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<BookedAppoinmentRes[]>([]);
  const [locationlist, Setlocationlist] = useState<OrganisationLocationStaffRes[]>([]);
  const [selectlocation, Setselectlocation] = useState<OrganisationLocationStaffRes | null>(null);
  const [stafflist, setStafflist] = useState<StaffUser[]>([]);
  const [AppinmentStatuslist, setAppoinmentStatuslist] = useState<ReferenceValue[]>([]);

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
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
    if (selectlocation) {
      getorganisationappoinment(
        selectlocation.organisationid,
        selectlocation.organisationlocationid,
      );
      getstafflist();
    }
  }, [selectlocation]);
    const [showdatepicker, setshowdatepicker] = useState(false);
  const [seleteddate, setselectedate] =  useState<Date | null>(null);
  const loadInitialData = async () => {
    setIsloading(true);
    try {
      await getstafflocation();
      await fetchStatusReferenceTypes();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (selectlocation) {
        await getorganisationappoinment(
          selectlocation.organisationid,
          selectlocation.organisationlocationid,
        );
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getstafflocation = async () => {
    try {
      const req = new OrganisationLocationStaffReq();
      req.userid = usercontext.value.userid;
      const res = await organisationLocationService.Selectlocation(req);

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

  const getorganisationappoinment = async (orgid: number, locid: number) => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
      if(seleteddate){
        req.appointmentdate  = seleteddate;
      }
      console.log("resssssssssss",req);
      
      const res = await appoinmentservices.SelectBookedAppoinment(req);
      setOrganisationAppoinmentList(res || []);
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const getstafflist = async () => {
    if (!selectlocation) return;

    try {
      setIsloading(true);
      const req = new StaffSelectReq();
      req.organisationid = selectlocation.organisationid;
      req.organisationlocationid = selectlocation.organisationlocationid;
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
    AppAlert({message});
  };

  const handleLocationChange = (item: OrganisationLocationStaffRes) => {
    Setselectlocation(item);
  };

  const Assignstaff = async (staffid: number, staffname: string) => {
    try {
      setIsloading(true);
      var req = new AddStaffReq()
      req.appoinmentid = seletecedappinmentid,
      req.organisationid = selectlocation?.organisationid ?? 0,
      req.organisationlocationid = selectlocation?.organisationlocationid ?? 0,
      req.staffid = staffid
      req.staffname = staffname
      const response = await appoinmentservices.Assignstaff(req);
      Alert.alert(environment.baseurl, "staff assigned succesfully")
      if (response) {
        loadInitialData();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  }

  const Updatestatus = async (statusid: number, statuscode: string) => {
    try {
      setIsloading(true);
      var req = new UpdateStatusReq()
      req.appoinmentid = seletecedappinmentid
      req.organisationid = selectlocation?.organisationid ?? 0,
      req.organisationlocationid = selectlocation?.organisationlocationid ?? 0,
      req.statusid = statusid
      req.statuscode = statuscode
      req.statustype = ""
   
      const response = await appoinmentservices.UpdateStatus(req);
      Alert.alert(environment.baseurl, "status updated successfully")
      if (response) {
        loadInitialData();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  }

  const Updatepayment = async (paymentData: UpdatePaymentReq) => {
    try {
      setIsloading(true);
      const response = await appoinmentservices.UpdatePayment(paymentData);
      Alert.alert(environment.baseurl, "Payment updated successfully");
      if (response) {
        loadInitialData();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  }

  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('Cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentName, setPaymentName] = useState<string>('');
  const [paymentCode, setPaymentCode] = useState<string>('');
  
  const [seletecedappinmentid, Setselectedappoinmentid] = useState(0)

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

  const renderAppointmentItem = ({item}: {item: BookedAppoinmentRes}) => (
    <TouchableOpacity
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
        borderLeftColor: '#4a6da7'
      }}
      activeOpacity={0.9}
      onPress={() => {}}>
      
      {/* Header with Date and Time */}
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
        <Text style={{fontWeight: 'bold', fontSize: 16, color: '#333', flex: 1}}>
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        
        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', padding: 4, borderRadius: 4}}>
          <Text style={{fontWeight: '500', fontSize: 12, color: '#495057', marginRight: 4}}>
            {item.fromtime.toString().substring(0, 5)}
          </Text>
          <Text style={{fontWeight: '300', fontSize: 12, color: '#adb5bd'}}>-</Text>
          <Text style={{fontWeight: '500', fontSize: 12, color: '#495057', marginLeft: 4}}>
            {item.totime.toString().substring(0, 5)}
          </Text>
        </View>
      </View>
  
      {/* Client Info */}
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
        <View style={{
          backgroundColor: '#e9ecef', 
          padding: 8, 
          borderRadius: 4,
          justifyContent: 'center',
          alignItems: 'center',
          width: 40, 
          height: 40
        }}>
          <CustomIcon
            size={24}
            color="#4a6da7"
            name={CustomIcons.Account}
          />
        </View>
        
        <View style={{marginLeft: 16, flex: 1}}>
          <Text style={{fontWeight: '600', fontSize: 16, color: '#333'}}>
            {item.username}
          </Text>
          <Text style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
            {item.mobile || 'No mobile provided'}
          </Text>
        </View>
      </View>
  
      {/* Status and Staff Badges */}
      <View style={{flexDirection: 'row', marginBottom: 16, gap: 8}}>
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#e9ecef', 
          padding: 4, 
          borderRadius: 4,
          paddingHorizontal: 8
        }}>
          <CustomIcon
            name={
              item.statuscode === 'COMPLETED' ? CustomIcons.OnlinePayment :
              item.statuscode === 'CANCELLED' ? CustomIcons.CashPayment :
              item.statuscode === 'CONFIRMED' ? CustomIcons.StatusIndicator :
              CustomIcons.TimeCard
            }
            size={20}
            color={getStatusColor(item.statuscode)}
          />
          <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
            {item.statuscode || 'No status'}
          </Text>
        </View>
        
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#e9ecef', 
          padding: 4, 
          borderRadius: 4,
          paddingHorizontal: 8
        }}>
          <CustomIcon
            size={14}
            color="#adb5bd"
            name={CustomIcons.Account}
          />
          <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#495057'}}>
            {item.staffname || 'Unassigned'}
          </Text>
        </View>
        
        {item.ispaid && (
          <View style={{
            flexDirection: 'row', 
            alignItems: 'center', 
            borderWidth: 1,
            borderColor: '#28a745',
            padding: 4, 
            borderRadius: 4,
            paddingHorizontal: 8
          }}>
            <CustomIcon
              size={14}
              color="#28a745"
              name={CustomIcons.Circle}
            />
            <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#28a745'}}>
              Paid
            </Text>
          </View>
        )}
      </View>
  
      {/* Services List */}
      {item.attributes?.servicelist?.length > 0 && (
        <View style={{marginBottom: 16}}>
          <Text style={{fontWeight: '600', fontSize: 12, color: '#6c757d', marginBottom: 8}}>
            SERVICES
          </Text>
          
          <View style={{borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4}}>
            {item.attributes.servicelist.map((service, index) => (
              <View 
                key={index}
                style={{
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: index % 2 === 0 ? '#f1f3f5' : '#f8f9fa',
                  borderBottomWidth: index === item.attributes.servicelist.length - 1 ? 0 : 1,
                  borderBottomColor: '#e0e0e0'
                }}>
                <Text style={{fontWeight: '400', fontSize: 12, color: '#6c757d'}}>
                  {service.servicename}
                </Text>
                <Text style={{fontWeight: '600', fontSize: 12, color: '#4a6da7'}}>
                  ₹{service.serviceprice}
                </Text>
              </View>
            ))}
            
            {/* Total Price */}
            <View style={{
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: 8,
              backgroundColor: '#e9ecef'
            }}>
              <Text style={{fontWeight: '600', fontSize: 12, color: '#333'}}>
                Total
              </Text>
              <Text style={{fontWeight: '700', fontSize: 12, color: '#4a6da7'}}>
                ₹{item.attributes.servicelist
                  .reduce((total, service) => total + (Number(service.serviceprice) || 0), 0)
                  .toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      )}
  
      {/* Action Buttons */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 8}}>
        {stafflist.length > 0 && (
          <TouchableOpacity
            style={{
              flexDirection: 'row', 
              alignItems: 'center',
              padding: 8,
              borderWidth: 1,
              borderColor: '#4a6da7',
              borderRadius: 4,
              backgroundColor: '#f1f3f5'
            }}
            onPress={() => { 
              addStaffSheetRef.current?.open(); 
              Setselectedappoinmentid(item.id);
            }}>
            <CustomIcon
              size={16}
              color="#4a6da7"
              name={CustomIcons.AddAccount}
            />
            <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#4a6da7'}}>
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
            backgroundColor: '#f1f3f5'
          }}
          onPress={() => {
            Setselectedappoinmentid(item.id); 
            statusSheetRef.current?.open();
          }}>
          <CustomIcon
            size={16}
            color="#28a745"
            name={CustomIcons.Edit}
          />
          <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#28a745'}}>
            Status
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            flexDirection: 'row', 
            alignItems: 'center',
            padding: 8,
            borderWidth: 1,
            borderColor: '#4a6da7',
            borderRadius: 4,
            backgroundColor: '#f1f3f5'
          }}
          onPress={() => {
            Setselectedappoinmentid(item.id); 
            paymentSheetRef.current?.open();
          }}>
          <CustomIcon
            size={16}
            color="#4a6da7"
            name={CustomIcons.Save}
          />
          <Text style={{marginLeft: 4, fontWeight: '500', fontSize: 12, color: '#4a6da7'}}>
            Payment
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

    useEffect(() => {
      if (selectlocation) {
        getorganisationappoinment(
          selectlocation.organisationid,
          selectlocation.organisationlocationid,
        );
        getstafflist();
      }
    }, [seleteddate]);
  return (
    <AppView style={[$.flex_1, $.bg_tint_11]}>
      {/* Header Section */}
      <AppView style={[$.flex_row, $.mb_tiny, $.p_small, $.align_items_center]}>
     
        <AppText
          style={[
            $.fs_medium,
            $.fw_semibold,
            $.py_small,
           $.text_primary5,
            $.flex_1,
          ]}>
          Appointments
        </AppText>
         <TouchableOpacity
                  onPress={() => setshowdatepicker(true)}
                  style={[
                    $.border,
                    $.border_rounded,
                    $.mr_small,
                    $.align_items_center,
                    $.justify_content_center,
                  
                    $.border_tint_7,
                  ]}>
              
                  <AppText style={{fontSize: 14, fontWeight: 'bold', color: '#333'}}>
                    {seleteddate ? seleteddate.toDateString() : 'All Dates'}
                  </AppText>
                </TouchableOpacity>
      </AppView>

      {/* Location Selector */}
      {locationlist.length > 1 && (

        <AppView style={{marginLeft:10,marginRight:10}}>
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
          
      /></AppView>
      )}
      
      <ScrollView>
        {/* Loading Indicator */}
        {isloading && !isRefreshing ? (
          <AppView
            style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={[$.mt_medium, $.text_primary1]}>
              Loading appointments...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={OrganisationApponmentlist}
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
              <AppView
                style={[
                  $.flex_1,
                  $.justify_content_center,
                  $.align_items_center,
                  $.p_large,
                ]}>
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
                  onPress={handleRefresh}>
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
      </ScrollView>

      {/* Bottom Sheets */}
      <BottomSheetComponent
        ref={addStaffSheetRef}
        screenname="Add Staff"
        Save={() => {
          addStaffSheetRef.current?.close();
        }}
        close={() => addStaffSheetRef.current?.close()}>
        <ScrollView
          contentContainerStyle={[$.p_medium]}
          nestedScrollEnabled={true}>
          <AppText style={[$.fw_semibold, $.mb_medium]}>
            Available Staff Members
          </AppText>
          {stafflist.length > 0 ? (
            stafflist.map(staff => (
              <TouchableOpacity
                key={staff.id}
                style={[$.p_small, $.mb_small, $.bg_tint_10, $.border_rounded]}
                onPress={() => {
                  Assignstaff(staff.id, staff.name)
                  addStaffSheetRef.current?.close();
                }}>
                <AppText style={[$.fw_medium]}>{staff.name}</AppText>
                <AppText style={[$.text_tint_3, $.fs_small]}>
                  {staff.mobile}
                </AppText>
              </TouchableOpacity>
            ))
          ) : (
            <AppText style={[$.text_tint_3]}>
              No staff members available
            </AppText>
          )}
        </ScrollView>
      </BottomSheetComponent>

      <BottomSheetComponent
        ref={statusSheetRef}
        screenname="Change Status"
        Save={() => {
          statusSheetRef.current?.close();
        }}
        showbutton={false}
        close={() => statusSheetRef.current?.close()}>
        <ScrollView
          contentContainerStyle={[$.p_medium]}
          nestedScrollEnabled={true}>
          <AppText style={[$.fw_semibold, $.mb_medium]}>
            Select Appointment Status
          </AppText>
          {AppinmentStatuslist.length > 0 ? (
            AppinmentStatuslist.map(status => (
              <TouchableOpacity
                key={status.id}
                style={[$.p_small, $.mb_small, $.bg_tint_10, $.border_rounded]}
                onPress={() => {
                  Updatestatus(status.id, status.identifier)
                  statusSheetRef.current?.close();
                }}>
                <AppText style={[$.fw_medium]}>{status.displaytext}</AppText>
              </TouchableOpacity>
            ))
          ) : (
            <AppText style={[$.text_tint_3]}>
              No status options available
            </AppText>
          )}
        </ScrollView>
      </BottomSheetComponent>

      
       
<DatePickerComponent
  date={seleteddate || new Date()}
  show={showdatepicker}
  mode="date"
  setShow={setshowdatepicker}
  setDate={(date) => {
    // Set to null when "clearing" the date
    setselectedate(date); 
  }}
/>

      <BottomSheetComponent
        ref={paymentSheetRef}
        screenname="Payment Options"
        Save={() => {
          const paymentReq = new UpdatePaymentReq();
          paymentReq.appoinmentid = seletecedappinmentid;
          paymentReq.paymenttype = selectedPaymentType;
          paymentReq.paymenttypeid = selectedPaymentType === 'Cash' ? 1 : 
                                    selectedPaymentType === 'Card' ? 2 : 3;
          paymentReq.amount = Number(paymentAmount) || 0;
          paymentReq.paymentname = paymentName;
          paymentReq.paymentcode = paymentCode;
          paymentReq.statusid = 1; // Assuming 1 is for completed payment
          paymentReq.customername = ''; // Set if needed
          paymentReq.customerid = 0; // Set if needed
          paymentReq.organisationid = selectlocation?.organisationid ?? 0;
          paymentReq.organisationlocationid = selectlocation?.organisationlocationid ?? 0;
          
          Updatepayment(paymentReq);
          paymentSheetRef.current?.close();
          paymentSheetRef.current?.close();
        }}
        close={() => paymentSheetRef.current?.close()}>
        <ScrollView
          contentContainerStyle={[$.p_medium]}
          nestedScrollEnabled={true}>
          <AppText style={[$.fw_semibold, $.mb_medium]}>
            Payment Details
          </AppText>
          
          {/* Payment Type Selection */}
          <AppText style={[$.fw_medium, $.mb_tiny]}>Payment Type</AppText>
          <FormSelect
            label=""
            options={[
              { id: 1, name: 'Cash' },
              { id: 2, name: 'Card' },
              { id: 3, name: 'Online' }
            ]}
            selectedId={selectedPaymentType === 'Cash' ? 1 : 
                       selectedPaymentType === 'Card' ? 2 : 3}
            onSelect={(option) => {
              setSelectedPaymentType(option.name);
            }}
            containerStyle={{ marginBottom: 16 }}
          />

          {/* Amount Input */}
          <AppText style={[$.fw_medium, $.mb_tiny]}>Amount</AppText>
          <AppTextInput
            style={[$.p_small, $.border, $.border_tint_7, $.border_rounded, $.mb_small]}
            placeholder="Enter amount"
            keyboardtype="numeric"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
          />

          {/* Payment Name (Optional) */}
          <AppText style={[$.fw_medium, $.mb_tiny]}>Payment Name (Optional)</AppText>
          <AppTextInput
            style={[$.p_small, $.border, $.border_tint_7, $.border_rounded, $.mb_small]}
            placeholder="e.g., Credit Card, UPI, etc."
            value={paymentName}
            onChangeText={setPaymentName}
          />

          {/* Payment Code (Optional) */}
          <AppText style={[$.fw_medium, $.mb_tiny]}>Payment Code/Reference</AppText>
          <AppTextInput
            style={[$.p_small, $.border, $.border_tint_7, $.border_rounded, $.mb_small]}
            placeholder="Transaction ID or Reference"
            value={paymentCode}
            onChangeText={setPaymentCode}
          />

         
        </ScrollView>
      </BottomSheetComponent>
    </AppView>
  );
}