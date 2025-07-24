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
import {FormInput} from '../../components/forminput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, TouchableOpacity, ViewStyle, SafeAreaView} from 'react-native';

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

  const inputContainerStyle: ViewStyle = {
    marginBottom: 16,
  };

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
      AppAlert({ message: message});
    } finally {
      setIsloading(false);
    }
  };

   
  return (
    <SafeAreaView style={{ flex: 1 }}>
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

        <AppView style={[$.px_regular]}>
          <FormInput
            label="Organisation Name"
            value={organisation.name}
            onChangeText={org => {
              setOrganisation({
                ...organisation,
                name: org,
              });
            }}
            placeholder="Enter organisation name"
            containerStyle={inputContainerStyle}
          />

          <FormInput
            label="GST Number"
            value={organisation.gstnumber}
            onChangeText={org => {
              setOrganisation({
                ...organisation,
                gstnumber: org,
              });
            }}
            placeholder="Enter GST number"
            containerStyle={inputContainerStyle}
          />
        </AppView>

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
          <AppView style={[$.border,$.border_tint_11,$.elevation_4]}>
            <CustomIcon
              name={CustomIcons.AddSquareRounded}
              size={$.s_medium}
              color={$.tint_primary_5}
            />
          </AppView>
        </TouchableOpacity>

        <FlatList
          style={[$.flex_1]}
          data={organisationlocation}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[$.px_regular]}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                $.mb_small,
                $.border_rounded,
                $.elevation_4,
                $.bg_tint_11,
                $.p_small,
              ]}
              onPress={() => {
                navigation.navigate('Location', {
                  id: item.id,
                });
              }}>
              <AppView style={[$.flex_row, $.align_items_center]}>
                <AppView style={[$.flex_1]}>
                  <AppText
                    style={[
                      $.text_primary5,
                      $.fw_semibold,
                      $.fs_compact,
                      $.mb_tiny,
                    ]}>
                    {item.name}
                  </AppText>
                  <AppText
                    style={[
                      $.text_tint_ash,
                      $.fs_small,
                      $.mb_tiny,
                    ]}>
                    {item.addressline1}
                    {item.addressline2 ? `, ${item.addressline2}` : ''}
                  </AppText>
                  <AppText
                    style={[
                      $.text_tint_ash,
                      $.fs_small,
                    ]}>
                    {item.city}, {item.state} - {item.pincode}
                  </AppText>
                </AppView>
                <TouchableOpacity 
                  style={[
                    $.p_tiny,
                    $.border_rounded,
                    $.bg_tint_11,
                    $.elevation_2,
                  ]}
                  onPress={() => {
                    // Add delete functionality here
                    AppAlert({message: 'Delete functionality to be implemented'});
                  }}>
                  <CustomIcon
                    name={CustomIcons.Delete}
                    size={$.s_compact}
                    color={$.danger}
                  />
                </TouchableOpacity>
              </AppView>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <AppView style={[$.p_medium, $.align_items_center]}>
              <AppText style={[$.text_tint_3, $.fw_medium]}>
                No locations added yet
              </AppText>
              <TouchableOpacity
                style={[
                  $.mt_medium,
                  $.p_small,
                  $.bg_tint_3,
                  $.border_rounded,
                  $.flex_row,
                  $.align_items_center,
                ]}
                onPress={() => {
                  navigation.navigate('Location', {id: 0});
                }}>
                <CustomIcon
                  name={CustomIcons.AddSquareRounded}
                  size={$.s_medium}
                  color={$.tint_primary_5}
                />
                <AppText style={[$.ml_tiny, $.text_tint_11, $.fw_semibold]}>
                  Add Location
                </AppText>
              </TouchableOpacity>
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
          style={[$.bg_tint_11,$.border,$.border_rounded,$.border_danger, $.flex_1, $.mr_huge]}
          textStyle={[$.text_danger]}
          onPress={() => {
            navigation.navigate('Settings');
          }}
        />
        <AppButton
          name="Save"
          style={[ $.flex_1,$.border,$.border_rounded,$.border_success]}
          textStyle={[$.text_success]}
          onPress={onSave}
        />
      </AppView>
    </AppView>
    </SafeAreaView>
  );
}
