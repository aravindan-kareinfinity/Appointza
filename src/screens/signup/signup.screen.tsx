import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {AppButton} from '../../components/appbutton.component';
import {AppTextInput} from '../../components/apptextinput.component';
import {UsersRegisterReq} from '../../models/users.model';
import {
  Alert,
  Image,
  ScrollView,
  Touchable,
  TouchableOpacity,
} from 'react-native';

import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FilesService} from '../../services/files.service';
import {imagepickerutil} from '../../utils/imagepicker.util';
import {UsersService} from '../../services/users.service';
import {AppAlert} from '../../components/appalert.component';
import {OrganisationTypes} from '../../models/organisation.model';
import {addListener} from '@reduxjs/toolkit';

type SignUpScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList>,
  NativeStackScreenProps<AppStackParamList, 'SignUp'>
>;
export function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenProp['navigation']>();
  const route = useRoute<SignUpScreenProp['route']>();
  const [isloading, setIsloading] = useState(false);
  const [signUpModel, setSignUpModel] = useState(new UsersRegisterReq());
  const fileservice = useMemo(() => new FilesService(), []);

  const pickAndUploadImage = async () => {
    let imagelist = await imagepickerutil.launchImageLibrary();
    let filelist = await fileservice.upload(imagelist);
    setSignUpModel({
      ...signUpModel,
      organisationimageid: filelist[0],
    });
  };

  const signUp = async () => {
    setIsloading(true);
    try {
      let usersservice = new UsersService();
      let registerresp = await usersservice.register({
        ...signUpModel,

        organisationtype: OrganisationTypes.Supplier,
      });
      AppAlert({message: 'Registered'});
      navigation.navigate('Login');
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
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

        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Organisation Name"
          value={signUpModel.organisationname}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              organisationname: e,
            });
          }}
        />
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
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Location"
          value={signUpModel.locationname}
          onChangeText={e => {
            setSignUpModel({
              ...signUpModel,
              locationname: e,
            });
          }}
        />
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
