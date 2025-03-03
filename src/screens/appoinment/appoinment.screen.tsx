import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { FlatList, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { FilesService } from '../../services/files.service';

import { AppAlert } from '../../components/appalert.component';
import React from 'react';
import { UsersAddColourSetToCartReq } from '../../models/users.model';
import { UsersService } from '../../services/users.service';
import { AppoinmentService } from '../../services/appoinment.service';
import { Appoinment, AppoinmentSelectReq } from '../../models/appoinment.model';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';

type AppoinmentScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList>,
  BottomTabScreenProps<HomeTabParamList, 'Appoinment'>
>;
export function AppoinmentScreen() {
  const navigation = useNavigation<AppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);

  const fileservice = useMemo(() => new FilesService(), []);
  const userservice = useMemo(() => new UsersService(), []);
  const usercontext = useAppSelector(selectusercontext);
  const appoinmentservices = useMemo(() => new AppoinmentService(), []);
  const [Apponmentlist, setAppoinmentList] = useState<
    Appoinment[]
  >([]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    getData();
  }, []);
  const getData = async () => {
    setIsloading(true);
    try {
      var req = new AppoinmentSelectReq();
      req.parentid = usercontext.value.organisationid;
      req.organizationid = usercontext.value.organisationlocationid;
      var res = await appoinmentservices.select(req)
      if (res) {
        setAppoinmentList(res)
      }

    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[$.flex_1]}>

      <AppView
        style={[
          $.pt_medium,
          $.px_normal,
          $.flex_row,
          $.align_items_center,
          $.mb_normal,
        ]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.text_tint_9, $.flex_1]}>
          Appoinment
        </AppText>
      </AppView>

      <FlatList
        data={Apponmentlist}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[$.mb_small, $.border, $.border_rounded, $.bg_tint_10, $.p_medium]}
            onPress={() => { }}
          >
            {/* Appointment Timing */}
            <AppView style={[$.flex_row, ]}>
              <AppText style={[$.fw_bold,]}>

                from {item.fromtime ? new Date(item.fromtime).toLocaleTimeString() : ''}
              </AppText>
              <AppText style={[$.fw_bold,]}>
                To:{item.totime ? new Date(item.totime).toLocaleTimeString() : ''}

              </AppText>
            </AppView>

            {/* Service List */}
            {item.attributes?.servicelist?.length > 0 && (
              <AppView style={[$.mt_small]}>
                <AppText style={[$.fw_medium, $.fs_small]}>Services:</AppText>

                {item.attributes.servicelist.map((service, index) => {
                  return (
                    <AppView key={index} style={[]}>
                      <AppText style={[$.fw_bold, $.fs_small]}>
                        {service.servicename} - {service.serviceprice}₹
                      </AppText>
                    </AppView>
                  );
                })}
              </AppView>
            )}

          </TouchableOpacity>
        )}
      />

    </ScrollView>
  );
}
