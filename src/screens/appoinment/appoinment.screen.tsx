import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, Image, ScrollView, TouchableOpacity} from 'react-native';
import {useEffect, useMemo, useState} from 'react';
import {FilesService} from '../../services/files.service';

import {AppAlert} from '../../components/appalert.component';
import React from 'react';
import {UsersAddColourSetToCartReq} from '../../models/users.model';
import {UsersService} from '../../services/users.service';

type AppoinmentScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList>,
  BottomTabScreenProps<HomeTabParamList, 'Appoinment'>
>;
export function AppoinmentScreen() {
  const navigation = useNavigation<AppoinmentScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
 
  const fileservice = useMemo(() => new FilesService(), []);
  const userservice = useMemo(() => new UsersService(), []);

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
   
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };
  const placeorder = async () => {
    setIsloading(true);
    try {
      var res = await userservice.placeorder();
      getData();
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[$.bg_tint_2, $.flex_1]}>
      <AppView style={[$.pt_normal]}>
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
      
      </AppView>
    </ScrollView>
  );
}
