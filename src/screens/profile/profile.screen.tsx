import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {TouchableOpacity} from 'react-native';
import {
  Users,
  UsersContext,
  UsersRegisterReq,
  UsersSelectReq,
} from '../../models/users.model';
import {UsersService} from '../../services/users.service';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppAlert} from '../../components/appalert.component';

type ProfileScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Profile'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenProp['navigation']>();
  const [profile, setProfile] = useState(new Users());
  const [isloading, setIsloading] = useState(false);

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
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  const saveProfile = async () => {
    setIsloading(true);
    try {
      let saveresp = await usersservice.save(profile);
      AppAlert({message: 'saved'});
      navigation.goBack();
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      <AppView style={[$.flex_1]}>
        <AppView
          style={[$.flex_row, $.ml_regular, $.align_items_center, $.mb_medium]}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}>
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
        <AppTextInput
          style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
          placeholder="Name"
          value={profile.name}
          onChangeText={text => {
            setProfile({
              ...profile,
              name: text,
            });
          }}
        />
        <AppTextInput
          style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
          placeholder="Role"
          value={profile.designation}
          onChangeText={text => {
            setProfile({
              ...profile,
              designation: text,
            });
          }}
        />

        <AppTextInput
          style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
          placeholder="Contact"
          value={profile.mobile}
          onChangeText={text => {
            setProfile({
              ...profile,
              mobile: text,
            });
          }}
        />
      </AppView>
      <AppView
        style={[
          $.flex_row,
          $.justify_content_center,
          $.mx_regular,
          $.mb_normal,
        ]}>
        <AppButton
          name="Cancel"
          style={[$.bg_tint_10, $.flex_1, $.mr_huge]}
          textstyle={[$.text_danger]}
          onPress={() => {}}
        />
        <AppButton
          name="Save"
          style={[$.bg_success, $.flex_1]}
          textstyle={[$.text_tint_11]}
          onPress={saveProfile}
        />
      </AppView>
    </AppView>
  );
}
