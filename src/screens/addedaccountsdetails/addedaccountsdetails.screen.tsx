import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { $ } from '../../styles';
import { Alert, ScrollView } from 'react-native';
import { AppText } from '../../components/apptext.component';
import { AppTextInput } from '../../components/apptextinput.component';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppButton } from '../../components/appbutton.component';
import { AppSwitch } from '../../components/appswitch.component';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { UsersContext, UsersLoginReq, UsersPermissionData } from '../../models/users.model';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { StaffService } from '../../services/staff.service';
import { OrganisationLocation, OrganisationLocationSelectReq } from '../../models/organisationlocation.model';
import { UsersService } from '../../services/users.service';
import { Staff, StaffSelectReq } from '../../models/staff.model';
import { AppSingleSelect } from '../../components/appsingleselect.component';

type AddedAccountsDetailsScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AddedAccountsDetails'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function AddedAccountsDetailsScreen({ route }: AddedAccountsDetailsScreenProp) {
  const navigation = useNavigation<AddedAccountsDetailsScreenProp['navigation']>();
  const usercontext = useAppSelector(selectusercontext);
  
  // State management
  const [searchContact, setSearchContact] = useState('');
  const [selectedUser, setSelectedUser] = useState<UsersContext | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(0);
  const [userPermissions, setUserPermissions] = useState<UsersPermissionData>(new UsersPermissionData());
  const [organisationLocations, setOrganisationLocations] = useState<OrganisationLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  // Services
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const staffService = useMemo(() => new StaffService(), []);
  const usersService = useMemo(() => new UsersService(), []);

  // Check if we're in edit mode (has route.params.userid)
  useEffect(() => {
    if (route.params?.mobile) {
      setIsEditMode(true);
      fetchStaffDetails(route.params.mobile);
    }
  }, [route.params?.mobile]);

  // Format permission keys for display
  const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, " $1")
              .replace(/^./, str => str.toUpperCase())
              .trim();
  };

  // Fetch staff details for edit mode
  const fetchStaffDetails = async (mobile: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First fetch user details by mobile
      const userreq = new UsersLoginReq();
      userreq.mobile = mobile;
      const userres = await usersService.SelectUser(userreq);
      
      if (!userres) {
        setError('User not found');
        setSelectedUser(null);
        setCurrentStaff(null);
        return;
      }

      setSelectedUser(userres);
      // Reset permissions initially (will be overwritten if staff exists)
      setUserPermissions(new UsersPermissionData());

      // Then fetch staff details by userid
      const req = new StaffSelectReq();
      req.userid = userres.userid;
      req.organisationid = userres.organisationid;
      const staffRes = await staffService.select(req);
      
      if (staffRes && staffRes.length > 0) {
        const staff = staffRes[0];
        setCurrentStaff(staff);
        setSelectedLocationId(staff.organisationlocationid);
        console.log(staff.roles);
        
        setUserPermissions(staff.roles);
      } else {
        // Staff record doesn't exist yet, but we have the user
        setCurrentStaff(null);
        setUserPermissions(new UsersPermissionData());
      }
    } catch (err) {
      setError('Failed to load details');
      console.error('Fetch error:', err);
      setSelectedUser(null);
      setCurrentStaff(null);
    } finally {
      setIsLoading(false);
    }
};

  // Search for user by contact number (only in create mode)
  const handleSearch = async () => {
    if (isEditMode) return;
    
    if (!searchContact.trim()) {
      setError('Please enter a contact number');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const req = new UsersLoginReq();
      req.mobile = searchContact;
      const res = await usersService.SelectUser(req);
      
      if (res) {
        setSelectedUser(res);
        // Reset permissions when a new user is selected
        setUserPermissions(new UsersPermissionData());
      } else {
        setError('User not found');
        setSelectedUser(null);
      }
    } catch (err) {
      setError('Failed to search for user');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organization locations
  const fetchOrganizationLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const req = new OrganisationLocationSelectReq();
      req.organisationid = usercontext.value.organisationid;
      const locations = await organisationLocationService.select(req);
      
      if (locations && locations.length > 0) {
        setOrganisationLocations(locations);
        // In edit mode, don't auto-select location (we'll use the staff's location)
        if (!isEditMode && !selectedLocationId) {
          setSelectedLocationId(locations[0].id);
        }
      } else {
        setError('No business locations found');
        setOrganisationLocations([]);
      }
    } catch (err) {
      setError('Failed to load business locations');
      console.error('Location fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [usercontext.value.organisationid, isEditMode]);

  // Save or update staff member
  const handleSaveStaff = async () => {
    if (!selectedLocationId) {
      setError('Please select a business location');
      return;
    }

    if (isEditMode && !currentStaff) {
      setError('No staff member selected for editing');
      return;
    }

    if (!isEditMode && !selectedUser) {
      setError('No user selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const staffReq = new Staff();
      
      if (isEditMode && currentStaff) {
        // Edit existing staff
        staffReq.id = currentStaff.id;
        staffReq.userid = currentStaff.userid;
      } else if (selectedUser) {
        // Create new staff
        staffReq.userid = selectedUser.userid;
      }
      
      staffReq.roles = userPermissions;
      staffReq.organisationid = usercontext.value.organisationid;
      staffReq.organisationlocationid = selectedLocationId;
      staffReq.isactive = true;

      const res = await staffService.save(staffReq);
      
      if (res) {
        Alert.alert('Success', `Staff member ${isEditMode ? 'updated' : 'added'} successfully`);
        navigation.goBack();
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'add'} staff member`);
      }
    } catch (err) {
      setError(`Error ${isEditMode ? 'updating' : 'adding'} staff member`);
      console.error('Save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update permission state
  const handlePermissionChange = (key: keyof UsersPermissionData, field: 'view' | 'manage', value: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Fetch locations on focus
  useFocusEffect(
    useCallback(() => {
      fetchOrganizationLocations();
    }, [fetchOrganizationLocations])
  );

  return (
    <AppView style={[$.flex_1, $.m_small]}>
      {/* Search Section (only shown in create mode) */}
      {!isEditMode && (
        <AppView style={[$.flex_row, $.mb_normal]}>
          <AppTextInput
            style={[$.bg_tint_10, $.flex_1, $.mr_small]}
            placeholder="Enter contact number"
            value={searchContact}
            onChangeText={setSearchContact}
            keyboardtype="phone-pad"
           
          />
          <AppButton
            name="Search"
            style={[$.bg_success]}
            textStyle={[$.text_tint_11]}
            onPress={handleSearch}
            
          />
        </AppView>
      )}

      {error && (
        <AppText style={[$.text_danger, $.mb_small]}>{error}</AppText>
      )}

      {isLoading && (
        <AppText style={[$.text_tint_6, $.mb_small]}>Loading...</AppText>
      )}

      {/* User Details Section */}
      {(selectedUser || isEditMode) && (
        <AppView style={[$.flex_1]}>

          <AppView style={[$.flex_1]}>


          {selectedUser && (
            <AppView style={[$.mb_normal]}>
              <AppText style={[$.fw_bold]}>User Details:</AppText>
              <AppText>Name: {selectedUser.username}</AppText>
              <AppText>Mobile: {selectedUser.usermobile}</AppText>
              <AppText>Current Location: {selectedUser.organisationlocationname}</AppText>
            </AppView>
          )}

          {/* Location Selection */}
          <AppSingleSelect
            data={organisationLocations}
            keyExtractor={item => item.id.toString()}
            searchKeyExtractor={item => item.city}
            renderItemLabel={item => (
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>
                {item.city}
              </AppText>
            )}
            selecteditemid={selectedLocationId.toString()}
            onSelect={item => setSelectedLocationId(item.id)}
            title="Select Business Location"
            style={[$.mb_normal]}
            
          />
            </AppView>

          {/* Permissions Section */}
          {/* <AppText style={[$.fw_bold, $.mb_small]}>Permissions:</AppText>
          <ScrollView style={[$.flex_1, $.mb_normal]}>
            {(Object.keys(userPermissions) as Array<keyof UsersPermissionData>).map((key) => (
              <AppView key={key} style={[$.mb_regular, $.border_bottom, $.pb_small]}>
                <AppText style={[$.text_tint_2, $.fw_medium, $.mb_small]}>
                  {formatLabel(key)}
                </AppText>

                <AppView style={[$.flex_row, $.justify_content_center]}>
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <AppText style={[$.mr_small]}>View</AppText>
                    <AppSwitch
                      value={userPermissions[key].view}
                      onValueChange={(value) => handlePermissionChange(key, 'view', value)}
                      
                    />
                  </AppView>

                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <AppText style={[$.mr_small]}>Manage</AppText>
                    <AppSwitch
                      value={userPermissions[key].manage}
                      onValueChange={(value) => handlePermissionChange(key, 'manage', value)}
                      
                    />
                  </AppView>
                </AppView>
              </AppView>
            ))}
          </ScrollView> */}

          {/* Action Buttons */}
          <AppView style={[$.flex_row, $.justify_content_center]}>
            <AppButton
              name="Cancel"
              style={[$.bg_danger, $.flex_1, $.mr_small]}
              textStyle={[$.text_tint_11]}
              onPress={() => navigation.goBack()}
              
            />
            <AppButton
              name={isEditMode ? "Update" : "Save"}
              style={[$.bg_success, $.flex_1]}
              textStyle={[$.text_tint_11]}
              onPress={handleSaveStaff}
              
            />
          </AppView>
        </AppView>
      )}
    </AppView>
  );
}