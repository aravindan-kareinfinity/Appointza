import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import { CompositeScreenProps, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, navigate } from '../../appstack.navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { AppMultiSelect } from '../../components/appmultiselect.component';
import { AppAlert } from '../../components/appalert.component';
import { OrganisationServicesService } from '../../services/organisationservices.service';
import { comboids, OrganisationServices, OrganisationServicesSelectReq } from '../../models/organisationservices.model';
type ServiceAvailableScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'ServiceAvailable'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function ServiceAvailableScreen(props: ServiceAvailableScreenProp) {
  const navigation = useNavigation<ServiceAvailableScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const usercontext = useAppSelector(selectusercontext);
  const servicesAvailableservice = useMemo(() => new OrganisationServicesService(), []);
  const [Service, SetService] = useState<OrganisationServices>(new OrganisationServices())
  const [ServiceList, SetServiceList] = useState<OrganisationServices[]>([])
  const [ComboServiceList, SetCOmboServiceList] = useState<OrganisationServices[]>([])
  useFocusEffect(
    useCallback(() => {
      getdata(); // Fetch data when screen is focused
    }, [])
  );
  const bottomSheetRef = useRef<any>(null); // Ref for BottomSheetComponent

  const getdata = async () => {
    console.log("working");

    try {
      var req = new OrganisationServicesSelectReq();
      req.parentid = usercontext.value.organisationid
      var res = await servicesAvailableservice.select(req);
      if (res) {

        SetServiceList(res);
      }
    } catch (error: any) {
      var message = error?.response?.data?.message;
      AppAlert({ message: message });
    } finally {
      setIsloading(false);
    }
  }
  const save = async () => {
    try {
      console.log("Saving service...");
      const updatedList = ServiceList.map(item =>
        item.Servicename === Service.Servicename ? Service : item
      );

      // If the service is new, add it
      if (!updatedList.some(item => item.Servicename === Service.Servicename) || Service.id > 0) {
        var req = { ...Service, parentid: usercontext.value.organisationid };
        console.log("req",req);
        if(!req.Iscombo){
          req.servicesids.combolist =[ new comboids() ]    
        }
        console.log("rew",req);
        
        await servicesAvailableservice.save(req);
        console.log("Service saved!");
        getdata();
      }

      SetServiceList(updatedList);
      bottomSheetRef.current?.close();
    } catch (error: any) {
      console.log("Save error:", error);
      const message = error?.response?.data?.message || "Error saving service";
      AppAlert({ message });
    } finally {
      setIsloading(false);
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.open();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  }


  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
       <AppText
            style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
            Add Service  {usercontext.value.organisationid}
          </AppText>
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

      {ServiceList.length > 1 && <TouchableOpacity
        onPress={() => {
          SetService({
            ...Service,
            Iscombo: true,
          });
          bottomSheetRef.current?.open();
        }}>
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
              <AppView style={[$.flex_row]}>
                <AppText style={[$.p_small, $.flex_1, $.text_tint_1, $.fs_compact, $.fw_bold]}>{item.Servicename}</AppText>
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

        {Service.Iscombo && <AppMultiSelect
          data={ServiceList}
          keyExtractor={item => item.id.toString()}
          searchKeyExtractor={item => item.Servicename}
          required={true}

          renderItemLabel={item => {
            return (
              <AppView style={[$.flex_row, $.mr_compact, $.align_items_center]}>
                <AppText
                  style={[
                    $.ml_compact,
                    $.fs_compact,
                    $.fw_semibold,
                    $.text_tint_1,
                  ]}>
                  {item.Servicename}
                </AppText>
              </AppView>
            );
          }}
          selecteditemlist={ComboServiceList}
          onSelect={itemlist => {
            SetCOmboServiceList(itemlist);
            var list: comboids[] = [];
            var total = 0;
            ServiceList.map((v) => {
              var item: comboids = { id: 0, servicename: "" }; // Initialize object

              item.id = v.id;
              item.servicename = v.Servicename;
              total += v.prize; // Use += to accumulate total

              list.push(item);
            });

            SetService({
              ...Service,
              servicesids: {
                ...Service.servicesids, // Preserve existing values in `servicesids`
                combolist: list, // Update `combolist`
              },
              prize: total
            });
            

          }}
          title={'select combo'}
          style={[$.mb_normal]}
        />
        }
        <AppTextInput
          style={[$.mb_compact, $.bg_tint_11, $.border_bottom, $.border_tint_8]}
          placeholder={Service.Iscombo ? "Combo Name" : "Service Name"}
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
          readonly={Service.Iscombo}
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
