import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {$} from '../../styles';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {AppText} from '../../components/apptext.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {AppTextInput} from '../../components/apptextinput.component';
import {AppButton} from '../../components/appbutton.component';
import {UsersService} from '../../services/users.service';
import {
  Users,
  UsersContext,
  UsersLoginReq,
  UsersSelectReq,
} from '../../models/users.model';
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {StaffService} from '../../services/staff.service';
import {
  Staff,
  StaffDeleteReq,
  StaffSelectReq,
  StaffUser,
} from '../../models/staff.model';
import {AppSwitch} from '../../components/appswitch.component';
import {environment} from '../../utils/environment';

type AddedAccountsScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AddedAccounts'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function AddedAccountsScreen() {
  const navigation = useNavigation<AddedAccountsScreenProp['navigation']>();
  const usercontext = useAppSelector(selectusercontext);
  const [stafflist, setStafflist] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staffservice = useMemo(() => new StaffService(), []);
  const [organisationlocation, setOrganisationlocation] = useState<
    OrganisationLocation[]
  >([]);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
  const [Selectorganisationlocationid, setSelectorganisationlocationid] =
    useState(0);

  const getdata = async () => {
    if (!Selectorganisationlocationid) return;

    setIsLoading(true);
    setError(null);
    try {
      const req = new StaffSelectReq();
      req.organisationlocationid = Selectorganisationlocationid;
      const res = await staffservice.SelectStaffDetail(req);
      if (res) {
        setStafflist(res);
      } else {
        setStafflist([]);
      }
    } catch (err) {
      setError('Failed to fetch staff data');
      console.error('Error fetching staff:', err);
      Alert.alert('Error', 'Failed to fetch staff data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteuser = async (id: number) => {
    // Show confirmation dialog first
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this staff member?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const req = new StaffDeleteReq();
              req.id = id;
              const res = await staffservice.delete(req);

              if (res) {
                // Show success message
                Alert.alert('Success', 'Staff member deleted successfully');
                // Refresh the staff list
                await getdata();
              } else {
                Alert.alert('Error', 'Failed to delete staff member');
              }
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert(
                'Error',
                'Failed to delete staff member. Please try again.',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const getorganisation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const locreq: OrganisationLocationSelectReq =
        new OrganisationLocationSelectReq();
      locreq.organisationid = usercontext.value.organisationid;
      const locresp = await organisationlocationservice.select(locreq);
      if (locresp && locresp.length > 0) {
        setOrganisationlocation(locresp);
        // Automatically select the first location if none is selected
        if (!Selectorganisationlocationid && locresp[0].id) {
          setSelectorganisationlocationid(locresp[0].id);
        }
      } else {
        setOrganisationlocation([]);
        setError('No business locations found');
      }
    } catch (err) {
      setError('Failed to fetch business locations');
      console.error('Error fetching locations:', err);
      Alert.alert(
        'Error',
        'Failed to fetch business locations. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getdata();
  }, [Selectorganisationlocationid]);

  useFocusEffect(
    useCallback(() => {
      getorganisation();
    }, []),
  );

  const handleLocationSelect = (item: OrganisationLocation) => {
    setSelectorganisationlocationid(item.id);
  };

  const handleAddAccountPress = (mobile: string) => {
    if (!Selectorganisationlocationid) {
      Alert.alert('Please select a business location first');
      return;
    }
    navigation.navigate('AddedAccountsDetails', {mobile: mobile});
  };

  return (
    <ScrollView>
      <AppView style={[$.pt_medium]}>
        <AppView
          style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_medium]}>
          <AppView style={[$.flex_row, $.flex_1, $.align_items_center]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <CustomIcon
                name={CustomIcons.LeftArrow}
                size={$.s_regular}
                color={$.tint_2}
              />
            </TouchableOpacity>
            <AppText
              style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
              Added Accounts
            </AppText>
          </AppView>
          <TouchableOpacity
            onPress={() => {
              handleAddAccountPress('');
            }}>
            <CustomIcon
              name={CustomIcons.AddSquareRounded}
              color={$.tint_2}
              size={$.s_huge}
            />
          </TouchableOpacity>
        </AppView>

        {error && (
          <AppView style={[$.px_normal, $.mb_normal]}>
            <AppText style={[$.text_danger, $.fs_small]}>{error}</AppText>
          </AppView>
        )}

        <AppSingleSelect
          data={organisationlocation}
          keyExtractor={e => e.id.toString()}
          searchKeyExtractor={e => e.city}
          renderItemLabel={item => (
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
              {item.city}
            </AppText>
          )}
          selecteditemid={Selectorganisationlocationid.toString()}
          onSelect={handleLocationSelect}
          title="Select Business Location"
          style={[$.mb_normal]}
        />

        {isLoading ? (
          <AppView style={[$.p_normal, $.align_items_center]}>
            <AppText>Loading...</AppText>
          </AppView>
        ) : stafflist.length === 0 ? (
          <AppView style={[$.p_normal, $.align_items_center]}>
            <AppText>No staff found for this location</AppText>
          </AppView>
        ) : (
          <FlatList
            data={stafflist}
            style={[$.pt_compact]}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[$.p_compact]}
                onPress={() => {
                  // Navigate to details screen with selected staff ID
                  // Handle staff item press if needed
                }}>
                <AppView
                  style={[
                    $.px_normal,
                    $.mb_normal,
                    $.flex_row,
                    $.align_items_center,
                  ]}>
                  <AppView style={[$.flex_row,]}>
                    <AppView style={[$.flex_1]}>

                    <AppView style={[$.flex_row,]}>
                      <AppText
                        style={[$.fs_compact, $.fw_semibold, $.text_tint_2]}>
                        {item.name}
                      </AppText>
                    </AppView>
                    <AppView style={[$.flex_row, $.align_items_center]}>
                      <AppText
                        style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                        {item.city}
                      </AppText>
                      <CustomIcon
                        name={CustomIcons.Dot}
                        size={$.s_big}
                        color={$.tint_8}
                      />
                      <AppText
                        style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                        {item.country}
                      </AppText>
                    </AppView>
                    </AppView>

                    <TouchableOpacity onPress={() => deleteuser(item.id)}>
                      <CustomIcon
                        name={CustomIcons.Delete}
                        size={$.s_big}
                        color={$.danger}
                      />
                    </TouchableOpacity>
                  </AppView>
                </AppView>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        )}
      </AppView>
    </ScrollView>
  );
}
