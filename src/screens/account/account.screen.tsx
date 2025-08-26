import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {Dimensions, FlatList, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {useEffect, useMemo, useState} from 'react';
import {DefaultColor} from '../../styles/default-color.style';
import {themeActions} from '../../redux/theme.redux';
import {store} from '../../redux/store.redux';
import {
  iscustomeractions,
  selectiscustomer,
} from '../../redux/iscustomer.redux';
import {useSelector} from 'react-redux';
import {
  OrganisationLocationStaffReq,
  OrganisationLocationStaffRes,
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {AppAlert} from '../../components/appalert.component';
import {UsersContext} from '../../models/users.model';
import { FormSelect } from '../../components/formselect.component';

type AccountScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Account'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function AccountScreen() {
  const navigation = useNavigation<AccountScreenProp['navigation']>();

  const colors = DefaultColor.instance.colors;
  const usercontext = useAppSelector(selectusercontext);
  const isCustomer = useSelector(selectiscustomer).isCustomer;
  const isLoggedIn = useSelector(selectiscustomer).isLoggedIn;
  const dispatch = useAppDispatch();

  const screenWidth = Dimensions.get('window').width;

  // Update login status when usercontext changes
  useEffect(() => {
    if (usercontext && usercontext.value && usercontext.value.userid > 0) {
      console.log('Setting user as logged in with userid:', usercontext.value.userid);
      dispatch(iscustomeractions.setLoginStatus(true));
      // Also set the customer type based on whether they have an organization
      if (usercontext.value.organisationid > 0) {
        console.log('Setting user as organization (isCustomer = false)');
        dispatch(iscustomeractions.setIsCustomer(false)); // Organization
      } else {
        console.log('Setting user as customer (isCustomer = true)');
        dispatch(iscustomeractions.setIsCustomer(true)); // Customer
      }
    } else {
      console.log('Setting user as logged out');
      dispatch(iscustomeractions.setLoginStatus(false));
      dispatch(iscustomeractions.setIsCustomer(false));
    }
  }, [usercontext, dispatch]);

  // Force refresh navigation when login status changes
  useEffect(() => {
    console.log('Login status changed:', { isLoggedIn, isCustomer });
  }, [isLoggedIn, isCustomer]);

  // Safety check for usercontext
  if (!usercontext || !usercontext.value) {
    return (
      <ScrollView style={[$.flex_1, {backgroundColor: '#F5F7FA'}]}>
        <AppView style={[$.mx_normal, $.border_rounded2, $.m_small, $.p_big]}>
          <AppView style={[ $.align_items_center]}>
            <AppView
              style={[
                $.align_items_center
              ]}>
              <Image
                source={require('../../assert/A1.png')}
                style={{
                  width: screenWidth * 0.4,
                  height: screenWidth * 0.4,
                  marginBottom: 24,
                }}
                resizeMode="contain"
              />
              <AppText style={[$.fw_bold, $.fs_enormous, $.text_primary5]}>
                Appointza
              </AppText>
              <AppText
                style={{
                  fontSize: 16,
                  color: '#666666',
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 24,
                }}>
                Book. Manage. Meet.
              </AppText>
              <AppText
                style={{
                  fontSize: 16,
                  color: '#666666',
                  textAlign: 'center',
                  lineHeight: 24,
                }}>
                All in One Place
              </AppText>
            </AppView>
          </AppView>
        </AppView>
      </ScrollView>
    );
  }

  const gotoSignUp = (value: boolean) => {
    navigation.navigate('SignUp', {isorganization: value});
  };

  const logout = () => {
    dispatch(usercontextactions.clear());
    dispatch(usercontextactions.set(new UsersContext()));
    dispatch(iscustomeractions.logout()); // Use the new logout action
  };

  const isUserLoggedIn = usercontext && usercontext.value && usercontext.value.userid > 0;
  const hasBusiness = usercontext && usercontext.value && usercontext.value.organisationid > 0;

  // Debug logging
  console.log('Account Screen Debug:', {
    isLoggedIn,
    isCustomer,
    isUserLoggedIn,
    hasBusiness,
    userid: usercontext?.value?.userid,
    organisationid: usercontext?.value?.organisationid
  });

  type MenuItem = {
    icon: CustomIcons;
    label: string;
    onPress: () => void;
    showChevron: boolean;
    isHighlighted?: boolean;
  };

  const menuItems: MenuItem[] = [
    // Business items - Only show when logged in as organization
    ...(isLoggedIn && !isCustomer && hasBusiness
      ? [
          // Remove Services menu item - not needed for organization users
          // {
          //   icon: CustomIcons.Shop,
          //   label: 'Services',
          //   onPress: () => navigation.navigate('ServiceAvailable'),
          //   showChevron: true,
          // },
          {
            icon: CustomIcons.Supplier,
            label: 'Location',
            onPress: () => navigation.navigate('Organisation'),
            showChevron: true,
          },
          {
            icon: CustomIcons.Clock,
            label: 'Services Timing',
            onPress: () => navigation.navigate('Timing', { fromService: false }),
            showChevron: true,
          },
          {
            icon: CustomIcons.AddAccount,
            label: 'Add Staff',
            onPress: () => navigation.navigate('AddedAccounts'),
            showChevron: true,
          },
        ]
      : []),

    // User items
    ...(isUserLoggedIn
      ? [
          {
            icon: CustomIcons.Account,
            label: 'Profile',
            onPress: () => navigation.navigate('Profile'),
            showChevron: true,
          },
          {
            icon: CustomIcons.Logout,
            label: 'Logout',
            onPress: () => logout(),
            showChevron: false,
            isHighlighted: true,
          },
        ]
      : [
          {
            icon: CustomIcons.AddAccount,
            label: 'Sign up as User',
            onPress: () => gotoSignUp(false),
            showChevron: true,
          },
          {
            icon: CustomIcons.Shop,
            label: 'Sign up as Business',
            onPress: () => gotoSignUp(true),
            showChevron: true,
          },
          {
            icon: CustomIcons.Account,
            label: 'Login',
            onPress: () => navigation.navigate('Login'),
            showChevron: true,
          },
        ]),
  ];

  const renderMenuItem = (item: any, index: any) => (
    <TouchableOpacity
      key={index}
      onPress={item.onPress}
      style={[$.flex_row, $.align_items_center, $.p_medium, $.border_tint_4]}>
      <CustomIcon color={$.tint_primary_5} name={item.icon} size={$.s_normal} />
      <AppText
        style={[
          $.fs_compact,
          $.px_normal,
          $.flex_1,
          item.isHighlighted ? $.text_tint_2 : $.text_primary5,
          item.isHighlighted ? $.fw_regular : $.fw_light,
        ]}>
        {item.label || ''}
      </AppText>
      {item.showChevron && (
        <CustomIcon
          color={$.tint_primary_5}
          name={CustomIcons.RightChevron}
          size={$.s_small}
        />
      )}
    </TouchableOpacity>
  );

  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  const [selectlocation, Setselectlocation] =
    useState<OrganisationLocationStaffRes | null>(null);

  // Business locations state
  const [organisationlocation, setOrganisationlocation] = useState<OrganisationLocation[]>([]);
  const [Selectorganisationlocationid, setSelectorganisationlocationid] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoggedIn && usercontext?.value?.userid) {
      getstafflocation();
    }
  }, [isUserLoggedIn, usercontext]);



  const getstafflocation = async () => {
    try {
      const req = new OrganisationLocationStaffReq();
      req.userid = usercontext?.value?.userid || 0;
      const res = await organisationLocationService.Selectlocation(req);

      if (res && res.length > 0) {
        Setselectlocation(res[0]);
      } else {
        Setselectlocation(null);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    const message = error?.response?.data?.message || 'An error occurred';
    if (message && typeof message === 'string') {
      AppAlert({message: message.toString()});
    }
  };

  // Fetch organisation locations for business users
  useEffect(() => {
    const orgId = usercontext?.value?.organisationid || 0;
    if (orgId > 0 && isLoggedIn && !isCustomer) {
      // If we already have a stored selection in redux, preload it
      if (usercontext?.value?.organisationlocationid) {
        setSelectorganisationlocationid(usercontext.value.organisationlocationid);
      }
      getorganisation();
    } else {
      // Clear when not a business user
      setOrganisationlocation([]);
      setSelectorganisationlocationid(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usercontext?.value?.organisationid, isLoggedIn, isCustomer]);

  const handleLocationSelect = (loc: OrganisationLocation) => {
    setSelectorganisationlocationid(loc.id);
    dispatch(usercontextactions.setOrganisationLocation({ id: loc.id, name: loc.city }));
  };

  const getorganisation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const locreq: OrganisationLocationSelectReq = new OrganisationLocationSelectReq();
      locreq.organisationid = usercontext.value.organisationid;
      const locresp = await organisationLocationService.select(locreq);
      if (locresp && locresp.length > 0) {
        setOrganisationlocation(locresp);
        // Prefer existing redux selection if valid
        const existingId = usercontext?.value?.organisationlocationid || 0;
        const hasExisting = existingId > 0 && locresp.some(l => l.id === existingId);
        if (hasExisting) {
          setSelectorganisationlocationid(existingId);
        } else if (locresp.length === 1 && locresp[0].id) {
          // Auto-select first when only one
          setSelectorganisationlocationid(locresp[0].id);
          dispatch(usercontextactions.setOrganisationLocation({ id: locresp[0].id, name: locresp[0].city }));
        } else if (!Selectorganisationlocationid && locresp[0].id) {
          // Set a default selection locally, allow user to change via FormSelect
          setSelectorganisationlocationid(locresp[0].id);
          // Do not dispatch here to avoid overriding user's later choice
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

  const toggleCustomerBusiness = () => {
    dispatch(iscustomeractions.setIsCustomer(!isCustomer));
  };


 
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={[$.flex_1, {backgroundColor: '#F5F7FA'}]}>
      {/* Profile Header */}
      <AppView style={[$.mx_normal, $.border_rounded2, $.m_small, $.p_big]}>
        {isLoggedIn && (
          <AppView>
            <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
              <AppView style={[$.mr_medium]}>
                <Image
                  style={{
                    borderRadius: 30,
                    width: 60,
                    height: 60,
                    borderWidth: 2,
                    borderColor: $.tint_10,
                  }}
                  source={{
                    uri: 'https://s3-alpha-sig.figma.com/img/6a98/e81b/28b333039b432776eb354412dfc36db6?Expires=1736121600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=RM4xqC9wBX~AFmwoHy9bjm4RGSkMyAwhum3dWECBjW83kdSUAcFWix1EBG8iPS4CByrsDBs9z3Z0mo8stq-4d0SR4ifUZxsk4jL2dbTlwzzzD2ZVe1XEN1p05yGxz~LJj6ogrwtH36B1DN6ZsSCxCxxPmaQ-DhKfDnceXQhweJEM3s8vt6hzpOC9dXx5cwp5DJmAdEK~tTVXxUQuYbqZX9SnQoqx27RVftTc9c~WtCA4rxHoRPtAZuINO2-ptdRUhGLpt1fjc~vWmoWrUFiUQx2SEPm4y2WLM1lCQYfTguig6nomt0DwcgIG6q8gVAdEnboMTbyh5tlDRXMv3s46VA__',
                  }}
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  style={[
                    $.bg_tint_5,
                    $.p_tiny,
                    $.align_items_center,
                    $.justify_content_center,
                    {
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      borderRadius: 15,
                      width: 24,
                      height: 24,
                    },
                  ]}>
                  <CustomIcon
                    color={$.tint_11}
                    name={CustomIcons.Camera2}
                    size={14}
                  />
                </TouchableOpacity>
              </AppView>

              <AppView style={[$.flex_1]}>
                <AppText style={[$.fs_big, $.fw_bold, $.text_primary5]}>
                  {usercontext?.value?.username || ''}
                </AppText>
                {usercontext?.value?.organisationname && usercontext.value.organisationname.length > 0 && (
                  <AppText
                    style={[
                      $.fs_compact,
                      $.text_primary5,
                      $.mt_tiny,
                      $.fw_regular,
                    ]}>
                    {usercontext.value.organisationname || ''}
                  </AppText>
                )}
              </AppView>
            </AppView>

            {/* Only show toggle if user has a business */}
            {isLoggedIn && !isCustomer && usercontext?.value?.userid > 0 &&  (
              <AppView style={[$.align_items_center]}>
                <TouchableOpacity onPress={toggleCustomerBusiness}>
                  <AppText style={[$.text_primary5, $.fs_small, $.fw_bold]}>
                    Login as {!isCustomer ? 'Business' : 'Customer'}
                  </AppText>
                </TouchableOpacity>
              </AppView>
            )}
          </AppView>
        )}

        {!isLoggedIn && (
          <AppView style={[ $.align_items_center]}>
            <AppView
              style={[
                $.align_items_center
              ]}>
                              <Image
                  source={require('../../assert/A1.png')}
                  style={{
                    width: screenWidth * 0.4,
                    height: screenWidth * 0.4,
                    marginBottom: 24,
                  }}
                  resizeMode="contain"
                />
              <AppText style={[$.fw_bold, $.fs_enormous, $.text_primary5]}>
                Appointza
              </AppText>
              <AppText
                style={{
                  fontSize: 16,
                  color: '#666666',
                  textAlign: 'center',
                  marginTop: 8,
                  lineHeight: 24,
                }}>
                Book. Manage. Meet.
              </AppText>
              <AppText
                style={{
                  fontSize: 16,
                  color: '#666666',
                  textAlign: 'center',
                  lineHeight: 24,
                }}>
                All in One Place
              </AppText>
            </AppView>
          </AppView>
        )}
      </AppView>

        {/* Business Location Selector - Centralized location selection for all business screens */}
        {isLoggedIn && !isCustomer && usercontext?.value?.userid > 0 && usercontext?.value?.organisationid > 0 && organisationlocation.length > 0 && (
          <AppView style={[$.mx_normal, $.border_rounded2, $.m_small, $.p_big, {backgroundColor: '#FFFFFF'}]}>
            <AppText style={[$.fs_compact, $.fw_semibold, $.text_primary5, $.mb_small]}>
              Business Location
            </AppText>
            {organisationlocation.length > 1 ? (
              <FormSelect
                label="Select Business Location"
                options={organisationlocation.map(loc => ({ id: loc.id, name: loc.city }))}
                selectedId={Selectorganisationlocationid}
                onSelect={(item) => {
                  const loc = organisationlocation.find(l => l.id === item.id);
                  if (loc) handleLocationSelect(loc);
                }}
              />
            ) : (
              <AppView style={[$.p_medium, $.bg_tint_10, $.border_rounded]}>
                <AppText style={[$.fs_small, $.fw_bold, $.text_primary5]}>
                  {organisationlocation[0]?.city || ''}
                </AppText>
              </AppView>
            )}
          </AppView>
        )}

      {/* Menu Section */}
      <AppView
        style={[
          $.mx_normal,
          $.m_big,
          $.border_rounded2,
          $.mb_large,
          {backgroundColor: '#FFFFFF'},
        ]}>
        {/* Business location selector */}
        {menuItems.map(renderMenuItem)}
      </AppView>

      {/* App Version */}
      <AppView
        style={[
          $.align_items_center,
          $.mb_large,
          {backgroundColor: '#F5F7FA'},
        ]}>
        <AppText style={[$.fs_extrasmall, $.text_tint_4]}>
          App Version 1.0.0
        </AppText>
      </AppView>
    </ScrollView> 
      </SafeAreaView>
  );
}
