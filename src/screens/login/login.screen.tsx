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
import {Button} from '../../components/button.component';
import {FormInput} from '../../components/forminput.component';
import {UsersGetOtpReq, UsersLoginReq} from '../../models/users.model';
import {UsersService} from '../../services/users.service';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import {AppAlert} from '../../components/appalert.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {ViewStyle, Image, Dimensions, TouchableOpacity, SafeAreaView} from 'react-native';
import { iscustomeractions } from '../../redux/iscustomer.redux';
import { environment } from '../../utils/environment';
import { pushnotification_utils } from '../../utils/pushnotification';

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
  const { savePushToken } = usePushNotifications();
  const [isloading, setIsloading] = useState(false);
  const [isotpsent, setIsotpsent] = useState(false);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isDefaultUrl, setIsDefaultUrl] = useState(false);

  const login = async () => {
    setIsloading(true);
    try {
      let loginreq = new UsersLoginReq();
      loginreq.mobile = mobile;
      loginreq.otp = otp;
      let loginresp = await usersservice.login(loginreq);
      dispatch(usercontextactions.set(loginresp!));
      
      // Save Firebase push token to server after successful login
      if (loginresp?.userid) {
        try {
          // Get the stored token
          let pushToken = await pushnotification_utils.getToken();
          
          if (pushToken) {
            console.log('💾 Saving Firebase push token to server for user:', loginresp.userid);
            const saved = await usersservice.UpdatePushToken(loginresp.userid, pushToken);
            if (saved) {
              console.log('✅ Firebase push token saved successfully to server');
            } else {
              console.log('❌ Failed to save Firebase push token to server');
            }
          } else {
            console.log('⚠️ No Firebase push token available to save');
          }
        } catch (error) {
          console.error('❌ Error saving Firebase push token:', error);
        }
      }
      
      // User is a business if they have an organisation; otherwise a customer
      const iscustomer = loginresp?.organisationlocationid  == 0 || loginresp?.organisationlocationid == null;
      dispatch(iscustomeractions.setIsCustomer(iscustomer));
      navigation.navigate('HomeTab');
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  const validateMobile = (mobileNumber: string): boolean => {
    // Remove any spaces, dashes, or other characters
    const cleanMobile = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if mobile number is valid (10-15 digits, allowing country codes)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(cleanMobile)) {
      setMobileError('Please enter a valid mobile number (10-15 digits)');
      return false;
    }
    
    // Check if it's too short
    if (cleanMobile.length < 10) {
      setMobileError('Mobile number must be at least 10 digits');
      return false;
    }
    
    // Clear any existing error
    setMobileError('');
    return true;
  };

  const getOtp = async () => {
    // Clear any previous errors
    setMobileError('');
    
    // Clean the mobile number
    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
    
    // Validate mobile number
    if (!validateMobile(cleanMobile)) {
      return;
    }
    
    setIsloading(true);
    
    try {
      let getotpreq = new UsersGetOtpReq();
      getotpreq.mobile = cleanMobile; // Use cleaned mobile number
      console.log("🚀 Getting OTP for mobile:", cleanMobile);
      
      let getotpresp = await usersservice.GetOtp(getotpreq);
      console.log("✅ OTP response received:", getotpresp);
      
      if (getotpresp) {
        setName(getotpresp.name || 'User');
        setIsotpsent(true);
        console.log("✅ OTP sent successfully, showing OTP input");
      } else {
        console.log("⚠️ No response received from OTP API");
        AppAlert({message: 'Failed to send OTP. Please try again.'});
      }
      
    } catch (error: any) {
      console.error("❌ OTP Error:", error);
      
      var message = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      
      if (message && (message.includes('duplicate') || message.includes('already exists'))) {
        setMobileError('This mobile number is already registered');
      } else if (message.includes('500') || message.includes('Internal Server Error')) {
        AppAlert({message: 'Server is temporarily unavailable. Please try again later.'});
      } else {
        AppAlert({message: `OTP Error: ${message}`});
      }
    } finally {
      setIsloading(false);
    }
  };

  const gotoSignUp = (value: boolean) => {
    navigation.navigate('SignUp', {isorganization: value});
  };

  const inputContainerStyle: ViewStyle = {
    marginBottom: 15,
  };

  // Calculate image dimensions based on screen width
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth * 0.4;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header Section */}
      <AppView style={[$.align_items_center, { paddingTop: 60, paddingBottom: 40 }]}>
        <Image 
          source={require('../../assert/a1.png')}
          style={{
            width: imageSize,
            height: imageSize,
            marginBottom: 24,
          }}
          resizeMode="contain"
        />
        <AppText style={[$.fw_bold, $.fs_enormous, $.text_primary5]}>
          Appointza
        </AppText>
        <AppText style={{
          fontSize: 16,
          color: '#666666',
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 24,
        }}>
          Book. Manage. Meet.{'\n'}
          All in One Place
        </AppText>
      </AppView>

      {/* Card Container */}
      <AppView style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}>
        <FormInput
          label="Mobile Number"
          value={mobile}
          onChangeText={(text) => {
            setMobile(text);
            setMobileError(''); // Clear error when user types
          }}
          placeholder="Enter your mobile number (e.g., 9876543210)"
          keyboardType="phone-pad"
          containerStyle={inputContainerStyle}
          error={mobileError}
        />

        {isotpsent && (
          <FormInput
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            keyboardType="numeric"
            containerStyle={inputContainerStyle}
          />
        )}

        {/* Buttons Section */}
        <AppView style={{ }}>
          {isotpsent && (
            <Button
              title="Login"
              variant="secondary"
              onPress={login}
              loading={isloading}
              disabled={isloading}
              style={{ marginBottom: 12 }}
            />
          )}
          <Button
            title={isotpsent ? 'Resend OTP' : 'Get OTP'}
            variant="secondary"
            onPress={getOtp}
            loading={isloading}
            disabled={isloading}
            style={{ marginBottom: 12 }}
          />
        </AppView>
      </AppView>

      {/* Footer Section */}
      <AppView style={[$.align_items_center, $.flex_row, { 
        justifyContent: 'center',
        marginTop: 24,
        paddingHorizontal: 20, backgroundColor: '#F8F9FA' 
      }]}>
        <AppText style={[$.fs_small, $.fw_regular, $.text_tint_1]}>
          Don't Have an account?{' '}
        </AppText>
        <TouchableOpacity onPress={() => gotoSignUp(false)}><AppText>Sign up</AppText></TouchableOpacity>
       
      </AppView>
    </SafeAreaView>
  );
}
