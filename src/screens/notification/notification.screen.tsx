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
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {FlatList, Image, TouchableOpacity} from 'react-native';
import {UsersService} from '../../services/users.service';
import {AppAlert} from '../../components/appalert.component';
import {
  UsersAcceptConnectionRequestReq,
  UsersConnectionRequestReq,
  UsersSupplierInviteScreenReq,
  UsersSupplierInviteScreenRes,
} from '../../models/users.model';
import {FilesService} from '../../services/files.service';
import {createDelayedMethod} from '../../utils/delaymethod.util';
import {
  Notification,
  NotificationNotificationScreenReq,
  NotificationTypes,
} from '../../models/notification.model';
import {NotificationService} from '../../services/notification.service';
import {AppButton} from '../../components/appbutton.component';
import React from 'react';

type NotificationScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList>,
  NativeStackScreenProps<AppStackParamList>
>;
export function NotificationScreen() {
  const navigation = useNavigation<NotificationScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [searchstring, setSearchstring] = useState('');
  const [data, setData] = useState<Notification[]>([]);
  const notificationservice = useMemo(() => new NotificationService(), []);
  const userservice = useMemo(() => new UsersService(), []);
  const fileservice = useMemo(() => new FilesService(), []);

  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    setIsloading(true);
    try {
      let req = new NotificationNotificationScreenReq();
      let resp = await notificationservice.notificationscreen(req);
      setData(resp);
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
  const onAcceptonnectionrequest = async (notificationid: number) => {
    setIsloading(true);
    try {
      let req = new UsersAcceptConnectionRequestReq();
      req.notificationid = notificationid;
      let resp = await userservice.acceptconnectionrequest(req);
      AppAlert({message: 'Connection request accepted'});
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
  return (
    <AppView style={[$.pt_medium, $.flex_1]}>
      <AppView style={[$.px_normal, $.mb_normal, $.flex_row]}>
        <TouchableOpacity
          style={[$.justify_content_center, $.pr_normal]}
          onPress={() => navigation.goBack()}>
          <CustomIcon
            color={$.tint_2}
            name={CustomIcons.LeftArrow}
            size={$.s_regular}
          />
        </TouchableOpacity>
        <AppText style={[$.fs_compact, $.fw_regular, $.text_tint_2]}>
          Notifications
        </AppText>
      </AppView>
      <FlatList
        style={[$.flex_1]}
        data={data}
        renderItem={({item}) => {
          switch (item.type) {
            case NotificationTypes.ConnectionRequest:
              let notificationdata = item.attributes.connectionrequestdata;
              return (
                <AppView style={[$.flex_row, $.p_compact]}>
                  <Image
                    style={{borderRadius: 20}}
                    source={{
                      height: 40,
                      width: 40,
                      uri: fileservice.get(
                        notificationdata.organisationimageid,
                      ),
                    }}></Image>
                  <AppView
                    style={[
                      $.flex_row,
                      $.flex_wrap_wrap,
                      $.ml_normal,
                      $.flex_1,
                    ]}>
                    <AppText style={[$.mb_compact]}>
                      <AppText style={[$.fw_semibold, $.mr_compact]}>
                        {notificationdata.organisationname}
                      </AppText>
                      {' requested to follow you'}
                    </AppText>
                    {item.issuspended == false ? (
                      <>
                        <AppButton
                          onPress={() => onAcceptonnectionrequest(item.id)}
                          name="Accept"
                          textstyle={[$.text_tint_11]}
                          style={[
                            $.py_extrasmall,
                            $.bg_success,
                            $.mr_compact,
                          ]}></AppButton>
                        <AppButton
                          name="Dismiss"
                          textstyle={[$.text_tint_11]}
                          style={[$.py_extrasmall, $.bg_danger]}></AppButton>
                      </>
                    ) : notificationdata.isaccepted ? (
                      <AppText style={[$.fw_semibold, $.mr_compact]}>
                        Accepted
                      </AppText>
                    ) : (
                      <AppText style={[$.fw_semibold, $.mr_compact]}>
                        Dismissed
                      </AppText>
                    )}
                  </AppView>
                </AppView>
              );

            default:
              return <AppView></AppView>;
          }
        }}
      />
    </AppView>
  );
}
