import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { $ } from '../../styles';
import { Button } from '../../components/button.component';
import { OTPInput } from '../../components/otpinput.component';
import { UsersService } from '../../services/users.service';
import { AppAlert } from '../../components/appalert.component';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DefaultColor } from '../../styles/default-color.style';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { UsersLoginReq } from '../../models/users.model';
import { useAppDispatch } from '../../redux/hooks.redux';
import { usercontextactions } from '../../redux/usercontext.redux';
import { iscustomeractions } from '../../redux/iscustomer.redux';

type OTPVerificationScreenProps = NativeStackScreenProps<AppStackParamList, 'OTPVerification'>;

export function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const colors = DefaultColor.instance;
  const { mobileNumber, fromSignup } = route.params;
  const dispatch = useAppDispatch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const usersService = new UsersService();

  const startOTPTimer = useCallback(() => {
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await usersService.GetOtp({ mobile: mobileNumber });
      if (response) {
        setOtpTimer(60);
        startOTPTimer();
        AppAlert({ message: 'OTP sent successfully' });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to send OTP';
      AppAlert({ message });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      AppAlert({ message: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setIsLoading(true);
    try {
      const loginReq = new UsersLoginReq();
      loginReq.mobile = mobileNumber;
      loginReq.otp = otp;
      
      const response = await usersService.login(loginReq);
      if (response) {
        // Set user context
        dispatch(usercontextactions.set(response));
        
        // If user has organization ID, set them as business by default
        if (response.organisationid > 0) {
          dispatch(iscustomeractions.setIsCustomer(false));
        } else {
          dispatch(iscustomeractions.setIsCustomer(true));
        }

        AppAlert({ message: 'OTP verified successfully' });
        
        if (fromSignup) {
          // Check if user is an organization by checking if they have an organization ID
          if (response.organisationid > 0) {
            // Navigate to Service screen with fromSignup parameter
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'ServiceAvailable',
                params: { fromSignup: true }
              }],
            });
          } else {
            // Navigate to Home for regular users
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeTab' }],
            });
          }
        } else {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid OTP';
      AppAlert({ message });
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth * 0.4;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppView style={[$.align_items_center]}>
        <AppView style={[$.align_items_center]}>
          <Image
            source={require('../../assert/A1.png')}
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
          <AppText
            style={{
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
      </AppView>
      <AppView style={[$.p_medium, $.flex_1]}>
        <AppText style={[$.fs_large, $.fw_bold, $.mb_medium, { color: colors.text }]}>
          Enter Verification Code
        </AppText>
        
        <AppText style={[$.text_tint_3, $.mb_large]}>
          We have sent a verification code to {mobileNumber}
        </AppText>

        <OTPInput
          value={otp}
          onChangeText={setOtp}
          length={6}
          style={styles.otpInput}
        />

        <Button
          title={otpTimer > 0 ? `Resend OTP (${otpTimer}s)` : "Resend OTP"}
          onPress={sendOTP}
          disabled={otpTimer > 0}
          variant="secondary"
          style={[$.mb_medium]}
        />

        <Button
          title="Verify & Continue"
          onPress={verifyOTP}
          loading={isLoading}
          variant="primary"
        />
      </AppView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  otpInput: {
    marginBottom: 24,
  },
});