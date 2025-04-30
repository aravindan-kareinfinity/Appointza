import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
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

type DashboardScreenProps = {
  // Add any props if needed
};

export function DashboardScreen() {
  const usercontext = useAppSelector(selectusercontext);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [selectlocation, Setselectlocation] = useState<OrganisationLocationStaffRes | null>(null);
  const [locationlist, Setlocationlist] = useState<OrganisationLocationStaffRes[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<AppointmentPaymentsummary>(new AppointmentPaymentsummary());

  // Load data when screen focuses or location changes
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
      const res = await organisationlocationservice.SelectAppointmentPaymentsummary(req);
      
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
    <AppView style={[$.p_small, $.mb_small, $.border, $.border_tint_8, $.border_rounded, $.bg_tint_10]}>
      <AppView style={[$.flex_row, $.justify_content_center]}>
        <AppText style={[$.fw_semibold, $.text_primary5]}>{item.paymentmodetype}</AppText>
        <AppText style={[$.fw_bold, $.text_primary2]}>₹{item.totalamount.toLocaleString('en-IN')}</AppText>
      </AppView>
    </AppView>
  );

  return (
    <ScrollView style={[$.flex_1, $.bg_tint_11, $.p_small]}>
      <AppText style={[$.fs_medium, $.fw_semibold, $.mb_medium, $.text_primary2]}>
        Dashboard
      </AppText>

      {/* Location Selector */}
      {locationlist.length > 1 && (
        <AppSingleSelect
          data={locationlist}
          keyExtractor={e => e.organisationlocationid.toString()}
          searchKeyExtractor={e => e.name}
          renderItemLabel={item => (
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
              {item.name}
            </AppText>
          )}
          selecteditemid={selectlocation?.organisationlocationid.toString() || ''}
          onSelect={handleLocationChange}
          title="Select Location"
          style={[$.mb_normal]}
        />
      )}

      {isLoading ? (
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center, $.p_large]}>
          <ActivityIndicator size="large" color={$.tint_3} />
        </AppView>
      ) : (
        <>
          {/* Summary Cards */}
          <AppView style={[$.flex_row, $.mb_medium, {gap: 10}]}>
            <AppView style={[$.flex_1, $.p_medium, $.border_rounded, $.bg_tint_10]}>
              <AppText style={[$.fs_small, $.text_tint_3, $.mb_tiny]}>Total Appointments</AppText>
              <AppText style={[$.fs_large, $.fw_bold, $.text_primary5]}>
                {paymentSummary.totalappointments}
              </AppText>
            </AppView>

            <AppView style={[$.flex_1, $.p_medium, $.border_rounded, $.bg_tint_10]}>
              <AppText style={[$.fs_small, $.text_tint_3, $.mb_tiny]}>Confirmed</AppText>
              <AppText style={[$.fs_large, $.fw_bold, $.text_success]}>
                {paymentSummary.confirmedcount}
              </AppText>
            </AppView>

            <AppView style={[$.flex_1, $.p_medium, $.border_rounded, $.bg_tint_10]}>
              <AppText style={[$.fs_small, $.text_tint_3, $.mb_tiny]}>Completed</AppText>
              <AppText style={[$.fs_large, $.fw_bold, $.text_primary2]}>
                {paymentSummary.completedcount}
              </AppText>
            </AppView>
          </AppView>

          {/* Payment Summary */}
          <AppView style={[$.mb_medium]}>
            <AppText style={[$.fs_medium, $.fw_semibold, $.mb_small, $.text_primary5]}>
              Payment Summary
            </AppText>
            
            {paymentSummary.paymentsummary.length > 0 ? (
              <FlatList
                data={paymentSummary.paymentsummary}
                renderItem={renderPaymentMethod}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            ) : (
              <AppText style={[$.text_tint_3, $.p_small]}>No payment data available</AppText>
            )}

            {/* Total Amount */}
            <AppView style={[$.mt_small, $.p_medium, $.border_rounded, $.bg_tint_9]}>
              <AppView style={[$.flex_row, $.justify_content_center]}>
                <AppText style={[$.fw_bold, $.text_primary5]}>Total Revenue</AppText>
                <AppText style={[$.fw_bold, $.text_primary2]}>
                  ₹{paymentSummary.paymentsummary.reduce((sum, item) => sum + item.totalamount, 0).toLocaleString('en-IN')}
                </AppText>
              </AppView>
            </AppView>
          </AppView>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={() => selectlocation && getLocationDetail(selectlocation.organisationlocationid)}
            style={[$.p_small, $.border_rounded, $.bg_primary2, $.align_items_center]}>
            <AppText style={[$.text_tint_11, $.fw_semibold]}>Refresh Data</AppText>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// Add this if not already in your imports
import {useFocusEffect} from '@react-navigation/native';