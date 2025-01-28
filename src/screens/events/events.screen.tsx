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
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {counteractions, selectcounter} from '../../redux/counter.redux';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {FlatList, Image, ScrollView, TouchableOpacity} from 'react-native';
import {Line} from 'react-native-svg';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {FilesService} from '../../services/files.service';

type EventsScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Events'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function EventsScreen() {
  const navigation = useNavigation<EventsScreenProp['navigation']>();
  const [categoryid, setCategoryid] = useState(0);
  const [subcategoryid, setsubcategoryid] = useState(0);
  const [productid, setproductid] = useState(0);
  const [isloading, setIsloading] = useState(false);

  const filesservice = useMemo(() => new FilesService(), []);

  useEffect(() => {
  }, []);

  return (
    <ScrollView>
      <AppView style={[$.px_normal, $.flex_row, $.mb_medium, $.pt_medium]}>
        <AppText style={[$.fs_enormous, $.fw_bold, $.flex_1, $.text_tint_9]}>
         events
        </AppText>
    
</AppView>
    </ScrollView>
  );
}
