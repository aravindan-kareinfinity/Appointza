import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {AppButton} from '../../components/appbutton.component';
import {AppTextInput} from '../../components/apptextinput.component';
import {UsersGetOtpReq, UsersLoginReq} from '../../models/users.model';
import {UsersService} from '../../services/users.service';
import {AppAlert} from '../../components/appalert.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {TouchableOpacity} from 'react-native';

type LoginScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList>,
  NativeStackScreenProps<AppStackParamList, 'Login'>
>;
export function LoginScreen() {
  const navigation = useNavigation<LoginScreenProp['navigation']>();
  const route = useRoute<LoginScreenProp['route']>();
  const usercontext = useAppSelector(selectusercontext);
  const dispatch = useAppDispatch();
  const usersservice = useMemo(() => new UsersService(), []);
  const [isloading, setIsloading] = useState(false);
  const [isotpsent, setIsotpsent] = useState(false);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const login = async () => {
    setIsloading(true);
    try {
      let loginreq = new UsersLoginReq();
      loginreq.mobile = mobile;
      loginreq.otp = otp;
      let loginresp = await usersservice.login(loginreq);
      dispatch(usercontextactions.set(loginresp!));
      navigation.navigate('HomeTab');
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
  const getOtp = async () => {
  
    setIsloading(true);
    try {
      let getotpreq = new UsersGetOtpReq();
      getotpreq.mobile = mobile;
      // getotpreq.organisationtype = OrganisationTypes.Supplier;
      let getotpresp = await usersservice.GetOtp(getotpreq);
      setName(getotpresp!.name);
      setIsotpsent(true);
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  
  const gotoSignUp = (value:boolean) => {
    navigation.navigate('SignUp',{isorganization:value});
  };
  return (
    <AppView style={[$.flex_1]}>
      <AppView style={[$.align_items_center, $.pt_colossal, $.mb_giant]}>
        <AppText style={[$.fw_bold, $.fs_enormous, $.text_tint_9]}>
          Login
        </AppText>
      </AppView>
      <AppView style={[$.justify_content_center, $.px_normal]}>
        <AppTextInput
          style={[
            isotpsent ? $.mb_small : $.mb_giant,
            $.border_bottom,
            $.border_tint_8,
            $.bg_tint_11,
          ]}
          placeholder="Mobile number"
          value={mobile}
          onChangeText={e => {
            setMobile(e);
          }}
        />
        {isotpsent && (
          <AppTextInput
            style={[$.mb_giant, $.border_bottom, $.border_tint_8, $.bg_tint_11]}
            placeholder="OTP"
            value={otp}
            onChangeText={e => {
              setOtp(e);
            }}
          />
        )}
      </AppView>
      <AppView style={[$.justify_content_center, $.px_normal]}>
        {isotpsent && (
          <AppButton
            name="Login"
            style={[$.bg_tint_10, $.mb_small]}
            textstyle={[$.text_tint_1, $.fs_compact, $.fw_medium]}
            onPress={login}
          />
        )}
        <AppButton
          name={isotpsent ? 'Resend OTP' : 'Get OTP'}
          style={[$.bg_tint_10, $.mb_small]}
          textstyle={[$.text_tint_1, $.fs_compact, $.fw_medium]}
          onPress={getOtp}
        />
      </AppView>
      <AppView style={[$.align_items_center, $.flex_row, $.px_massive]}>
        <AppText style={[$.fs_small, $.fw_regular, $.text_tint_6]}>
          Don't Have an account ? {}
        </AppText>
        <TouchableOpacity onPress={()=>{gotoSignUp(false)}}>
          <AppText style={[$.text_tint_2]}>Sign Up</AppText>
        </TouchableOpacity>
      </AppView>

      
    </AppView>
  );
}
