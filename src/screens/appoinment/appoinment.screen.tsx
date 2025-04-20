import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
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

type AppoinmentScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Appoinment'>,
  NativeStackScreenProps<AppStackParamList>
>;

export function AppoinmentScreen() {
  const navigation = useNavigation<AppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isorganisation, setisorganisation] = useState(false);

  // Refs for bottom sheets
  const addStaffSheetRef = useRef<any>(null);
  const statusSheetRef = useRef<any>(null);
  const paymentSheetRef = useRef<any>(null);

  // Data states
  const [OrganisationApponmentlist, setOrganisationAppoinmentList] = useState<
    BookedAppoinmentRes[]
  >([]);
  const [locationlist, Setlocationlist] = useState<
    OrganisationLocationStaffRes[]
  >([]);
  const [selectlocation, Setselectlocation] =
    useState<OrganisationLocationStaffRes | null>(null);
  const [UserApponmentlist, setUserAppoinmentList] = useState<
    BookedAppoinmentRes[]
  >([]);
  const [stafflist, setStafflist] = useState<StaffUser[]>([]);
  const [AppinmentStatuslist, setAppoinmentStatuslist] = useState<
    ReferenceValue[]
  >([]);

  // Services
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
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
    if (selectlocation && isorganisation) {
      getorganisationappoinment(
        selectlocation.organisationid,
        selectlocation.organisationlocationid,
      );
      getstafflist();
    }
  }, [selectlocation, isorganisation]);

  const loadInitialData = async () => {
    setIsloading(true);
    try {
      await getstafflocation();
      await fetchStatusReferenceTypes();
      if (usercontext.value.userid > 0) {
        await getuserappoinment();
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isorganisation) {
        if (selectlocation) {
          await getorganisationappoinment(
            selectlocation.organisationid,
            selectlocation.organisationlocationid,
          );
        }
      } else {
        await getuserappoinment();
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

  const getorganisationappoinment = async (orgid: number, locid: number) => {
    try {
      setIsloading(true);
      const req = new AppoinmentSelectReq();
      req.organisationlocationid = locid;
      req.organisationid = orgid;
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

  const handleToggleView = () => {
    setisorganisation(!isorganisation);
  };

  const handleLocationChange = (item: OrganisationLocationStaffRes) => {
    Setselectlocation(item);
  };

  const Assignstaff=async(staffid:number,staffname:string)=>{
    try {
      setIsloading(true);
      var req = new AddStaffReq()
      req.appoinmentid=seletecedappinmentid,
      req.organisationid=selectlocation?.organisationid ?? 0,
      req.organisationlocationid=selectlocation?.organisationlocationid ?? 0,
      req.staffid=staffid
      req.staffname = staffname
      const response = await appoinmentservices.Assignstaff(req);
      Alert.alert(environment.baseurl,"staff assigned succesfully")
      if (response) {
        loadInitialData();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsloading(false);
    }
  }

  const Updatestatus=async(statusid:number,statuscode:string)=>{
    try {
      setIsloading(true);
      var req = new UpdateStatusReq()
      req.appoinmentid=seletecedappinmentid
      req.organisationid=selectlocation?.organisationid ?? 0,
      req.organisationlocationid=selectlocation?.organisationlocationid ?? 0,
      req.statusid=statusid
      req.statuscode= statuscode
      req.statustype =""
   
      const response = await appoinmentservices.UpdateStatus(req);
      Alert.alert(environment.baseurl,"staff assigned succesfully")
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
  
  const [seletecedappinmentid,Setselectedappoinmentid] =useState(0)
  const renderAppointmentItem = ({item}: {item: BookedAppoinmentRes}) => (
    <TouchableOpacity
      style={[
        $.mx_small,
        $.mb_small,
        $.border,
        $.border_tint_3,
        $.border_rounded2,
        $.bg_tint_11,
        $.p_small,
        $.pt_regular,
        {borderLeftWidth: 8},
        $.flex_row,
      ]}
      onPress={() => {}}>
      <AppView
        style={[$.flex_row, $.align_items_center, $.mb_small, $.flex_column]}>
        <AppText style={[$.fw_medium, $.fs_small, $.text_primary5, $.mr_tiny]}>
          {item.fromtime.toString().substring(0, 5)}
        </AppText>
        <AppView style={[$.flex_1, $.border, $.border_tint_7]}></AppView>
        <AppText style={[$.fw_medium, $.fs_small, $.text_primary5, $.ml_tiny]}>
          {item.totime.toString().substring(0, 5)}
        </AppText>
      </AppView>
      <AppView style={[$.flex_1]}>
        <AppText
          style={[$.fw_semibold, $.fs_regular, $.mb_small, $.text_primary5]}>
          {new Date(item.appoinmentdate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </AppText>

        <AppView>
          <AppText>{item.staffname?? ''}</AppText>
          <AppText>{item.statuscode?? ''}</AppText>
          <AppText>{item.ispaid ? 'paid':''}</AppText>
        </AppView>

        <AppView style={[$.mb_small]}>
          <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
            <CustomIcon
              size={30}
              color={$.tint_3}
              name={isorganisation ? CustomIcons.Account : CustomIcons.Shop}
            />
            <AppView style={[$.flex_column, $.align_items_center]}>
              <AppText
                style={[$.ml_small, $.fw_semibold, $.text_tint_1, $.fs_small]}>
                {isorganisation ? item.username : item.organisationname}
              </AppText>
              <AppText
                style={[$.ml_small, $.fw_medium, $.text_tint_3, $.fs_small]}>
                {isorganisation
                  ? item.mobile || 'No mobile'
                  : item.city || 'No location'}
              </AppText>
            </AppView>
          </AppView>
        </AppView>

        {item.attributes?.servicelist?.length > 0 && (
          <AppView style={[!isorganisation ? $.mb_big:$.mb_tiny,{paddingVertical: 4}]}>
            <AppView
              style={[
                $.flex_row,
                $.align_items_center,
                {justifyContent: 'space-between', marginBottom: 4},
              ]}>
              <AppText style={[$.fw_medium, $.fs_small, $.text_primary5]}>
                Services
              </AppText>
              <AppText
                style={[
                  $.fw_regular,
                  $.fs_small,
                  $.text_tint_11,
                  {
                    backgroundColor: $.danger,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  },
                ]}>
                ₹
                {item.attributes.servicelist
                  .reduce(
                    (total, service) =>
                      total + (Number(service.serviceprice) || 0),
                    0,
                  )
                  .toString()}
              </AppText>
            </AppView>

            {item.attributes.servicelist.map((service, index) => (
              <AppView
                key={index}
                style={[
                  $.flex_row,
                  $.align_items_center,
                  {
                    justifyContent: 'space-between',
                    paddingVertical: 2,
                    borderBottomWidth: 0.5,
                    borderColor: '#e0e0e0',
                  },
                ]}>
                <AppText
                  style={[
                    $.fw_regular,
                    $.fs_small,
                    $.text_tint_ash,
                    {flex: 1, flexShrink: 1},
                  ]}>
                  {service.servicename}
                </AppText>
                <AppText
                  style={[
                    $.fw_semibold,
                    $.fs_small,
                    $.text_success,
                    {marginLeft: 8},
                  ]}>
                  ₹{service.serviceprice}
                </AppText>
              </AppView>
            ))}
          </AppView>
        )}

{  isorganisation &&      <AppView style={[$.flex_row, $.align_items_center, $.mt_small]}>
      {stafflist.length > 0 &&    <TouchableOpacity
           style={[$.flex_row]}
            onPress={() =>{ addStaffSheetRef.current?.open() ; Setselectedappoinmentid(item.id)}}
          ><AppText>Assign</AppText>
             <CustomIcon
          size={20}
          color={$.tint_3}
          name={ CustomIcons.AddAccount }
        /></TouchableOpacity>}
          <AppButton
            name={'Status'}
            onPress={() => {Setselectedappoinmentid(item.id); statusSheetRef.current?.open()}}
            style={[$.mx_small]}
          />
          <AppButton
            name={'Payment'}
            onPress={() =>{ Setselectedappoinmentid(item.id); paymentSheetRef.current?.open()}}
          />
        </AppView>}
      </AppView>
    </TouchableOpacity>
  );

  return (
    <AppView style={[$.flex_1, $.bg_tint_11]}>
      {/* Header Section */}
      <AppView style={[$.flex_row, $.mb_tiny, $.p_small, $.align_items_center]}>
        <CustomIcon
          size={30}
          color={$.tint_3}
          name={!isorganisation ? CustomIcons.Account : CustomIcons.Shop}
        />
        <AppText
          style={[
            $.fs_medium,
            $.fw_semibold,
            $.py_small,
            $.text_primary2,
            $.flex_1,
          ]}>
          Appointments
        </AppText>
        {selectlocation && selectlocation.organisationlocationid > 0 && (
          <AppSwitch onValueChange={handleToggleView} value={isorganisation} />
        )}
      </AppView>

      {/* Location Selector */}
      {isorganisation && locationlist.length > 1 && (
        <AppSingleSelect
          data={locationlist}
          keyExtractor={e => e.organisationlocationid.toString()}
          searchKeyExtractor={e => e.name}
          renderItemLabel={item => (
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
              {item.name}
            </AppText>
          )}
          selecteditemid={
            selectlocation?.organisationlocationid.toString() || ''
          }
          onSelect={handleLocationChange}
          title="Select Location"
          style={[$.mb_normal]}
        />
      )}
      <ScrollView>
        {/* Loading Indicator */}
        {isloading && !isRefreshing ? (
          <AppView
            style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <ActivityIndicator size="large" color={$.tint_3} />
            <AppText style={[$.mt_medium, $.text_primary5]}>
              Loading appointments...
            </AppText>
          </AppView>
        ) : (
          <FlatList
            data={
              isorganisation ? OrganisationApponmentlist : UserApponmentlist
            }
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
                  {isorganisation
                    ? 'No appointments for this location'
                    : 'You have no appointments yet'}
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
          // Handle save for staff
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
                  // Handle staff selection
                  Assignstaff(staff.id,staff.name)
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
          // Handle save for status
          statusSheetRef.current?.close();
        }}
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
                  // Handle status selection
                  Updatestatus(status.id,status.identifier)
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

      <BottomSheetComponent
  ref={paymentSheetRef}
  screenname="Payment Options"
  Save={() => {
    // Handle save for payment
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
    <AppView style={[$.flex_row, $.mb_small]}>
      <TouchableOpacity
        style={[$.p_small, $.mr_small, $.bg_tint_10, $.border_rounded]}
        onPress={() => setSelectedPaymentType('Cash')}>
        <AppText style={[$.fw_medium, selectedPaymentType === 'Cash' && $.text_success]}>Cash</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[$.p_small, $.mr_small, $.bg_tint_10, $.border_rounded]}
        onPress={() => setSelectedPaymentType('Card')}>
        <AppText style={[$.fw_medium, selectedPaymentType === 'Card' && $.text_success]}>Card</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[$.p_small, $.bg_tint_10, $.border_rounded]}
        onPress={() => setSelectedPaymentType('Online')}>
        <AppText style={[$.fw_medium, selectedPaymentType === 'Online' && $.text_success]}>Online</AppText>
      </TouchableOpacity>
    </AppView>

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

    {/* Save Button */}
    <AppButton
      name="Save Payment"
      onPress={() => {
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
      }}
      style={[$.mt_medium]}
    />
  </ScrollView>
</BottomSheetComponent>
    </AppView>
  );
}
