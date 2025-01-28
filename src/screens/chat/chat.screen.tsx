import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabNavigation, HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {$} from '../../styles';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {AppText} from '../../components/apptext.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {useEffect, useRef, useState} from 'react';
import {AppTextInput} from '../../components/apptextinput.component';

type ChatScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Chat'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function ChatScreen() {
  const navigation = useNavigation<ChatScreenProp['navigation']>();
  const route = useRoute<ChatScreenProp['route']>();
  const [searchInput, setSearchInput] = useState('');
  const [inviteModel, setInviteModel] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: inviteModel ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [inviteModel]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <ScrollView contentContainerStyle={[$.flex_1]}>
      <AppView
        style={[$.pt_medium, $.px_normal, $.flex_row, $.align_items_center]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.text_tint_9, $.flex_1]}>
          Chat
        </AppText>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Notification');
          }}>
          <CustomIcon
            name={CustomIcons.Bell}
            size={40}
            color={$.tint_9}></CustomIcon>
        </TouchableOpacity>
      </AppView>

      <AppTextInput
        icon={CustomIcons.Search}
        style={[
          $.bg_tint_11,
          $.border_bottom,
          $.border_tint_10,
          $.px_normal,
          $.mb_medium,
        ]}
        placeholder="Search"
        value={searchInput}
        onChangeText={text => setSearchInput(text)}
      />

      <AppView style={[$.px_compact, $.mb_medium, $.flex_row]}>
        <Image
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/6a0c/909b/18380950b808de73dd14058a4aacdcfe?Expires=1736726400&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=DTzVU68uBiBnvaQolvyU~SBY68-F5t334evguH0eGNLnM92XG-f6oyMj2GMRmV4sj4SKF~AsHZXwWbroDTcDNuUd~Muzr2-g26OYCgAuXVmxd414Ox7uPQycc~Qo2TkKgthQnrAsu~iEgZIR2aPGY1S9220l6wqnrRfVdj~Qt-8cveQ09OjrnB2Fm83AXB8MRkmKwcHEmOrJ1-lGEJDu1KusX1A78CiD5wTCoXJNT0q76D2QZ5ntCVuPRcofLktJ66Bal9Jkn12rul53Ncnxwu50NzoNbfjoY6Gi7VDYi2aFwKUjyhE~3f22MDu00eJWw3e0-nVhC4uotk~GaAbzNw__',
            width: 50,
            height: 50,
          }}
          style={{borderRadius: 100}}></Image>
        <AppView style={[$.ml_compact, $.justify_content_center, $.flex_1]}>
          <AppView style={[$.flex_row]}>
            <AppText
              style={[$.fs_compact, $.fw_semibold, $.text_tint_2, $.flex_1]}>
              Route 16 men’s wear
            </AppText>
            <AppText style={[$.fs_tiny, $.fw_regular, $.text_tint_6]}>
              9.20 am
            </AppText>
          </AppView>

          <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
            shared designs
          </AppText>
        </AppView>
      </AppView>
      <AppView style={[$.px_compact, $.mb_medium, $.flex_row]}>
        <Image
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/2649/1210/dda0e2766b4db97d42b848d76bcb18d5?Expires=1736726400&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=qt40C~k6rul0RflV0nTKmbU1pSlnywbG2TdFxypCy2pC8s8pVw1tupqIHbrbBHR2yp2cGrQcignp~eVBgJvJ96OBE4x3BjW35MgeTrVLDdqGBAJL8riJTTbTOt02ufZ0LxBGUjlzc24MnKTt4aY~dz0U2MP8Ggv3u6X9ek2eokzaFMu7bhcd0XFZmNQ3P9D8Cdgc7HpBIj8EGJ3yvTD5UzZxRHmgLWAG5OgTEFXp2Fx3ONqSdIRVz4svUdecBDlQiRLIAA7TECz8nD1L7AAje58St4nH81LJlVLWvotJ9F0NzrgMaMbxsrGOtLqq9FwGJqnizQUgT8W8Z2E0YnCiCQ__',
            width: 50,
            height: 50,
          }}
          style={{borderRadius: 100}}></Image>
        <AppView style={[$.ml_compact, $.justify_content_center, $.flex_1]}>
          <AppView style={[$.flex_row]}>
            <AppText
              style={[$.fs_compact, $.fw_semibold, $.text_tint_2, $.flex_1]}>
              KPR fashions
            </AppText>
            <AppText style={[$.fs_tiny, $.fw_regular, $.text_tint_6]}>
              9.20 am
            </AppText>
          </AppView>

          <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
            shared designs
          </AppText>
        </AppView>
      </AppView>
      <AppView style={[$.px_compact, $.mb_medium, $.flex_row]}>
        <Image
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/5d18/4e92/08fbd056687ca35656cf5a67790d4e09?Expires=1736726400&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=ZSyqaHuETFKABDmlzdVEd6bgpVOwGBWXUw~qX1ZN~MKjSCCwywna5FGCHxhHClwbSJAO6OJ10tuENPWhLD7pVhmSETq1tuQsUmJ7VNPek5fQfYheYAmMNV9Urc7KzhrL7e1610nyjwfRow53cbzcJ8zZQOOG--JqBAayHnF7NGhOg2gGKcV0dO7QGDs3kKyyJwhL-NjQZJgxFA9uEMzK9y0qZHbBAXhdBWP4QYZWvjcmmFIZRH0~6RgTrj1K2Axm7YlnKqopWXGE0Pn68L9EUT5Ye2576F2Nd~-BjmeqvkElDh0o0RHSM3KQ0r9bahyWYv37XcOrq7GZa4IFkwWDRQ__',
            width: 50,
            height: 50,
          }}
          style={{borderRadius: 100}}></Image>
        <AppView style={[$.ml_compact, $.justify_content_center, $.flex_1]}>
          <AppView style={[$.flex_row]}>
            <AppText
              style={[$.fs_compact, $.fw_semibold, $.text_tint_2, $.flex_1]}>
              Dhanush Men's wear
            </AppText>
            <AppText style={[$.fs_tiny, $.fw_regular, $.text_tint_6]}>
              9.20 am
            </AppText>
          </AppView>

          <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
            shared designs
          </AppText>
        </AppView>
      </AppView>
      <AppView style={[$.px_compact, $.mb_medium, $.flex_row]}>
        <Image
          source={{
            uri: 'https://s3-alpha-sig.figma.com/img/8135/f3b6/6bedeb6f4bb221ff362a8e7330db19b0?Expires=1736726400&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=cyXPoW4zSTCUSHxrRSVFRs0x5rZ7K0e9FauGJcb2xjmCOtWUhSHEjnIYXw8GnMWAL0Y2Tq68kbHlrb~Ls5qDzbep4hcAcKbTsYB5FiieBRIOPD8Y4BszBpc8vB0hkVtBsoRR2WSS6R97Yd6oALW2wWQTayKLp9QLHZmXhPAv7pLSBaJUW8XyRja~~54NMIp2RK7lZblCMJU-2owIdbMt4y2w-r-ZtIOWlR5M1e1ydJR6057h94ttC-Kv0SeLT3xncRwKuICYT8PlXjtYsINYxKM3CicegZYz7rr4fCTK1E85xctzbdJn-Yvztbgt791xsCZk5oo9G82D8VODbuQXDw__',
            width: 50,
            height: 50,
          }}
          style={{borderRadius: 100}}></Image>
        <TouchableOpacity
          onPress={() => navigation.navigate('IndividualChat')}
          style={[$.ml_compact, $.justify_content_center, $.flex_1]}>
          <AppView style={[$.flex_row]}>
            <AppText
              style={[$.fs_compact, $.fw_semibold, $.text_tint_2, $.flex_1]}>
              Clash of clothings
            </AppText>
            <AppText style={[$.fs_tiny, $.fw_regular, $.text_tint_6]}>
              9.20 am
            </AppText>
          </AppView>

          <AppText style={[$.fs_extrasmall, $.fw_regular, $.text_tint_6]}>
            shared designs
          </AppText>
        </TouchableOpacity>
      </AppView>
      <AppView
        style={[
          {
            position: 'absolute',
            bottom: 20,
            right: 25,
          },
        ]}>
        <TouchableOpacity
          style={[{}]}
          onPress={() => {
            setInviteModel(true);
          }}>
          <Animated.View
            style={{
              transform: [{rotate: rotateInterpolate}],
            }}>
            <CustomIcon
              name={CustomIcons.Plus}
              color={$.tint_2}
              size={$.s_enormous}
            />
          </Animated.View>
        </TouchableOpacity>
      </AppView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModel}
        onRequestClose={() => {
          setInviteModel(false);
        }}>
        <TouchableOpacity
          style={[{width: '100%', height: '100%'}]}
          onPress={() => setInviteModel(!inviteModel)}
          activeOpacity={1}>
          <AppView
            style={[
              $.px_normal,
              $.flex_row,
              $.mb_medium,
              $.bg_tint_11,
              $.justify_content_center,
              {position: 'absolute', bottom: -10, width: $.width},
              // $.bg_success,
            ]}>
            <TouchableOpacity
              style={[
                $.flex_row,
                $.align_items_center,
                $.bg_tint_10,
                $.px_medium,
              ]}
              onPress={() => {
                navigation.navigate('InvitePeople');
                setInviteModel(false);
              }}>
              <CustomIcon
                name={CustomIcons.AddAccount}
                color={$.tint_2}
                size={$.s_normal}
              />

              <AppText
                style={[
                  $.fs_compact,
                  $.fw_regular,
                  $.text_tint_2,
                  $.ml_compact,
                ]}>
                Invite
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                $.flex_row,
                $.px_tiny,
                $.align_items_center,
                $.border,
                $.ml_big,
              ]}
              onPress={() => {
                navigation.navigate('Broadcast');
                setInviteModel(false);
              }}>
              <AppView style={[$.ml_regular]}>
                <CustomIcon
                  name={CustomIcons.AddAccount}
                  color={$.tint_2}
                  size={$.s_normal}
                />
              </AppView>
              <AppText
                style={[
                  $.fs_compact,
                  $.fw_regular,
                  $.text_tint_2,
                  $.p_compact,
                ]}>
                Broadcast
              </AppText>
            </TouchableOpacity>
          </AppView>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
