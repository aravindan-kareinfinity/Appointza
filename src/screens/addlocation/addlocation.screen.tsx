import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {Button} from '../../components/button.component';
import {$} from '../../styles';
import {FormInput} from '../../components/forminput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle, SafeAreaView, Alert, Image, KeyboardAvoidingView, Platform} from 'react-native';
import {
  OrganisationLocation,
  OrganisationLocationDeleteReq,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {AppAlert} from '../../components/appalert.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {LocationPicker} from '../../components/LocationPicker';
import {HeaderButton} from '../../components/headerbutton.component';
import {FilesService} from '../../services/files.service';
import {imagepickerutil} from '../../utils/imagepicker.util';
import { environment } from '../../utils/environment';

type LocationScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Location'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function LocationScreen(props: LocationScreenProp) {
  const navigation = useNavigation<LocationScreenProp['navigation']>();
  const [isLoading, setIsLoading] = useState(false);
  const [organisationLocation, setOrganisationLocation] = useState<OrganisationLocation>(new OrganisationLocation());
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isFromMap, setIsFromMap] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(environment.baseurl);
  const [isDefaultUrl, setIsDefaultUrl] = useState(true);
  const userContext = useAppSelector(selectusercontext);
  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    if (!props.route.params?.id) return;

    setIsLoading(true);
    try {
      const locReq = new OrganisationLocationSelectReq();
      locReq.id = props.route.params.id;
      locReq.organisationid = userContext.value.organisationid;

      const locations = await organisationLocationService.select(locReq);
      if (locations && locations.length > 0) {
        setOrganisationLocation(locations[0]);
        if (locations[0].googlelocation) {
          setIsFromMap(true);
        }
        // Set custom URL input for editing
        if (locations[0].customurl) {
          setCustomUrlInput(locations[0].customurl);
          setIsDefaultUrl(false);
        }
      }
    } catch (error) {
      handleError(error, 'Failed to fetch location details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    
    setIsLoading(true);
    try {
      const locationToSave = {
        ...organisationLocation,
        organisationid: userContext.value.organisationid,
        // Ensure we're only sending valid fields to the server
        id: organisationLocation.id || 0, // Default to 0 if not set (for new locations)
        name: organisationLocation.name?.trim(),
        addressline1: organisationLocation.addressline1?.trim(),
        addressline2: organisationLocation.addressline2?.trim(),
        city: organisationLocation.city?.trim(),
        state: organisationLocation.state?.trim(),
        country: organisationLocation.country?.trim(),
        pincode: organisationLocation.pincode?.trim(),
        customurl: organisationLocation.customurl?.trim(),
        latitude: organisationLocation.latitude,
        longitude: organisationLocation.longitude,
        googlelocation: organisationLocation.googlelocation,
        images: organisationLocation.images?.slice(0, 5) || [],
        attributes: {} // Replace with an appropriate object or import AttributesData if it exists
        
      };
  
      console.log('Sending location data:', locationToSave);
  
      const response = await organisationLocationService.save(locationToSave);
      
      if (response) {
        AppAlert({message: 'Location saved successfully'});
        navigation.goBack();
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      
      // Handle Axios error specifically
      if (error.isAxiosError) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to save location';
        
        console.error('Server response:', error.response?.data);
        AppAlert({message: `Error: ${errorMessage}`});
      } else {
        AppAlert({message: error.message || 'Failed to save location'});
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickAndUploadImages = async () => {
    try {
      const remaining = 5 - (organisationLocation.images?.length || 0);
      if (remaining <= 0) {
        AppAlert({message: 'You can upload up to 5 images only'});
        return;
      }
      const assets = await imagepickerutil.launchImageLibrary(remaining);
      const ids = await filesService.upload(assets);
      setOrganisationLocation(prev => ({
        ...prev,
        images: [...(prev.images || []), ...ids].slice(0, 5),
      }));
    } catch (error: any) {
      if (typeof error === 'string') return; // user cancel
      AppAlert({message: 'Failed to upload images'});
    }
  };

  const removeImageAt = (index: number) => {
    setOrganisationLocation(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleDelete = async () => {
    if (!organisationLocation.id) {
      AppAlert({ message: 'No location to delete' });
      return;
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            const req = new OrganisationLocationDeleteReq();
            req.id = organisationLocation.id;
            const res = await organisationLocationService.delete(req);
            if (res) {
              AppAlert({ message: 'Location deleted successfully' });
              navigation.goBack();
            } else {
              AppAlert({ message: 'Failed to delete location' });
            }
          } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to delete location';
            AppAlert({ message });
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const validateFields = () => {
    const requiredFields = ['name', 'addressline1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(
      field => !organisationLocation[field as keyof OrganisationLocation]?.toString().trim()
    );

    if (missingFields.length > 0) {
      AppAlert({message: `Please fill in all required fields (${missingFields.join(', ')})`});
      return false;
    }
    
    // Validate custom URL format if provided
    // if (organisationLocation.customurl && organisationLocation.customurl.trim()) {
    //   const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    //   if (!urlPattern.test(organisationLocation.customurl.trim())) {
    //     AppAlert({message: 'Please enter a valid URL format for Custom URL'});
    //     return false;
    //   }
    // }
    
    return true;
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    const message = (error as any)?.response?.data?.message || defaultMessage;
    AppAlert({message});
    console.error('Location Error:', error);
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
    setOrganisationLocation(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      googlelocation: location.address,
      addressline1: location.address.split(',')[0] || location.address,
      city: location.city || prev.city,
      state: location.state || prev.state,
      country: location.country || prev.country,
      pincode: location.pincode || prev.pincode,
      locationname: location.address,
      locationcity: location.city || '',
      locationstate: location.state || '',
      locationcountry: location.country || '',
      locationpincode: location.pincode || '',
    }));
    setIsFromMap(true);
    setShowLocationPicker(false);
  };

  const updateOrganisationLocation = <K extends keyof OrganisationLocation>(
    field: K,
    value: OrganisationLocation[K],
  ) => {
    setOrganisationLocation(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomUrlChange = (text: string) => {
    setCustomUrlInput(text);
    
    // Clear default URL when user starts typing
    if (isDefaultUrl && text !== environment.baseurl) {
      setIsDefaultUrl(false);
      // Extract the user input part (remove base URL)
      const userInput = text.replace(environment.baseurl, '');
      setCustomUrlInput(environment.baseurl + userInput);
    }
    
    // Update the organisation location with the full URL
    updateOrganisationLocation('customurl', text);
  };

  const handleCustomUrlFocus = () => {
    // Clear default URL when user focuses on input
    if (isDefaultUrl) {
      setIsDefaultUrl(false);
      setCustomUrlInput(environment.baseurl);
    }
  };

  const inputContainerStyle: ViewStyle = {
    marginBottom: 16,
  };

   
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <AppView style={[$.pt_normal, $.flex_1]}>
      {/* Header */}
      <AppView style={[$.flex_row, $.ml_regular, $.align_items_center, $.mb_medium]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon
            name={CustomIcons.LeftArrow}
            size={$.s_regular}
            color={$.tint_2}
          />
        </TouchableOpacity>
        <AppText style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
          {props.route.params?.id ? 'Edit Location' : 'Add Location'}
        </AppText>
      </AppView>

      {/* Location Picker Button */}
     

      <Button
        title="Select Location on Map"
        variant="outline"
        onPress={() => setShowLocationPicker(true)}
        disabled={isLoading}
        style={[$.mb_normal, $.p_small, $.border_rounded, $.mx_regular]}
      />


    

      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={handleLocationSelect}
        />
      )}

      {isLoading ? (
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={$.tint_primary_5} />
        </AppView>
      ) : (
        <ScrollView style={[$.flex_1, $.pb_large]}>
          <AppView style={[$.px_regular]}>
            {/* Images Uploader */}
            <HeaderButton
              title={
                (organisationLocation.images?.length || 0) === 0
                  ? 'Add Photos (max 5)'
                  : 'Add More Photos'
              }
              onPress={pickAndUploadImages}
              style={[$.mb_medium, $.p_small, $.border_rounded]}
            />
            <AppView style={[$.flex_row, { flexWrap: 'wrap' }, $.mb_medium]}>
              {(organisationLocation.images || []).map((id, index) => (
                <AppView key={id + '_' + index} style={[$.mr_small, $.mb_small, { position: 'relative' }]}>
                  <Image
                    source={{ uri: filesService.get(id), width: 90, height: 90 }}
                  />
                  <TouchableOpacity
                    style={[{ position: 'absolute', right: 0, top: 0 }, $.p_tiny, $.bg_tint_11, $.border_rounded]}
                    onPress={() => removeImageAt(index)}
                  >
                    <CustomIcon name={CustomIcons.Delete} size={$.s_compact} color={$.danger} />
                  </TouchableOpacity>
                </AppView>
              ))}
            </AppView>
            {/* Form Fields */}
            <FormInput
              label="Location Name"
              value={organisationLocation.name}
              onChangeText={value => updateOrganisationLocation('name', value)}
              placeholder="Enter location name"
              containerStyle={inputContainerStyle}
            />

            <FormInput
              label="Building Details"
              value={organisationLocation.addressline1}
              onChangeText={value => updateOrganisationLocation('addressline1', value)}
              placeholder="Enter building number and name"
              containerStyle={inputContainerStyle}
            />

            <FormInput
              label="Area Details"
              value={organisationLocation.addressline2}
              onChangeText={value => updateOrganisationLocation('addressline2', value)}
              placeholder="Enter road name and area"
              containerStyle={inputContainerStyle}
            />

            <FormInput
              label="State"
              value={organisationLocation.state}
              onChangeText={value => updateOrganisationLocation('state', value)}
              placeholder="Enter state"
              editable={!isFromMap}
              containerStyle={inputContainerStyle}
            />
            
            <FormInput
              label="City"
              value={organisationLocation.city}
              onChangeText={value => updateOrganisationLocation('city', value)}
              placeholder="Enter city"
              editable={!isFromMap}
              containerStyle={inputContainerStyle}
            />

            <FormInput
              label="Pincode"
              value={organisationLocation.pincode}
              onChangeText={value => updateOrganisationLocation('pincode', value)}
              placeholder="Enter pincode"
              keyboardType="numeric"
              editable={!isFromMap}
              containerStyle={inputContainerStyle}
            />

            <FormInput
              label="Custom URL"
              value={customUrlInput}
              onChangeText={handleCustomUrlChange}
              onFocus={handleCustomUrlFocus}
              placeholder="Enter custom URL (optional)"
              containerStyle={inputContainerStyle}
            />
          </AppView>
        </ScrollView>
      )}

      {/* Footer Buttons */}
      <AppView style={[$.flex_row, $.justify_content_center, $.mx_regular, $.mb_medium, $.py_regular]}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          style={[$.flex_1, $.mr_huge]}
        />
        {/* {props.route.params?.id ? (
          <>
         
            <Button
              title={'Update'}
              variant="primary"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              style={[$.flex_1]}
            />
          </>
        ) : ( */}
          <Button
            title={'Save'}
            variant="primary"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={[$.flex_1]}
          />
      
      </AppView>
        </AppView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}