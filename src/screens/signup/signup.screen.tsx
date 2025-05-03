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
import { AppButton } from '../../components/appbutton.component';
import { AppTextInput } from '../../components/apptextinput.component';
import { REFERENCETYPE, UsersRegisterReq } from '../../models/users.model';
import {
  Alert,
  Image,
  ScrollView,
  Touchable,
  TouchableOpacity,
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

// type SignUpScreenProp = CompositeScreenProps<
//   BottomTabScreenProps<HomeTabParamList>,
//   NativeStackScreenProps<AppStackParamList, 'SignUp'>
// >;

type SignUpScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'SignUp'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function SignUpScreen(props: SignUpScreenProp) {

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
      const userService = new UsersService();
      console.log("signUpModel",signUpModel);
      
      const response = await userService.register(signUpModel);
      
      if (response) {
        dispatch(usercontextactions.set(response));
        AppAlert({ message: 'Registration successful' });
        
        if (signUpModel.primarytype !== 0) {

           navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'ServiceAvailable',
                      },
                    ],
                  }),
                );
         
        } else {

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'HomeTab',
                },
              ],
            }),
          );
      
          // Navigate to appropriate screen for non-org users
        }
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

  return (
    <ScrollView contentContainerStyle={[$.p_medium]}>
      <AppView style={[$.align_items_center, $.mb_medium]}>
        <AppText style={[$.fs_large, $.fw_bold]}>Sign Up</AppText>
      </AppView>

      {/* Image Upload */}
      <TouchableOpacity
        onPress={pickAndUploadImage}
        style={[$.mb_medium, $.bg_tint_10, $.p_small, $.border_rounded]}>
        {signUpModel.organisationimageid === 0 ? (
          <AppView style={[$.flex_row, $.align_items_center]}>
            <CustomIcon name={CustomIcons.Image} color={$.tint_4} size={40} />
            <AppText style={[$.ml_normal]}>Choose Image</AppText>
          </AppView>
        ) : (
          <AppView style={[$.flex_row, $.align_items_center]}>
            <Image
              source={{
                uri: filesService.get(signUpModel.organisationimageid),
                width: 100,
                height: 100,
              }}
            />
            <AppText style={[$.ml_normal]}>Change Image</AppText>
          </AppView>
        )}
      </TouchableOpacity>

      {isOrganization && (
        <>
          <AppSingleSelect
            data={primaryBusinessTypes}
            keyExtractor={item => item.id.toString()}
            searchKeyExtractor={item => item.displaytext}
            renderItemLabel={item => (
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                {item.displaytext}
              </AppText>
            )}
            selecteditemid={signUpModel.primarytype.toString()}
            onSelect={item => {
              setSignUpModel(prev => ({
                ...prev,
                primarytypecode: item.identifier,
                primarytype: item.id,
                secondarytype: 0,
                secondarytypecode: '',
              }));
              fetchReferenceValues(item.id);
            }}
            title="Business Type"
            style={[$.mb_normal]}
          />

          <AppSingleSelect
            data={secondaryBusinessTypes}
            keyExtractor={item => item.id.toString()}
            searchKeyExtractor={item => item.displaytext}
            renderItemLabel={item => (
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                {item.displaytext}
              </AppText>
            )}
            selecteditemid={signUpModel.secondarytype.toString()}
            onSelect={item => {
              setSignUpModel(prev => ({
                ...prev,
                secondarytype: item.id,
                secondarytypecode: item.identifier,
              }));
            }}
            title="Business Details"
            style={[$.mb_normal]}
          />

          <AppTextInput
            placeholder="Organization Name"
            value={signUpModel.organisationname}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, organisationname: text }))}
            style={[$.mb_normal]}
          />

          <AppTextInput
            placeholder="GST Number"
            value={signUpModel.organisationgstnumber}
            onChangeText={text => setSignUpModel(prev => ({ ...prev, organisationgstnumber: text }))}
            style={[$.mb_normal]}
          />
        </>
      )}

      {/* Location Picker */}
      <TouchableOpacity 
        onPress={() => setShowLocationPicker(true)}
        style={[$.mb_normal, $.p_small, $.bg_tint_10, $.border_rounded]}
      >
        <AppText style={[$.text_tint_3]}>
          {signUpModel.googlelocation || 'Select Location on Map'}
        </AppText>
      </TouchableOpacity>

  {/* Location Details (auto-filled from map selection) */}
  <AppTextInput
        placeholder="Location Name "
        value={signUpModel.locationname}
        onChangeText={text => setSignUpModel(prev => ({ ...prev, locationname: text }))}
        style={[$.mb_normal]}
      />

      {/* Location Details (auto-filled from map selection) */}
      <AppTextInput
        placeholder="Address Line 1"
        value={signUpModel.locationaddressline1}
        onChangeText={text => setSignUpModel(prev => ({ ...prev, locationaddressline1: text }))}
        style={[$.mb_normal]}
      />
      
      <AppTextInput
        placeholder="Address Line 2"
        value={signUpModel.locationaddressline2}
        onChangeText={text => setSignUpModel(prev => ({ ...prev, locationaddressline2: text }))}
        style={[$.mb_normal]}
      />

      <AppView style={[$.flex_row, $.mb_normal]}>
        <AppTextInput
          placeholder="City"
          value={signUpModel.locationcity}
          onChangeText={text => setSignUpModel(prev => ({ ...prev, locationcity: text }))}
          style={[$.flex_1, $.mr_small]}
        />
        <AppTextInput
          placeholder="State"
          value={signUpModel.locationstate}
          onChangeText={text => setSignUpModel(prev => ({ ...prev, locationstate: text }))}
          style={[$.flex_1]}
        />
      </AppView>

      <AppView style={[$.flex_row, $.mb_normal]}>
        <AppTextInput
          placeholder="Country"
          value={signUpModel.locationcountry}
          onChangeText={text => setSignUpModel(prev => ({ ...prev, locationcountry: text }))}
          style={[$.flex_1, $.mr_small]}
        />
        <AppTextInput
          placeholder="Pincode"
          value={signUpModel.locationpincode}
          onChangeText={text => setSignUpModel(prev => ({ ...prev, locationpincode: text }))}
          keyboardtype="numeric"
          style={[$.flex_1]}
        />
      </AppView>

      <AppTextInput
        placeholder="Your Name"
        value={signUpModel.username}
        onChangeText={text => setSignUpModel(prev => ({ ...prev, username: text }))}
        style={[$.mb_normal]}
      />

      <AppTextInput
        placeholder="Mobile Number"
        value={signUpModel.usermobile}
        onChangeText={text => setSignUpModel(prev => ({ ...prev, usermobile: text }))}
        keyboardtype="phone-pad"
        style={[$.mb_normal]}
      />

      {isOrganization && (
        <AppTextInput
          placeholder="Designation"
          value={signUpModel.userdesignation}
          onChangeText={text => setSignUpModel(prev => ({ ...prev, userdesignation: text }))}
          style={[$.mb_medium]}
        />
      )}

      <AppButton
        name="Sign Up"
        onPress={handleSignUp}
        isLoading={isLoading}
        style={[$.bg_tint_1, $.mb_medium]}
        textStyle={[$.text_tint_11]}
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
  );
}