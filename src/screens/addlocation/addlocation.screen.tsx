import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, navigate } from '../../appstack.navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { AppTextInput } from '../../components/apptextinput.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { ScrollView, TouchableOpacity } from 'react-native';
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
  const [isloading, setIsloading] = useState(false);
  const [organisationlocation, setOrganisationlocation] = useState(
    new OrganisationLocation(),
  );
  const usercontext = useAppSelector(selectusercontext);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsloading(true);
    try {
      if (props.route.params.id > 0) {
        var locreq: OrganisationLocationSelectReq =
          new OrganisationLocationSelectReq();
        locreq.organisationid = usercontext.value.organisationid;
        console.log("locreq", locreq);


        let locresp = await organisationlocationservice.select(locreq);
        if (locresp) {

          setOrganisationlocation(locresp[0]);
        }
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  };
  const onSave = async () => {
    setIsloading(true);
    try {
      var req: OrganisationLocation = new OrganisationLocation();
      req = organisationlocation;
      req.organisationid = usercontext.value.organisationid;
      let locresp = await organisationlocationservice.save(req);
      AppAlert({ message: 'Saved' });
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  };

  const getLocationDetailsFromPincode = async (pincode: string) => {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.length > 0) {
        const location = data[0];
        
        const { lat, lon, display_name, address = {} } = location; // Default to empty object if `address` is 
        const parts = display_name.split(", ");
        var locations = { ...organisationlocation }
    
        locations.country = parts[4] || "N/A",
          locations.state = parts[3] || "N/A",
          locations.district = parts[2] || "N/A",
          locations.city = parts[1] || "N/A",
          locations.pincode = parts[0] || "N/A"
        setOrganisationlocation(locations)
        getLocationDetailsFromAddress("35,valkar street thiruvathigai")
        return ;
      } else {
        console.error("Location not found");
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  };

  const getLocationDetailsFromAddress = async (address: string) => {

    const formattedAddress = `${address}, Tamil Nadu, India`; 
    console.log("working... Fetching location for:", formattedAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formattedAddress)}&format=json&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("API Response:", data); // Debugging

        if (data.length > 0) {
            const location = data[0];
            return {
                latitude: parseFloat(location.lat),
                longitude: parseFloat(location.lon),
                display_name: location.display_name || "N/A"
            };
        } else {
            console.error("❌ Location not found");
            return null;
        }
    } catch (error) {
        console.error("❌ API Error:", error);
        return null;
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
            Add Location
          </AppText>
        </AppView>
        <ScrollView style={[$.flex_1]}>
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Location name"
            value={organisationlocation.name}
            onChangeText={loc => {
              setOrganisationlocation({
                ...organisationlocation,
                name: loc,
              });
            }}
          />
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="No, Building name"
            value={organisationlocation.addressline1}
            onChangeText={loc => {
              setOrganisationlocation({
                ...organisationlocation,
                addressline1: loc,
              });
            }}
          />
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Road name, Area"
            value={organisationlocation.addressline2}
            onChangeText={loc => {
              setOrganisationlocation({
                ...organisationlocation,
                addressline2: loc,
              });
            }}
          />
          <AppView style={[$.flex_row, $.mb_medium, $.mx_regular]}>
            <AppTextInput
              style={[$.bg_tint_11, $.flex_1, $.mr_medium]}
              placeholder="State"
              value={organisationlocation.state}
              onChangeText={loc => {
                setOrganisationlocation({
                  ...organisationlocation,
                  state: loc,
                });
              }}
            />
            <AppTextInput
              style={[$.bg_tint_11, $.flex_1]}
              placeholder="City"
              value={organisationlocation.city}
              onChangeText={loc => {
                setOrganisationlocation({
                  ...organisationlocation,
                  city: loc,
                });
              }}
            />
          </AppView>
          {/* <AppView>
            <AppText>
              {organisationlocation.country} ,
              {organisationlocation.state} ,
              {organisationlocation.district} ,
              {organisationlocation.city} ,
              {organisationlocation.pincode} , 
            </AppText>
          </AppView> */}
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Pincode"
            value={organisationlocation.pincode}
            onChangeText={loc => {
              setOrganisationlocation({
                ...organisationlocation,
                pincode: loc,
              });

              if (loc.length >= 6) { // Ensure valid pincode length
                getLocationDetailsFromPincode(loc);
              }
            }}

          />

        </ScrollView>
      </AppView>
      <AppView
        style={[
          $.flex_row,
          $.justify_content_center,
          $.mx_regular,
          $.mb_medium,
          $.py_regular,
        ]}>
        <AppButton
          name="Cancel"
          style={[$.bg_tint_11, $.flex_1, $.mr_huge]}
          textstyle={[$.text_danger]}
          onPress={() => {
            navigation.navigate('Organisation');
          }}
        />
        <AppButton
          name={props.route.params.id > 0 ? 'Update' : 'Save'}
          style={[$.bg_success, $.flex_1]}
          textstyle={[$.text_tint_11]}
          onPress={onSave}
        />
      </AppView>
    </AppView>
  );
}
