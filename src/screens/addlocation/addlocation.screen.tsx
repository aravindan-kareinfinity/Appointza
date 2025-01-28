import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList, navigate} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {ScrollView, TouchableOpacity} from 'react-native';
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {AppAlert} from '../../components/appalert.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
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
        locreq.id = props.route.params.id;
        let locresp = await organisationlocationservice.select(locreq);
        setOrganisationlocation(locresp[0]);
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
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
      AppAlert({message: 'Saved'});
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.message;
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
            Add Location
          </AppText>
        </AppView>
        <ScrollView style={[$.flex_1]}>
          <AppTextInput
            style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
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
            style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
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
            style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
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
              style={[$.bg_tint_10, $.flex_1, $.mr_medium]}
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
              style={[$.bg_tint_10, $.flex_1]}
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
          <AppTextInput
            style={[$.bg_tint_10, $.mx_regular, $.mb_medium]}
            placeholder="Pincode"
            value={organisationlocation.pincode}
            onChangeText={loc => {
              setOrganisationlocation({
                ...organisationlocation,
                pincode: loc,
              });
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
          style={[$.bg_tint_10, $.flex_1, $.mr_huge]}
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
