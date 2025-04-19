import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, TouchableOpacity, View} from 'react-native';

import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {AppAlert} from '../../components/appalert.component';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {useEffect} from 'react';
import React from 'react';
import {
  Organisation,
  OrganisationSelectReq,
} from '../../models/organisation.model';
import {OrganisationService} from '../../services/organisation.service';
type OrganisationScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Organisation'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function OrganisationScreen() {
  const navigation = useNavigation<OrganisationScreenProp['navigation']>();
  const [organisation, setOrganisation] = useState(new Organisation());
  const [organisationlocation, setOrganisationlocation] = useState<
    OrganisationLocation[]
  >([]);
  const [isloading, setIsloading] = useState(false);
  const organisationservice = useMemo(() => new OrganisationService(), []);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
  const usercontext = useAppSelector(selectusercontext);
  useFocusEffect(
    React.useCallback(() => {
      getData();
    }, []),
  );
  const getData = async () => {
    setIsloading(true);
    try {
      if (usercontext.value.userid > 0) {
        var orgreq: OrganisationSelectReq = new OrganisationSelectReq();
        orgreq.id = usercontext.value.organisationid;
        console.log('orgreq', orgreq);

        let orgresp = await organisationservice.select(orgreq);
        if (orgresp) {
          setOrganisation(orgresp[0]);
        }

        var locreq: OrganisationLocationSelectReq =
          new OrganisationLocationSelectReq();
        locreq.organisationid = usercontext.value.organisationid;
        let locresp = await organisationlocationservice.select(locreq);
        if (locresp) {
          setOrganisationlocation(locresp);
        } else {
          setOrganisationlocation([]); // Provide an empty array as a fallback
        }
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
      console.log('organisation', organisation);
      organisation.attributes = new Organisation.AttributesData();
      let orgresp = await organisationservice.save(organisation);
      AppAlert({message: 'Saved'});
      getData();
    } catch (error: any) {
      var message = error?.response?.data?.message;
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
            style={[$.ml_compact, $.p_small, $.text_primary5, $.fw_medium]}>
            Organisation
          </AppText>
        </AppView>
        <AppTextInput
          style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
          placeholder="Organisation name"
          value={organisation.name}
          onChangeText={org => {
            setOrganisation({
              ...organisation,
              name: org,
            });
          }}
        />
        <AppTextInput
          style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
          placeholder="GST number"
          value={organisation.gstnumber}
          onChangeText={org => {
            setOrganisation({
              ...organisation,
              gstnumber: org,
            });
          }}
        />
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Location', {id: 0});
          }}
          style={[$.flex_row, $.mx_regular, $.align_items_center, $.mb_medium]}>
          <AppText
            style={[
              $.pl_extrasmall,
              $.text_primary5,
              $.fw_medium,
              $.fw_bold,
              $.flex_1,
            ]}>
            Location
          </AppText>
          <AppView style={[$.border, $.border_tint_11, $.elevation_4]}>
            <CustomIcon
              name={CustomIcons.AddSquareRounded}
              size={$.s_medium}
              color={$.tint_primary_5}
            />
          </AppView>
        </TouchableOpacity>
        <FlatList
          style={[$.flex_1, $.bg_tint_11]}
          data={organisationlocation}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[$.pb_large]}
          ItemSeparatorComponent={() => (
            <View style={[$.border_bottom, $.border_tint_10, $.mx_regular]} />
          )}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                $.flex_row,
                $.align_items_center,
                $.justify_content_center,
                $.p_regular,
                $.mx_regular,
                $.my_tiny,
              ]}
              onPress={() => navigation.navigate('Location', {id: item.id})}
              activeOpacity={0.7}>
              <AppView style={[$.flex_1, $.mr_compact]}>
                <AppText
                  style={[$.text_tint_2, $.fw_semibold, $.mb_tiny]}
                 
                 >
                  {item.name}
                </AppText>

                <AppText
                  style={[$.text_tint_3, $.fs_small, $.mb_tiny]}
               >
                  {[item.addressline1, item.addressline2]
                    .filter(Boolean)
                    .join(', ')}
                </AppText>

                <AppText style={[$.text_tint_4, $.fs_small]}>
                  {[item.city, item.state, item.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </AppText>
              </AppView>

              <TouchableOpacity
                style={[$.p_tiny]}
                onPress={() =>{}}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <CustomIcon
                  name={CustomIcons.Delete}
                  size={$.s_compact}
                  color={$.danger}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <AppView
              style={[
                $.flex_1,
                $.justify_content_center,
                $.align_items_center,
                $.p_large,
              ]}>
              <CustomIcon
                name={CustomIcons.Location}
                size={$.s_large}
                color={$.tint_5}
               
              />
              <AppText style={[$.text_tint_4, $.text_center]}>
                No locations found. Add your first location to get started.
              </AppText>
            </AppView>
          }
        />
      </AppView>
      <AppView
        style={[
          $.flex_row,
          $.justify_content_center,
          $.mx_regular,
          $.mb_normal,
          $.py_normal,
        ]}>
        <AppButton
          name="Cancel"
          style={[
            $.bg_tint_11,
            $.border,
            $.border_rounded,
            $.border_danger,
            $.flex_1,
            $.mr_huge,
          ]}
          onPress={() => {
            navigation.navigate('Settings');
          }}
        />
        <AppButton
          name="Save"
          style={[$.flex_1, $.border, $.border_rounded, $.border_success]}
      
          onPress={onSave}
        />
      </AppView>
    </AppView>
  );
}
