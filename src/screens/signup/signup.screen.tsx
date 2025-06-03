import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import {
  CommonActions,
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { $ } from '../../styles';
import { Button } from '../../components/button.component';
import { FormInput } from '../../components/forminput.component';
import { FormSelect } from '../../components/formselect.component';
import { HeaderButton } from '../../components/headerbutton.component';
import { CustomHeader } from '../../components/customheader.component';
import { REFERENCETYPE, UsersRegisterReq } from '../../models/users.model';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';

import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { FilesService } from '../../services/files.service';
import { imagepickerutil } from '../../utils/imagepicker.util';
import { UsersService } from '../../services/users.service';
import { AppAlert } from '../../components/appalert.component';
import { addListener } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext, usercontextactions } from '../../redux/usercontext.redux';
import { ReferenceTypeService } from '../../services/referencetype.service';
import { ReferenceType, ReferenceTypeSelectReq } from '../../models/referencetype.model';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { ReferenceValueService } from '../../services/referencevalue.service';
import { ReferenceValue, ReferenceValueSelectReq } from '../../models/referencevalue.model';
import { LocationPicker } from '../../components/LocationPicker';
import { DefaultColor } from '../../styles/default-color.style';
import { OTPInput } from '../../components/otpinput.component';

// type SignUpScreenProp = CompositeScreenProps<
//   BottomTabScreenProps<HomeTabParamList>,
//   NativeStackScreenProps<AppStackParamList, 'SignUp'>
// >;

type SignUpScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'SignUp'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function SignUpScreen(props: SignUpScreenProp) {
  const colors = DefaultColor.instance;
  const navigation = useNavigation<SignUpScreenProp['navigation']>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const userContext = useAppSelector(selectusercontext);
  
  const [isLoading, setIsLoading] = useState(false);
  const [signUpModel, setSignUpModel] = useState(new UsersRegisterReq());
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceType[]>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);
  
  const filesService = useMemo(() => new FilesService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const usersService = useMemo(() => new UsersService(), []);

  const isOrganization = props.route.params.isorganization;

  // Fetch business types on focus
  useFocusEffect(
    useCallback(() => {
      fetchReferenceTypes();
    }, [isOrganization])
  );

  const fetchReferenceTypes = async () => {
    try {
      var req= new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      console.log("req",req);
      
      const response = await referenceValueService.select(req);
      if (response) {
        setPrimaryBusinessTypes(response);
      }
    } catch (error) {
      handleError(error, 'Failed to fetch business types');
    }
  };

  const fetchReferenceValues = async (id: number) => {
    try {
      const req = new ReferenceValueSelectReq();
      req.parentid = id;
      req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      const response = await referenceValueService.select(req);
      if (response) {
        setSecondaryBusinessTypes(response);
      }
    } catch (error) {
      handleError(error, 'Failed to fetch business details');
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const images = await imagepickerutil.launchImageLibrary();
      console.log(images);

      const files = await filesService.upload(images);
      if (files.length > 0) {
        setSignUpModel(prev => ({
          ...prev,
          organisationimageid: files[0],
        }));
      }
    } catch (error) {
      handleError(error, 'Failed to upload image');
    }
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => {
    setSignUpModel(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      googlelocation: location.address,
  
      locationcity: location.city || '',
      locationstate: location.state || '',
      locationcountry: location.country || '',
      locationpincode: location.pincode || '',
    }));
    setShowLocationPicker(false);
  };

  const validateForm = (): boolean => {
    // Basic validation - expand as needed
    if (!signUpModel.username) {
      AppAlert({ message: 'Please enter your name' });
      return false;
    }
    if (!signUpModel.usermobile) {
      AppAlert({ message: 'Please enter mobile number' });
      return false;
    }
    if (signUpModel.usermobile.length !== 10) {
      AppAlert({ message: 'Please enter a valid 10-digit mobile number' });
      return false;
    }
    if (isOrganization && !signUpModel.organisationname) {
      AppAlert({ message: 'Please enter organization name' });
      return false;
    }
    if (isOrganization && !signUpModel.latitude) {
      AppAlert({ message: 'Please select a location' });
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await usersService.register(signUpModel);
      
      if (response) {
        dispatch(usercontextactions.set(response));
        AppAlert({ message: 'Registration successful' });
        
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerification', {
          mobileNumber: signUpModel.usermobile,
          fromSignup: true
        });
      }
    } catch (error) {
      handleError(error, 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message || defaultMessage;
    AppAlert({ message });
    console.error('Error:', error);
  };

  const cardStyle = {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader 
        title="Sign Up"
        showBackButton={true}
      />
      
      <ScrollView contentContainerStyle={[$.p_medium, { backgroundColor: colors.background }]}>
        {/* Image Upload */}
        <HeaderButton
          title={signUpModel.organisationimageid === 0 ? "Choose Image" : "Change Image"}
          icon={
            signUpModel.organisationimageid === 0 ? (
              <CustomIcon name={CustomIcons.Image} color={colors.placeholder} size={40} />
            ) : (
              <Image
                source={{
                  uri: filesService.get(signUpModel.organisationimageid),
                  width: 100,
                  height: 100,
                }}
              />
            )
          }
          onPress={pickAndUploadImage}
          style={[
            $.mb_medium,
            {
              backgroundColor: colors.cardBackground,
              ...Platform.select({
                ios: {
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 4,
                },
              }),
            },
            $.p_small,
            $.border_rounded,
          ]}
        />

        {isOrganization && (
          <View style={cardStyle}>
            <FormSelect
              label="Business Type"
              options={primaryBusinessTypes.map(type => ({
                id: type.id,
                name: type.displaytext,
                code: type.identifier
              }))}
              selectedId={signUpModel.primarytype}
              onSelect={(option) => {
                setSignUpModel(prev => ({
                  ...prev,
                  primarytypecode: option.code || '',
                  primarytype: option.id,
                  secondarytype: 0,
                  secondarytypecode: '',
                }));
                fetchReferenceValues(option.id);
              }}
            />

            <FormSelect
              label="Business Details"
              options={secondaryBusinessTypes.map(type => ({
                id: type.id,
                name: type.displaytext,
                code: type.identifier
              }))}
              selectedId={signUpModel.secondarytype}
              onSelect={(option) => {
                setSignUpModel(prev => ({
                  ...prev,
                  secondarytype: option.id,
                  secondarytypecode: option.code || '',
                }));
              }}
            />

            <FormInput
              label="Organization Name"
              placeholder="Enter organization name"
              value={signUpModel.organisationname}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, organisationname: text }))}
            />

            <FormInput
              label="GST Number"
              placeholder="Enter GST number"
              value={signUpModel.organisationgstnumber}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, organisationgstnumber: text }))}
            />
          </View>
        )}

        {/* Location Picker */}
        <HeaderButton
          title={signUpModel.googlelocation || 'Select Location on Map'}
          onPress={() => setShowLocationPicker(true)}
          style={[
            $.mb_normal,
            $.p_small,
            {
              backgroundColor: colors.cardBackground,
              ...Platform.select({
                ios: {
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 4,
                },
              }),
            },
            $.border_rounded,
          ]}
          textStyle={[$.text_tint_3]}
        />

        <View style={cardStyle}>
          <FormInput
            label="Location Name"
            placeholder="Enter location name"
            value={signUpModel.locationname}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, locationname: text }))}
          />

          <FormInput
            label="Address Line 1"
            placeholder="Enter address line 1"
            value={signUpModel.locationaddressline1}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, locationaddressline1: text }))}
          />
          
          <FormInput
            label="Address Line 2"
            placeholder="Enter address line 2"
            value={signUpModel.locationaddressline2}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, locationaddressline2: text }))}
          />

          <AppView style={[$.flex_row, $.mb_normal]}>
            <FormInput
              label="City"
              placeholder="Enter city"
              value={signUpModel.locationcity}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, locationcity: text }))}
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <FormInput
              label="State"
              placeholder="Enter state"
              value={signUpModel.locationstate}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, locationstate: text }))}
              containerStyle={{ flex: 1 }}
            />
          </AppView>

          <AppView style={[$.flex_row, $.mb_normal]}>
            <FormInput
              label="Country"
              placeholder="Enter country"
              value={signUpModel.locationcountry}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, locationcountry: text }))}
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <FormInput
              label="Pincode"
              placeholder="Enter pincode"
              value={signUpModel.locationpincode}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, locationpincode: text }))}
              keyboardType="numeric"
              containerStyle={{ flex: 1 }}
            />
          </AppView>
        </View>

        <View style={cardStyle}>
          <FormInput
            label="Your Name"
            placeholder="Enter your name"
            value={signUpModel.username}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, username: text }))}
          />

          <FormInput
            label="Mobile Number"
            placeholder="Enter mobile number"
            value={signUpModel.usermobile}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, usermobile: text }))}
            keyboardType="phone-pad"
          />

          {isOrganization && (
            <FormInput
              label="Designation"
              placeholder="Enter your designation"
              value={signUpModel.userdesignation}
              onChangeText={text => setSignUpModel(prev => ({ ...prev, userdesignation: text }))}
            />
          )}
        </View>

        <Button
          title="Sign Up"
          onPress={handleSignUp}
          loading={isLoading}
          variant="primary"
          style={[$.mb_medium]}
        />

        {/* Location Picker Modal */}
        {showLocationPicker && (
          <LocationPicker
            visible={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onLocationSelect={handleLocationSelect}
          />
        )}
      </ScrollView>
    </View>
  );
}