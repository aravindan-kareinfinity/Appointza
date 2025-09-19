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
  SafeAreaView,
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
      // For now, let's use hardcoded business types since the API is not working
      console.log("🚀 Using hardcoded business types due to server API issues");
      
      const hardcodedBusinessTypes = [
        { id: 1, displaytext: "Healthcare", identifier: "HEALTHCARE" },
        { id: 2, displaytext: "Beauty & Wellness", identifier: "BEAUTY" },
        { id: 3, displaytext: "Professional Services", identifier: "PROFESSIONAL" },
        { id: 4, displaytext: "Education", identifier: "EDUCATION" },
        { id: 5, displaytext: "Fitness & Sports", identifier: "FITNESS" },
        { id: 6, displaytext: "Automotive", identifier: "AUTOMOTIVE" },
        { id: 7, displaytext: "Home Services", identifier: "HOME" },
        { id: 8, displaytext: "Technology", identifier: "TECHNOLOGY" }
      ];
      
      setPrimaryBusinessTypes(hardcodedBusinessTypes);
      console.log("✅ Set hardcoded business types:", hardcodedBusinessTypes.length, "items");
      
      // TODO: Uncomment when server API is fixed
      // var req= new ReferenceTypeSelectReq();
      // req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      // console.log("🚀 Fetching business types with request:", req);
      // const response = await referenceTypeService.select(req);
      // console.log("✅ Business types response:", response);
      // if (response && Array.isArray(response)) {
      //   setPrimaryBusinessTypes(response);
      //   console.log("✅ Set primary business types:", response.length, "items");
      // } else {
      //   console.log("⚠️ No business types received or invalid format");
      // }
    } catch (error) {
      console.error("❌ Error fetching business types:", error);
      handleError(error, 'Failed to fetch business types');
    }
  };

  const fetchReferenceValues = async (id: number) => {
    try {
      // For now, let's use hardcoded business details since the API is not working
      console.log("🚀 Using hardcoded business details for parent ID:", id);
      
      const hardcodedBusinessDetails = {
        1: [ // Healthcare
          { id: 1, displaytext: "Doctor", identifier: "DOCTOR" },
          { id: 2, displaytext: "Dentist", identifier: "DENTIST" },
          { id: 3, displaytext: "Therapist", identifier: "THERAPIST" },
          { id: 4, displaytext: "Nurse", identifier: "NURSE" }
        ],
        2: [ // Beauty & Wellness
          { id: 5, displaytext: "Hair Salon", identifier: "HAIR_SALON" },
          { id: 6, displaytext: "Spa", identifier: "SPA" },
          { id: 7, displaytext: "Nail Salon", identifier: "NAIL_SALON" },
          { id: 8, displaytext: "Massage", identifier: "MASSAGE" }
        ],
        3: [ // Professional Services
          { id: 9, displaytext: "Lawyer", identifier: "LAWYER" },
          { id: 10, displaytext: "Accountant", identifier: "ACCOUNTANT" },
          { id: 11, displaytext: "Consultant", identifier: "CONSULTANT" },
          { id: 12, displaytext: "Real Estate", identifier: "REAL_ESTATE" }
        ],
        4: [ // Education
          { id: 13, displaytext: "Tutor", identifier: "TUTOR" },
          { id: 14, displaytext: "Language School", identifier: "LANGUAGE_SCHOOL" },
          { id: 15, displaytext: "Music Teacher", identifier: "MUSIC_TEACHER" },
          { id: 16, displaytext: "Driving School", identifier: "DRIVING_SCHOOL" }
        ],
        5: [ // Fitness & Sports
          { id: 17, displaytext: "Personal Trainer", identifier: "PERSONAL_TRAINER" },
          { id: 18, displaytext: "Yoga Instructor", identifier: "YOGA_INSTRUCTOR" },
          { id: 19, displaytext: "Swimming Coach", identifier: "SWIMMING_COACH" },
          { id: 20, displaytext: "Martial Arts", identifier: "MARTIAL_ARTS" }
        ],
        6: [ // Automotive
          { id: 21, displaytext: "Car Repair", identifier: "CAR_REPAIR" },
          { id: 22, displaytext: "Car Wash", identifier: "CAR_WASH" },
          { id: 23, displaytext: "Auto Parts", identifier: "AUTO_PARTS" },
          { id: 24, displaytext: "Towing", identifier: "TOWING" }
        ],
        7: [ // Home Services
          { id: 25, displaytext: "Plumber", identifier: "PLUMBER" },
          { id: 26, displaytext: "Electrician", identifier: "ELECTRICIAN" },
          { id: 27, displaytext: "Cleaner", identifier: "CLEANER" },
          { id: 28, displaytext: "Gardener", identifier: "GARDENER" }
        ],
        8: [ // Technology
          { id: 29, displaytext: "IT Support", identifier: "IT_SUPPORT" },
          { id: 30, displaytext: "Web Developer", identifier: "WEB_DEVELOPER" },
          { id: 31, displaytext: "Tech Repair", identifier: "TECH_REPAIR" },
          { id: 32, displaytext: "Software Training", identifier: "SOFTWARE_TRAINING" }
        ]
      };
      
      const businessDetails = hardcodedBusinessDetails[id] || [];
      setSecondaryBusinessTypes(businessDetails);
      console.log("✅ Set hardcoded business details:", businessDetails.length, "items");
      
      // TODO: Uncomment when server API is fixed
      // const req = new ReferenceValueSelectReq();
      // req.parentid = id;
      // req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      // console.log("🚀 Fetching business details with request:", req);
      // const response = await referenceValueService.select(req);
      // console.log("✅ Business details response:", response);
      // if (response && Array.isArray(response)) {
      //   setSecondaryBusinessTypes(response);
      //   console.log("✅ Set secondary business types:", response.length, "items");
      // } else {
      //   console.log("⚠️ No business details received or invalid format");
      // }
    } catch (error) {
      console.error("❌ Error fetching business details:", error);
      handleError(error, 'Failed to fetch business details');
    }
  };

  const pickAndUploadOrgLogo = async () => {
    try {
      const images = await imagepickerutil.launchImageLibrary();
      const files = await filesService.upload(images);
      if (files.length > 0) {
        setSignUpModel(prev => ({
          ...prev,
          organisationlogo: files[0],
          organisationimageid: files[0],
        }));
      }
    } catch (error) {
      handleError(error, 'Failed to upload organization logo');
    }
  };

  const pickAndUploadProfileImage = async () => {
    try {
      const images = await imagepickerutil.launchImageLibrary();
      const files = await filesService.upload(images);
      if (files.length > 0) {
        setSignUpModel(prev => ({
          ...prev,
          profileimage: files[0],
        }));
      }
    } catch (error) {
      handleError(error, 'Failed to upload profile image');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader 
        title="Sign Up"
        showBackButton={true}
      />
      
      <ScrollView contentContainerStyle={[$.p_medium, { backgroundColor: colors.background }]}>
        {/* Organization Logo Upload */}
     { isOrganization &&    <HeaderButton
          title={signUpModel.organisationlogo === 0 ? "Upload Organization Logo" : "Change Organization Logo"}
          icon={
            signUpModel.organisationlogo === 0 ? (
              <CustomIcon name={CustomIcons.Image} color={colors.placeholder} size={40} />
            ) : (
              <Image
                source={{
                  uri: filesService.get(signUpModel.organisationlogo),
                  width: 100,
                  height: 100,
                }}
              />
            )
          }
          onPress={pickAndUploadOrgLogo}
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
        />}

     

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

        {/* Location Picker (Only for Organization) */}
        {isOrganization && (
          <HeaderButton
            title={signUpModel.googlelocation || 'Select Location on Map'}
            onPress={() => {
              try {
                setShowLocationPicker(true);
              } catch (error) {
                console.error('Error opening location picker:', error);
                AppAlert({ message: 'Failed to open location picker. Please try again.' });
              }
            }}
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
        )}

        {isOrganization && (
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
        )}

   {/* User Profile Image Upload */}
        <HeaderButton
          title={signUpModel.profileimage === 0 ? "Upload Your Photo" : "Change Your Photo"}
          icon={
            signUpModel.profileimage === 0 ? (
              <CustomIcon name={CustomIcons.Image} color={colors.placeholder} size={40} />
            ) : (
              <Image
                source={{
                  uri: filesService.get(signUpModel.profileimage),
                  width: 100,
                  height: 100,
                }}
              />
            )
          }
          onPress={pickAndUploadProfileImage}
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
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
            <LocationPicker
              visible={showLocationPicker}
              onClose={() => {
                try {
                  setShowLocationPicker(false);
                } catch (error) {
                  console.error('Error closing location picker:', error);
                  setShowLocationPicker(false);
                }
              }}
              onLocationSelect={(location) => {
                try {
                  handleLocationSelect(location);
                } catch (error) {
                  console.error('Error selecting location:', error);
                  AppAlert({ message: 'Failed to select location. Please try again.' });
                }
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}