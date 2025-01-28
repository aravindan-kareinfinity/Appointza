import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {$} from '../../styles';
import {TouchableOpacity} from 'react-native';
import {AppText} from '../../components/apptext.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppTextInput} from '../../components/apptextinput.component';
import {useState} from 'react';
import {AppButton} from '../../components/appbutton.component';
import {AppSwitch} from '../../components/appswitch.component';

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
  const Cancle = () => {};
  const Save = () => {};
  return (
    <AppView style={[$.flex_1]}>
      <AppView style={[$.pt_medium]}>
        <AppView
          style={[$.flex_row, $.align_items_center, $.px_normal, $.mb_medium]}>
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
            Profile
          </AppText>
        </AppView>
      </AppView>
      <AppView style={[$.px_normal]}>
        <AppView style={[$.mb_medium]}>
          <AppTextInput
            placeholder="Name"
            onChangeText={name => {
              setName(name);
            }}
            value={name}
          />
        </AppView>
        <AppView style={[$.mb_medium]}>
          <AppTextInput
            placeholder="Contact"
            onChangeText={contact => {
              setContact(contact);
            }}
            value={contact}
          />
        </AppView>
        <AppView style={[$.mb_medium]}>
          <AppTextInput
            placeholder="Role"
            onChangeText={role => {
              setRole(role);
            }}
            value={role}
          />
        </AppView>
        <AppView style={[$.mb_medium]}>
          <AppTextInput
            placeholder="Location"
            onChangeText={location => {
              setLocation(location);
            }}
            value={location}
          />
        </AppView>
      </AppView>
      <AppView style={[$.px_normal, $.flex_1]}>
        <AppView style={[$.flex_row, $.align_items_center, $.mb_regular]}>
          <AppText style={[$.text_tint_2, $.fw_medium, $.flex_1]}>Chat</AppText>
          <AppSwitch
            value={canChat}
            onValueChange={toggle => {
              setCanChat(toggle);
            }}></AppSwitch>
        </AppView>
        <AppView style={[$.flex_row, $.align_items_center, $.mb_regular]}>
          <AppText style={[$.text_tint_2, $.fw_medium, $.flex_1]}>
            Create Accounts
          </AppText>
          <AppSwitch
            value={canCreateAcc}
            onValueChange={toggle => {
              setCreateAcc(toggle);
            }}></AppSwitch>
        </AppView>
        <AppView style={[$.flex_row, $.align_items_center, $.mb_regular]}>
          <AppText style={[$.text_tint_2, $.fw_medium, $.flex_1]}>
            Create Designs
          </AppText>
          <AppSwitch
            value={canCreateDesign}
            onValueChange={toggle => {
              setCreateDesign(toggle);
            }}></AppSwitch>
        </AppView>
        <AppView style={[$.flex_row, $.align_items_center, $.mb_regular]}>
          <AppText style={[$.text_tint_2, $.fw_medium, $.flex_1]}>
            Create Post
          </AppText>
          <AppSwitch
            value={canCreatePost}
            onValueChange={toggle => {
              setCreatePost(toggle);
            }}></AppSwitch>
        </AppView>
      </AppView>
      <AppView
        style={[
          $.flex_row,
          $.justify_content_center,
          $.px_normal,
          $.mb_normal,
        ]}>
        <AppButton
          name="Cancel"
          style={[$.bg_tint_10, $.flex_1, $.mr_huge]}
          textstyle={[$.text_danger]}
          onPress={() => {
            Cancle();
          }}
        />
        <AppButton
          name="Save"
          style={[$.bg_success, $.flex_1]}
          textstyle={[$.text_tint_11]}
          onPress={() => {
            Save();
          }}
        />
      </AppView>
    </AppView>
  );
}
