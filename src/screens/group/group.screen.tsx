import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import React, {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {FlatList, Image, TouchableOpacity} from 'react-native';

import {FilesService} from '../../services/files.service';
import {AppAlert} from '../../components/appalert.component';
import {dateutil} from '../../utils/date.util';

type GroupScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Group'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function GroupScreen() {
  const navigation = useNavigation<GroupScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [issuspended, setIssuspended] = useState(false);

  const fileservice = useMemo(() => new FilesService(), []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getData(issuspended);
    });
    return unsubscribe;
  }, [navigation]);
  useEffect(() => {
    getData(issuspended);
  }, []);
  const getData = async (issuspended: boolean) => {
    setIsloading(true);
    try {
     
      setIssuspended(issuspended);
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({message: message});
    } finally {
      setIsloading(false);
    }
  };

  return (
    <AppView style={[$.pt_medium, $.flex_1]}>
      <AppView style={[$.flex_row, $.px_normal, $.align_items_center]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.text_tint_9, $.flex_1]}>
         Dashboard
        </AppText>
        <AppSwitch
          onValueChange={() => getData(!issuspended)}
          value={!issuspended}
        />
      </AppView>
    
    </AppView>
  );
}
