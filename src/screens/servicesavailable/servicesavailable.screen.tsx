import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, navigate } from '../../appstack.navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { AppTextInput } from '../../components/apptextinput.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { BottomSheetComponent } from '../../components/bottomsheet.component';
import { ServicesService } from '../../services/services.service';
import { Services } from '../../models/services.model';
type ServiceAvailableScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'ServiceAvailable'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function ServiceAvailableScreen(props: ServiceAvailableScreenProp) {
  const navigation = useNavigation<ServiceAvailableScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const usercontext = useAppSelector(selectusercontext);
  const servicesservice = useMemo(
    () => new ServicesService(),
    [],
  );
  const [Service, SetService] = useState<Services>(new Services())
  const [ServiceList, SetServiceList] = useState<Services[]>([])
  useEffect(() => {
  }, []);
  const bottomSheetRef = useRef<any>(null); // Ref for BottomSheetComponent
  const save = () => {
    // Check if the service already exists (by Servicename or another unique identifier)
    const updatedList = ServiceList.map(item =>
      item.Servicename === Service.Servicename ? Service : item
    );

    // If the service is new (i.e., not in the list), add it to the list
    if (!updatedList.some(item => item.Servicename === Service.Servicename)) {
      updatedList.push(Service);
    }

    SetServiceList(updatedList);
    bottomSheetRef.current?.close();
  };
  const openBottomSheet = () => {
    bottomSheetRef.current?.open();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  }


  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      <AppView
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_medium]}>
        <AppView style={[$.flex_row, $.flex_1, $.align_items_center]}>
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
            Add Service
          </AppText>
        </AppView>
        <TouchableOpacity onPress={() => { bottomSheetRef.current?.open(); }}>
          <CustomIcon
            name={CustomIcons.AddSquareRounded}
            color={$.tint_2}
            size={$.s_huge}></CustomIcon>
        </TouchableOpacity>


      </AppView>

      {ServiceList.length > 1 && <TouchableOpacity>
        <AppText style={[$.text_tint_3, $.p_small, $.py_normal, $.border, $.align_items_center, $.border_rounded, $.mx_normal, $.mb_small]}>Create Combo</AppText>
      </TouchableOpacity>}


      <FlatList
        data={ServiceList}
        style={[]}
        renderItem={({ item }) => {
          return (
            <AppView
              style={[$.mx_normal, $.mb_small, $.border, $.border_rounded, $.bg_tint_10]}
            >
              <AppView>
                <AppText style={[$.p_small, $.text_tint_1, $.fs_compact, $.fw_bold]}>{item.Servicename}</AppText>
                <TouchableOpacity>
                  <CustomIcon
                    name={CustomIcons.AddSquareRounded}
                    color={$.tint_2}
                    size={$.s_huge}></CustomIcon>
                </TouchableOpacity>
              </AppView>
              <TouchableOpacity onPress={() => {
                SetService(item); openBottomSheet();
              }}>

                <AppText style={[$.p_small]}> Offer Price : {item.offerprize}</AppText>
                <AppText style={[$.p_small]}> Original Price : {item.prize}</AppText>
                <AppText style={[$.p_small]}> Time taken in minitues {item.timetaken}</AppText>
              </TouchableOpacity>
            </AppView>
          );
        }}
      />


      <BottomSheetComponent ref={bottomSheetRef} screenname='New Service' Save={save} close={closeBottomSheet}>
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Service Name"
          value={Service.Servicename}
          onChangeText={e => {
            SetService({
              ...Service,
              Servicename: e,
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="prize"
          value={Service.prize.toString()}
          onChangeText={e => {
            SetService({
              ...Service,
              prize: parseInt(e),
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Offer price"
          value={Service.offerprize.toString()}
          onChangeText={e => {
            SetService({
              ...Service,
              offerprize: parseInt(e),
            });
          }}
        />
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder="Time taken in minutes"
          value={Service.timetaken.toString()}
          onChangeText={e => {
            SetService({
              ...Service,
              timetaken: parseInt(e),
            });
          }}
        />
      </BottomSheetComponent>








    </AppView>
  );
}
