import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { $ } from '../../styles';
import { Alert, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '../../components/apptext.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { AppTextInput } from '../../components/apptextinput.component';
import { useCallback, useMemo, useState } from 'react';
import { AppButton } from '../../components/appbutton.component';
import { AppSwitch } from '../../components/appswitch.component';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { UsersContext, UsersLoginReq, UsersPermissionData } from '../../models/users.model';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { StaffService } from '../../services/staff.service';
import { OrganisationLocation, OrganisationLocationSelectReq } from '../../models/organisationlocation.model';
import { UsersService } from '../../services/users.service';
import { Staff } from '../../models/staff.model';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { environment } from '../../utils/environment';

type AddedAccountsDetailsScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'AddedAccountsDetails'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function AddedAccountsDetailsScreen() {
  const navigation =
    useNavigation<AddedAccountsDetailsScreenProp['navigation']>();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [canChat, setCanChat] = useState(false);
  const [canCreateAcc, setCreateAcc] = useState(false);
  const [canCreateDesign, setCreateDesign] = useState(false);
  const [canCreatePost, setCreatePost] = useState(false);
  const Cancle = () => { };
  const Save = () => { };
  const [Selectorganisationlocationid, Setselectorganisationlocationid] = useState(0)
  const [searchcontact, Setsearchcontact] = useState("")
  const usercontext = useAppSelector(selectusercontext);
  const [selecteduser, Serselecteduser] = useState(new UsersContext())
  const organisationlocationservice = useMemo(() => new OrganisationLocationService(), [],);
  const staffservice = useMemo(() => new StaffService(), [],);
  const [organisationlocation, setOrganisationlocation] = useState<
    OrganisationLocation[]
  >([]);
  const [userPermissions, setUserPermissions] = useState<UsersPermissionData>(new UsersPermissionData());
  const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };
  let usersservice = new UsersService();
  const search = async () => {
    var req = new UsersLoginReq()
    req.mobile = searchcontact;
    console.log("req", req);
    var res = await usersservice.SelectUser(req);
    if (res) {
      Serselecteduser(res)
    }

  }

  const getorganisation = async () => {
    var locreq: OrganisationLocationSelectReq = new OrganisationLocationSelectReq();
    locreq.organisationid = usercontext.value.organisationid
    let locresp = await organisationlocationservice.select(locreq);
    if (locresp) {
      setOrganisationlocation(locresp);
    } else {
      setOrganisationlocation([]); // Provide an empty array as a fallback
    }
  }


  const Addstaff = async () => {
    var req = new Staff()
    req.userid = selecteduser.userid;
    req.roles = userPermissions
    req.organisationid = usercontext.value.organisationid;
    req.organisationlocationid =  Selectorganisationlocationid;
    var res = await staffservice.save(req)
    if (res) {
      Alert.alert(environment.baseurl, "successfully created")
    }

  }

  useFocusEffect(
    useCallback(() => {
      getorganisation();
    }, [])
  );
  return (
    <AppView style={[$.flex_1, $.m_small]}>

      <AppView style={[$.flex_row]}>

        <AppTextInput
          style={[$.bg_tint_10, $.flex_1]}
          placeholder="Name"
          value={searchcontact}
          onChangeText={text => {
            Setsearchcontact(text)
          }}
        />

        <AppButton
          name="S"
          style={[$.bg_success,]}
          textstyle={[$.text_tint_11]}
          onPress={search}
        />
      </AppView>

      {selecteduser && selecteduser.userid > 0 &&

        <AppView style={[$.flex_1]}>
          <AppText>name     : {selecteduser.username}</AppText>
          <AppText>mobile   :{selecteduser.usermobile}</AppText>
          <AppText>location : {selecteduser.organisationlocationname}</AppText>

          <AppSingleSelect
            data={organisationlocation}
            keyExtractor={e => e.id.toString()}
            searchKeyExtractor={e => e.city}
            renderItemLabel={item => (
              <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>{item.city}</AppText>
            )}
            selecteditemid={Selectorganisationlocationid.toString()}
            onSelect={item => Setselectorganisationlocationid(item.id)}
            title="Bussines Type more detail"
            style={[$.mb_normal]}
          />

          <ScrollView style={[$.px_normal, $.flex_1]}>
            {Object.entries(userPermissions).map(([key, permission], index) => (
              <AppView key={index} style={[$.mb_regular, $.border_bottom, $.pb_small]}>
                <AppText style={[$.text_tint_2, $.fw_medium, $.mb_small]}>
                  {formatLabel(key)}
                </AppText>

                <AppView style={[$.flex_row, $.align_items_center]}>
                  {/* View Permission */}
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <AppText style={[$.mr_small]}>View</AppText>
                    <AppSwitch
                      value={permission.view}
                      onValueChange={toggle => {
                        setUserPermissions(prev => ({
                          ...prev,
                          [key as keyof UsersPermissionData]: {
                            ...prev[key as keyof UsersPermissionData],
                            view: toggle // ✅ Correctly updating 'view'
                          }
                        }));
                      }}
                    />
                  </AppView>

                  {/* Manage Permission */}
                  <AppView style={[$.flex_row, $.align_items_center]}>
                    <AppText style={[$.mr_small]}>Manage</AppText>
                    <AppSwitch
                      value={permission.manage}
                      onValueChange={toggle => {
                        setUserPermissions(prev => ({
                          ...prev,
                          [key as keyof UsersPermissionData]: {
                            ...prev[key as keyof UsersPermissionData],
                            manage: toggle // ✅ Correctly updating 'manage'
                          }
                        }));
                      }}
                    />
                  </AppView>
                </AppView>
              </AppView>
            ))}
          </ScrollView>


          <AppButton
            name="Save"
            style={[$.bg_success]}
            textstyle={[$.text_tint_11]}
            onPress={Addstaff}
          />
        </AppView>
      }




    </AppView>
  );
}
