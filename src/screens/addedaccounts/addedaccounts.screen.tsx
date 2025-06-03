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
import {FormSelect} from '../../components/formselect.component';
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
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';

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
    <ScrollView style={{ }}>
      <AppView style={[$.pt_medium,{ }]}>
        <CustomHeader
          title="Added Accounts"
          showBackButton
          backgroundColor={Colors.light.background}
          titleColor={Colors.light.text}
          rightComponent={
            <TouchableOpacity
              onPress={() => {
                handleAddAccountPress('');
              }}
              style={{
                backgroundColor: '#FFFFFF',
                padding: 8,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <CustomIcon
                name={CustomIcons.AddSquareRounded}
                color={$.tint_2}
                size={$.s_huge}
              />
            </TouchableOpacity>
          }
        />

        {error && (
          <AppView style={[$.px_normal, $.mb_normal]}>
            <AppText style={[$.text_danger, $.fs_small]}>{error}</AppText>
          </AppView>
        )}

        <AppView style={[$.px_normal, $.mb_normal,{ }]}>
          <FormSelect
            label="Select Business Location"
            options={organisationlocation.map(loc => ({
              id: loc.id,
              name: loc.city,
            }))}
            selectedId={Selectorganisationlocationid}
            onSelect={(item) => handleLocationSelect(organisationlocation.find(loc => loc.id === item.id)!)}
          />
        </AppView>

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
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[$.mb_normal]}
                onPress={() => {
                  // Navigate to details screen with selected staff ID
                  // Handle staff item press if needed
                }}>
                <AppView
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                  <AppView style={[$.flex_row, $.align_items_center, { justifyContent: 'space-between' }]}>
                    <AppView style={[$.flex_1]}>
                      <AppText
                        style={[$.fs_compact, $.fw_semibold, $.text_tint_1, $.mb_tiny]}>
                        {item.name}
                      </AppText>
                      <AppView style={[$.flex_row, $.align_items_center]}>
                        <AppText
                          style={[$.fs_extrasmall, $.fw_regular, $.text_tint_2]}>
                          {item.city}
                        </AppText>
                        <AppView style={[$.mx_tiny]}>
                          <CustomIcon
                            name={CustomIcons.Dot}
                            size={$.s_big}
                            color={$.tint_8}
                          />
                        </AppView>
                        <AppText
                          style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
                          {item.country}
                        </AppText>
                      </AppView>
                    </AppView>

                    <TouchableOpacity 
                      onPress={() => deleteuser(item.id)}
                      style={{
                        backgroundColor: '#FFF5F5',
                        padding: 8,
                        borderRadius: 8,
                      }}>
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
