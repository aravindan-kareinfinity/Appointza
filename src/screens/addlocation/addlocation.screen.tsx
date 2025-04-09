import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { AppTextInput } from '../../components/apptextinput.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { AppAlert } from '../../components/appalert.component';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';

type LocationScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Location'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function LocationScreen(props: LocationScreenProp) {
  const navigation = useNavigation<LocationScreenProp['navigation']>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [organisationLocation, setOrganisationLocation] = useState(new OrganisationLocation());
  const userContext = useAppSelector(selectusercontext);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);

  // Minimum required fields for a valid location
  const requiredFields = ['name', 'addressline1', 'city', 'state', 'pincode'];
  
  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    if (!props.route.params?.id) return;
    
    setIsLoading(true);
    try {
      const locReq = new OrganisationLocationSelectReq();
      locReq.organisationid = userContext.value.organisationid;
      locReq.organisationid = props.route.params.id;

      const locations = await organisationLocationService.select(locReq);
      if ((locations ?? []).length > 0) {
        if (locations && locations.length > 0) {
          setOrganisationLocation(locations[0]);
        }
      }
    } catch (error: any) {
      handleError(error, 'Failed to fetch location details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateLocation()) return;

    setIsLoading(true);
    try {
      const locationToSave = { ...organisationLocation };
      locationToSave.organisationid = userContext.value.organisationid;

      await organisationLocationService.save(locationToSave);
      AppAlert({ message: 'Location saved successfully' });
      navigation.goBack();
    } catch (error: any) {
      handleError(error, 'Failed to save location');
    } finally {
      setIsLoading(false);
    }
  };

  const validateLocation = (): boolean => {
    // Check required fields
    for (const field of requiredFields) {
      const fieldValue = organisationLocation[field as keyof OrganisationLocation];
      if (typeof fieldValue === 'string' && !fieldValue.trim()) {
        AppAlert({ message: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
        return false;
      }
    }

    // Validate pincode (6 digits for India)
    if (!/^\d{6}$/.test(organisationLocation.pincode)) {
      AppAlert({ message: 'Please enter a valid 6-digit pincode' });
      return false;
    }

    return true;
  };

  const handleError = (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message || defaultMessage;
    AppAlert({ message });
    console.error('Location Error:', error);
  };

  const fetchLocationFromPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) return; // Only fetch if valid pincode
    
    setIsFetchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`
      );
      const data = await response.json();

      if (data.length > 0) {
        const location = data[0];
        const parts = location.display_name.split(", ");
        
        setOrganisationLocation(prev => ({
          ...prev,
          country: parts[4] || prev.country,
          state: parts[3] || prev.state,
          district: parts[2] || prev.district,
          city: parts[1] || prev.city,
          pincode: pincode
        }));

        // If we have address line 1, try to get precise coordinates
        if (organisationLocation.addressline1) {
          await fetchCoordinatesFromAddress();
        }
      }
    } catch (error) {
      console.error('Geocoding API Error:', error);
      AppAlert({ message: 'Could not fetch location details. Please enter manually.' });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const fetchCoordinatesFromAddress = async () => {
    if (!organisationLocation.addressline1) return;
    
    try {
      const fullAddress = [
        organisationLocation.addressline1,
        organisationLocation.addressline2,
        organisationLocation.city,
        organisationLocation.state,
        organisationLocation.pincode,
        'India'
      ].filter(Boolean).join(', ');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const location = data[0];
        setOrganisationLocation(prev => ({
          ...prev,
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon)
        }));
      }
    } catch (error) {
      console.error('Address Geocoding Error:', error);
    }
  };

  const handleFieldChange = (field: keyof OrganisationLocation, value: string) => {
    setOrganisationLocation(prev => ({
      ...prev,
      [field]: value
    }));

    // Special handling for pincode changes
    if (field === 'pincode' && value.length === 6) {
      fetchLocationFromPincode(value);
    }
  };

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      {/* Header */}
      <AppView style={[$.flex_row, $.ml_regular, $.align_items_center, $.mb_medium]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon name={CustomIcons.LeftArrow} size={$.s_regular} color={$.tint_2} />
        </TouchableOpacity>
        <AppText style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
          {props.route.params?.id ? 'Edit Location' : 'Add Location'}
        </AppText>
      </AppView>

      {isLoading ? (
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={$.tint_primary_5} />
        </AppView>
      ) : (
        <ScrollView style={[$.flex_1, $.pb_large]}>
          {/* Location Name */}
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Location name*"
            value={organisationLocation.name}
            onChangeText={value => handleFieldChange('name', value)}
          />

          {/* Address Line 1 */}
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="No, Building name*"
            value={organisationLocation.addressline1}
            onChangeText={value => handleFieldChange('addressline1', value)}
          />

          {/* Address Line 2 */}
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Road name, Area"
            value={organisationLocation.addressline2}
            onChangeText={value => handleFieldChange('addressline2', value)}
          />

          {/* State and City */}
        
            <AppTextInput
              style={[$.bg_tint_11, $.flex_1, $.mr_medium,$.mb_medium, $.mx_regular]}
              placeholder="State*"
              value={organisationLocation.state}
              onChangeText={value => handleFieldChange('state', value)}
              readonly={!isFetchingLocation}
            />
            <AppTextInput
              style={[$.bg_tint_11, $.flex_1,$.mb_medium, $.mx_regular]}
              placeholder="City*"
              value={organisationLocation.city}
              onChangeText={value => handleFieldChange('city', value)}
              readonly={!isFetchingLocation}
            />
    

          {/* Pincode */}
          <AppView style={[$.mx_regular, $.mb_medium]}>
            <AppTextInput
              style={[$.bg_tint_11]}
              placeholder="Pincode*"
              value={organisationLocation.pincode}
              onChangeText={value => handleFieldChange('pincode', value)}
              keyboardtype="numeric"
              maxLength={6}
            />
            {isFetchingLocation && (
              <AppView style={[$.mt_tiny, $.flex_row, $.align_items_center]}>
                <ActivityIndicator size="small" color={$.tint_primary_5} />
                <AppText style={[$.ml_tiny, $.fs_small, $.text_tint_3]}>
                  Fetching location details...
                </AppText>
              </AppView>
            )}
          </AppView>
        </ScrollView>
      )}

      {/* Footer Buttons */}
      <AppView style={[$.flex_row, $.justify_content_center, $.mx_regular, $.mb_medium, $.py_regular]}>
        <AppButton
          name="Cancel"
          style={[$.bg_tint_11, $.flex_1, $.mr_huge]}
          textStyle={[$.text_danger]}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        />
        <AppButton
          name={props.route.params?.id ? 'Update' : 'Save'}
          style={[$.bg_success, $.flex_1]}
          textStyle={[$.text_tint_11]}
          onPress={handleSave}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </AppView>
    </AppView>
  );
}