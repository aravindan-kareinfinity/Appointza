import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { FlatList, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

  useFocusEffect(
    useCallback(() => {
      getData();
    }, [])
  );
  const getData = async () => {
    setIsloading(true);
    try {
      var req = new AppoinmentSelectReq();
      if(usercontext.value.organisationid){

        req.organisationlocationid = usercontext.value.organisationlocationid;
        req.organisationid =usercontext.value.organisationid ;
      }else{
        req.userid = usercontext.value.userid
      }
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

  // const getlocation



  function convertToIST(utcTimestamp: string | number | Date) {
    const utcDate = new Date(utcTimestamp);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(utcDate.getTime() + istOffset);
    
    return istDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

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
          Appoinment {usercontext.value.organisationid} {usercontext.value.organisationlocationid}
          {usercontext.value.userid}
        </AppText>
      </AppView>

      <FlatList
        data={Apponmentlist}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
          style={[$.mx_small,$.mb_small,$.border, $.border_rounded, $.bg_tint_10, $.p_medium]}
          onPress={() => {}}
        >
          {/* Appointment Date */}
          <AppText style={[$.fw_bold, $.fs_medium, $.mb_small]}>
            {new Date(item.appoinmentdate).toLocaleDateString()}
          </AppText>
        
          {/* Appointment Timing */}
          <AppView style={[$.flex_row ,$.align_items_center, $.mb_small]}>
            <AppText style={[$.fw_bold, $.fs_small, $.text_tint_1]}>
              ⏰ From: {item.fromtime.toString()}
            </AppText>
            <AppText style={[$.fw_bold, $.fs_small, $.text_danger]}>
              ⏳ To: {item.totime.toString()}
            </AppText>
          </AppView>
        
          {/* Service List */}
          {item.attributes?.servicelist?.length > 0 && (
            <AppView style={[$.mt_small, $.p_small, $.bg_tint_9, $.border, $.border_rounded]}>
              <AppText style={[$.fw_medium, $.fs_small, $.mb_small]}>🔹 Services:</AppText>
              {item.attributes.servicelist.map((service, index) => (
                <AppView key={index} style={[$.flex_row]}>
                  <AppText style={[$.fw_bold, $.fs_small, $.text_tint_4]}>
                    {service.servicename}
                  </AppText>
                  <AppText style={[$.fw_bold, $.fs_small, $.text_success]}>
                    {service.serviceprice}₹
                  </AppText>
                </AppView>
              ))}
            </AppView>
          )}
        </TouchableOpacity>
        
        )}
      />

    </ScrollView>
  );
}
