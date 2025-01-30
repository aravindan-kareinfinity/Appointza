import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { $ } from '../../styles';
import { AppButton } from '../../components/appbutton.component';
import { AppTextInput } from '../../components/apptextinput.component';
import { UsersRegisterReq } from '../../models/users.model';
import {
  Alert,
  Image,
  ScrollView,
  Touchable,
  TouchableOpacity,
} from 'react-native';

import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { FilesService } from '../../services/files.service';
import { imagepickerutil } from '../../utils/imagepicker.util';
import { UsersService } from '../../services/users.service';
import { AppAlert } from '../../components/appalert.component';
import { addListener } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext, usercontextactions } from '../../redux/usercontext.redux';
import { ReferenceTypeService } from '../../services/referencetype.service';
import { ReferenceType, ReferenceTypeSelectReq } from '../../models/referencetype.model';
import { AppSingleSelect } from '../../components/appsingleselect.component';
import { ReferenceValueService } from '../../services/referencevalue.service';
import { ReferenceValue, ReferenceValueSelectReq } from '../../models/referencevalue.model';
import { Organization } from '../../models/organization.model';

// type SignUpScreenProp = CompositeScreenProps<
//   BottomTabScreenProps<HomeTabParamList>,
//   NativeStackScreenProps<AppStackParamList, 'SignUp'>
// >;

type SignUpScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'SignUp'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function SignUpScreen(props: SignUpScreenProp) {
  const navigation = useNavigation<SignUpScreenProp['navigation']>();
  const referencetypeservice = useMemo(() => new ReferenceTypeService(), [],);
  const referencevalueservice = useMemo(() => new ReferenceValueService(), [],);
  const dispatch = useAppDispatch();
  const route = useRoute<SignUpScreenProp['route']>();
  const [isloading, setIsloading] = useState(false);
  const [signUpModel, setSignUpModel] = useState(new UsersRegisterReq());
  const fileservice = useMemo(() => new FilesService(), []);
  const usercontext = useAppSelector(selectusercontext);
  const [IsOrganizer, SetIsOrganizer] = useState(false);
  const [PrimaryBussinessType, SetPrimaryBussinessType] = useState<ReferenceType[]>([])
  const [PrimaryBussinessId, SetPrimaryBussinesId] = useState(0)

  const [SecondaryBussinessType, SetSecondaryBussinessType] = useState<ReferenceValue[]>([])
  const [SecondaryBussinessId, SetSecondaryBussinesId] = useState(0)

  
  const pickAndUploadImage = async () => {
    let imagelist = await imagepickerutil.launchImageLibrary();
    let filelist = await fileservice.upload(imagelist);
    setSignUpModel({
      ...signUpModel,
      organisationimageid: filelist[0],
    });
  };


  useFocusEffect(
    useCallback(() => {
      const { isorganization } = props.route.params;
      SetIsOrganizer(props.route.params.isorganization);
      getrefererencetype()
    }, [props.route.params.isorganization])
  );


  const signUp = async () => {
    setIsloading(true);
    try {
      console.log("logg",signUpModel);
      
      let usersservice = new UsersService();
      let registerresp = await usersservice.register({
        ...signUpModel
      });
      dispatch(usercontextactions.set(registerresp!));
      AppAlert({ message: 'Registered' });
      navigation.navigate('ServiceAvailable');
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  };

  const getrefererencetype = async () => {
    try {
      var req = new ReferenceTypeSelectReq()
      var response = await referencetypeservice.select(req);
      if (response) {

        SetPrimaryBussinessType(response)
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  }

  const getrefererencevalue = async (id: number) => {
    try {
      var req = new ReferenceValueSelectReq();
      req.parentid = id;
      var response = await referencevalueservice.select(req);
      if (response) {
        SetSecondaryBussinessType(response)
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  }


  return (
    <ScrollView>
      <AppView style={[$.pt_medium, $.px_normal]}>
        <AppView style={[$.align_items_center, $.mb_medium]}>
          <AppText style={[$.fs_enormous, $.fw_bold, $.align_items_center]}>
            SignUp
          </AppText>
        </AppView>

        <TouchableOpacity
          onPress={pickAndUploadImage}
          style={[$.mb_normal, $.bg_tint_10]}>
          {signUpModel.organisationimageid == 0 ? (
            <AppView style={[$.p_compact, $.flex_row, $.align_items_center]}>
              <CustomIcon name={CustomIcons.Image} color={$.tint_4} size={40} />
              <AppText style={[$.ml_normal]}>Choose Image</AppText>
            </AppView>
          ) : (
            <AppView style={[$.p_compact, $.flex_row, $.align_items_center]}>
              <Image
                source={{
                  uri: fileservice.get(signUpModel.organisationimageid),
                  width: 100,
                  height: 100,
                }}
              />
              <AppText style={[$.ml_normal]}>Change Image</AppText>
            </AppView>
          )}
        </TouchableOpacity>

        <AppSingleSelect
          data={PrimaryBussinessType}
          keyExtractor={e => e.id.toString()}
          searchKeyExtractor={e => e.displaytext}
          renderItemLabel={item => {
            return <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>{item.displaytext}</AppText>;
          }}
          selecteditemid={PrimaryBussinessId.toString()}
          onSelect={item => {
       
            setSignUpModel(prevState => ({
              ...prevState, // Ensure you preserve the existing state
              primarytypecode:item.identifier,
              PrimaryBussinessType: item.id     // Update the property `d` with the value from `item.d`
            }));   
            getrefererencevalue(item.id);
            SetPrimaryBussinesId(item.id)
          }}
          title="Bussines Type"
          style={[$.mb_normal]}
        />

        <AppSingleSelect
          data={SecondaryBussinessType}
          keyExtractor={e => e.id.toString()}
          searchKeyExtractor={e => e.displaytext}
          renderItemLabel={item => {
            return <AppText style={[$.fs_compact, $.fw_semibold, $.text_tint_1]}>{item.displaytext}</AppText>;
          }}
          selecteditemid={SecondaryBussinessId.toString()}
          onSelect={item => {
            setSignUpModel(prevState => ({
              ...prevState, // Ensure you preserve the existing state
              secondarytype: item.id ,
              secondarytypecode:item.identifier
            }));
            SetSecondaryBussinesId(item.id)
          }}
          title="Bussines Type more detail"
          style={[$.mb_normal]}
        />
        
        {IsOrganizer && <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Organisation Name"
          value={signUpModel.organisationname}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              organisationname: e,
            });
          }}
        />}
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Name"
          value={signUpModel.username}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              username: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="GST no"
          value={signUpModel.organisationgstnumber}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              organisationgstnumber: e,
            });
          }}
        />
        {IsOrganizer && <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Location"
          value={signUpModel.locationname}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationname: e,
            });
          }}
        />}
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Address Line 1"
          value={signUpModel.locationaddressline1}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationaddressline1: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Address Line 2"
          value={signUpModel.locationaddressline2}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationaddressline2: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="City"
          value={signUpModel.locationcity}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationcity: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="State"
          value={signUpModel.locationstate}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationstate: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Country"
          value={signUpModel.locationcountry}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationcountry: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Pincode"
          value={signUpModel.locationpincode}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationpincode: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Mobile number"
          value={signUpModel.usermobile}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              usermobile: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_regular, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Designation"
          value={signUpModel.userdesignation}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              userdesignation: e,
            });
          }}
        />
        <AppButton
          name="Sign Up"
          style={[$.bg_tint_10, $.mb_medium]}
          textstyle={[$.fs_compact, $.fw_medium, $.text_tint_1]}
          onPress={signUp}
        />
      </AppView>
    </ScrollView>
  );
}
