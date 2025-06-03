import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {FormInput} from '../../components/forminput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {ScrollView, TouchableOpacity, Alert} from 'react-native';
import {
  Organisationdeletereq,
  Users,
  UsersSelectReq,
} from '../../models/users.model';
import {UsersService} from '../../services/users.service';
import {useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {AppAlert} from '../../components/appalert.component';
import {useSelector} from 'react-redux';
import {selectiscustomer} from '../../redux/iscustomer.redux';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {store} from '../../redux/store.redux';
import { Button } from '../../components/button.component';

type ProfileScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Profile'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenProp['navigation']>();
  const [profile, setProfile] = useState(new Users());
  const [isloading, setIsloading] = useState(false);
  const isCustomer = useSelector(selectiscustomer).isCustomer;
  const [otp, setOtp] = useState('');
  const deleteSheetRef = useRef<any>(null);
  const usersservice = useMemo(() => new UsersService(), []);
  const usercontext = useAppSelector(selectusercontext);

  useEffect(() => {
    getdata();
  }, []);

  const getdata = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        const selectreq = new UsersSelectReq();
        selectreq.id = usercontext.value.userid;
        const resp = await usersservice.select(selectreq);
        setProfile(resp[0]);
      }
    } catch (error: any) {
      AppAlert({
        message: error?.response?.data?.message || 'Failed to load profile',
      });
    } finally {
      setIsloading(false);
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      `Confirm Permanent Deletion`,
      `Are you sure you want to permanently delete your ${
        isCustomer ? 'account' : 'organization'
      }? This action cannot be undone and all data will be lost.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => deleteSheetRef.current?.open(),
        },
      ],
    );
  };

  const handleDelete = async () => {
    setIsloading(true);
    try {
      const req = new Organisationdeletereq();
      req.organisationid = usercontext.value.organisationid;
      req.userid = usercontext.value.userid;
      req.otp = otp;

      if (isCustomer) {
        await usersservice.Deleteuserpermanent(req);
        AppAlert({message: 'Account deleted successfully'});
      } else {
        await usersservice.DeleteOrganisationPermananet(req);
        AppAlert({message: 'Organization deleted successfully'});
      }

      // Logout or navigate after successful deletion
      navigation.goBack();
      store.dispatch(usercontextactions.clear());
    } catch (error: any) {
      AppAlert({message: error?.response?.data?.message || 'Deletion failed'});
    } finally {
      setIsloading(false);
      deleteSheetRef.current?.close();
    }
  };

  const saveProfile = async () => {
    setIsloading(true);
    try {
      await usersservice.save(profile);
      AppAlert({message: 'Profile saved successfully'});
      navigation.goBack();
    } catch (error: any) {
      AppAlert({
        message: error?.response?.data?.message || 'Failed to save profile',
      });
    } finally {
      setIsloading(false);
    }
  };

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      <AppView style={[$.flex_1]}>
        {/* Header */}
        <AppView
          style={[$.flex_row, $.ml_regular, $.align_items_center, $.mb_medium]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <CustomIcon
              name={CustomIcons.LeftArrow}
              size={$.s_regular}
              color={$.tint_2}
            />
          </TouchableOpacity>
          <AppText
            style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
            Profile
          </AppText>
        </AppView>

        {/* Profile Fields */}
        <AppView style={[$.px_regular]}>
          <FormInput
            label="Name"
            value={profile.name}
            onChangeText={text => setProfile({...profile, name: text})}
            placeholder="Enter your name"
            containerStyle={{ marginBottom: 16 }}
          />
          <FormInput
            label="Role"
            value={profile.designation}
            onChangeText={text => setProfile({...profile, designation: text})}
            placeholder="Enter your role"
            containerStyle={{ marginBottom: 16 }}
          />
          <FormInput
            label="Contact"
            value={profile.mobile}
            onChangeText={text => setProfile({...profile, mobile: text})}
            placeholder="Enter your contact number"
            keyboardType="phone-pad"
            containerStyle={{ marginBottom: 16 }}
          />
        </AppView>
      </AppView>

      {/* Delete Button */}
      <TouchableOpacity style={[$.m_large]} onPress={confirmDeletion}>
        <AppText style={[$.text_danger]}>
          Delete permanently my {isCustomer ? 'account' : 'organization'}
        </AppText>
      </TouchableOpacity>

      {/* Action Buttons */}
      <AppView
        style={[
          $.flex_row,
          $.justify_content_center,
          $.mx_regular,
          $.mb_normal,
        ]}>
        <Button title={'Cancel'} variant='cancel' style={[$.flex_1, $.mr_small]}
        onPress={() => {
          navigation.goBack();
        }}/>
        <Button title={'Save'} variant='save' style={[$.flex_1]}
        onPress={saveProfile}/>
        
      </AppView>

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheetComponent
        ref={deleteSheetRef}
        screenname={`Delete ${isCustomer ? 'Account' : 'Organization'}`}
        Save={handleDelete}
        close={() => deleteSheetRef.current?.close()}
        showbutton={false}>
        <ScrollView
          contentContainerStyle={[$.p_medium]}
          nestedScrollEnabled={true}>
          <AppText style={[$.fw_semibold, $.mb_medium, $.text_danger]}>
            Warning: This action cannot be undone!
          </AppText>
          <AppText style={[$.mb_medium]}>
            All your{' '}
            {isCustomer
              ? 'personal data and account information'
              : 'organization data, services, and staff information'}{' '}
            will be permanently deleted.
          </AppText>

          {/* <AppTextInput
            style={[$.bg_tint_11, $.mb_medium]}
            placeholder="Enter OTP received on your mobile"
            value={otp}
            onChangeText={setOtp}
            keyboardtype="numeric"
          /> */}

          {/* <AppText style={[$.fs_small, $.text_tint_5]}>
            You'll receive an OTP on your registered mobile number to confirm this action.
          </AppText> */}

          <AppButton
            name="Confirm Delete"
            style={[$.bg_danger, $.flex_1]}
            textStyle={[$.text_tint_11]}
            onPress={handleDelete}
          />
        </ScrollView>
      </BottomSheetComponent>
    </AppView>
  );
}
