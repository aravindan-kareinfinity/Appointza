import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {FormInput} from '../../components/forminput.component';
import {FormSelect} from '../../components/formselect.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, TouchableOpacity, ViewStyle, SafeAreaView} from 'react-native';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {BottomSheetComponent} from '../../components/bottomsheet.component';
import {AppMultiSelect} from '../../components/appmultiselect.component';
import {AppAlert} from '../../components/appalert.component';
import {OrganisationServicesService} from '../../services/organisationservices.service';
import {
  comboids,
  OrganisationServices,
  OrganisationServicesSelectReq,
} from '../../models/organisationservices.model';
import {AppButton} from '../../components/appbutton.component';
import { Button } from '../../components/button.component';
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';
import { Plus } from 'lucide-react-native';

type ServiceAvailableScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'ServiceAvailable'>,
  BottomTabScreenProps<HomeTabParamList>
>;

type ServiceAvailableRouteParams = {
  fromSignup?: boolean;
  fromOTPVerification?: boolean;
};

export function ServiceAvailableScreen() {
  const navigation = useNavigation<ServiceAvailableScreenProp['navigation']>();
  const route = useRoute<RouteProp<{ params: ServiceAvailableRouteParams }, 'params'>>();
  const [isloading, setIsloading] = useState(false);
  const usercontext = useAppSelector(selectusercontext);
  const servicesAvailableservice = useMemo(
    () => new OrganisationServicesService(),
    [],
  );
  const bottomSheetRef = useRef<any>(null);

  // Check if coming from signup or OTP verification
  const isFromSignup = route.params?.fromSignup === true;
  const isFromOTPVerification = route.params?.fromOTPVerification === true;

  // State management
  const [service, setService] = useState<OrganisationServices>(
    new OrganisationServices(),
  );
  const [serviceList, setServiceList] = useState<OrganisationServices[]>([]);
  const [selectedComboServices, setSelectedComboServices] = useState<
    OrganisationServices[]
  >([]);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, []),
  );

  const fetchServices = async () => {
    setIsloading(true);
    try {
      const req = new OrganisationServicesSelectReq();
      req.organisationid = usercontext.value.organisationid;
      const res = await servicesAvailableservice.select(req);
      setServiceList(res || []);
    } catch (error: any) {
      handleError(error, 'Failed to fetch services');
    } finally {
      setIsloading(false);
    }
  };

  const handleError = (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message || defaultMessage;
    AppAlert({message});
  };

  const openServiceForm = (
    item?: OrganisationServices,
    isCombo: boolean = false,
  ) => {
    const newService = item ? {...item} : new OrganisationServices();

    if (isCombo) {
      newService.Iscombo = true;
      newService.servicesids.combolist = [];
    }

    setService(newService);
    setSelectedComboServices(
      isCombo && item
        ? serviceList.filter(s =>
            item.servicesids.combolist?.some(c => c.id === s.id),
          )
        : [],
    );

    bottomSheetRef.current?.open();
  };

  const handleSaveService = async () => {
    if (!validateService()) return;

    setIsloading(true);
    try {
      const serviceToSave = prepareServiceForSave();
      await servicesAvailableservice.save(serviceToSave);
      await fetchServices();
      bottomSheetRef.current?.close();
    } catch (error: any) {
      handleError(error, 'Failed to save service');
    } finally {
      setIsloading(false);
    }
  };

  const validateService = (): boolean => {
    if (!service.Servicename.trim()) {
      AppAlert({message: 'Please enter a service name'});
      return false;
    }

    if (service.Iscombo && selectedComboServices.length < 2) {
      AppAlert({message: 'A combo must include at least 2 services'});
      return false;
    }

    if (service.prize <= 0) {
      AppAlert({message: 'Price must be greater than 0'});
      return false;
    }

    return true;
  };

  const prepareServiceForSave = (): OrganisationServices => {
    const serviceToSave = {...service};
    serviceToSave.organisationid = usercontext.value.organisationid;

    if (serviceToSave.Iscombo) {
      // Calculate combo price as sum of selected services
      const totalPrice = selectedComboServices.reduce(
        (sum, s) => sum + s.prize,
        0,
      );
      serviceToSave.prize = totalPrice;

      // Set default offer price if not provided
      if (!serviceToSave.offerprize || serviceToSave.offerprize <= 0) {
        serviceToSave.offerprize = totalPrice;
      }

      // Update combo list
      serviceToSave.servicesids.combolist = selectedComboServices.map(s => ({
        id: s.id,
        servicename: s.Servicename,
      }));
    }

    return serviceToSave;
  };

  const handleComboSelection = (items: OrganisationServices[]) => {
    setSelectedComboServices(items);

    // Calculate total price for the combo
    const totalPrice = items.reduce((sum, item) => sum + item.prize, 0);
    setService(prev => ({
      ...prev,
      prize: totalPrice,
      offerprize: totalPrice, // Set offer price same as total by default
    }));
  };

  const renderServiceItem = ({item}: {item: OrganisationServices}) => (
    <AppView
      style={[
        $.mx_normal,
        $.mb_small,
        $.elevation_4,
        $.border_rounded,
        $.p_tiny,
        $.flex_row,
      ]}>
      <TouchableOpacity
        onPress={() => openServiceForm(item, item.Iscombo)}
        style={[$.p_small, $.flex_1]}>
        <AppText
          style={[
            $.flex_1,
            $.text_primary5,
            $.fs_compact,
            $.fw_bold,
            $.my_compact,
          ]}>
          {item.Servicename}
          {item.Iscombo && ' (Combo)'}
        </AppText>
        {item.notes && (
          <AppText style={[$.fs_small, $.text_tint_ash, $.mt_tiny, $.my_small]}>
            {item.notes}
          </AppText>
        )}
        <AppView style={[$.flex_row, $.flex_1, $.border_top, $.border_tint_4]}>
          <AppView style={[$.flex_column, $.flex_1, $.my_small]}>
            <AppText>Duration</AppText>
            <AppText style={[$.fs_small, $.text_tint_3]}>
              {item.timetaken} min
            </AppText>
          </AppView>
          <AppView style={[$.flex_column, $.flex_1, $.my_small]}>
          <AppText>Price</AppText>
            <AppText style={[$.fs_small, $.flex_1]}>
              <AppText
                style={[
                  $.flex_1,$.text_tint_3,
                  {textDecorationLine: 'line-through'},
                ]}>
                ₹{item.prize}
              </AppText>
              <AppText style={[$.text_success]}> ₹{item.offerprize}</AppText>
            </AppText>
          </AppView>
        </AppView>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteService(item)}>
        <CustomIcon
          name={CustomIcons.Delete}
          color={$.tint_2}
          size={$.s_compact}
        />
      </TouchableOpacity>
    </AppView>
  );

  const handleDeleteService = async (item: OrganisationServices) => {
    try {
      // Implement your delete logic here
      // await servicesAvailableservice.delete(item.id);
      // fetchServices();
      AppAlert({message: 'Delete functionality to be implemented'});
    } catch (error: any) {
      handleError(error, 'Failed to delete service');
    }
  };

  const inputContainerStyle: ViewStyle = {
    marginBottom: 16,
  };

  const serviceTypeOptions = [
    {id: 0, name: 'Individual Service'},
    {id: 1, name: 'Combo Service'},
  ];

  const handleServiceTypeSelect = (option: {
    id: number;
    name: string;
    code?: string;
  }) => {
    const isCombo = option.id === 1;
    setService(prev => ({
      ...prev,
      Iscombo: isCombo,
      servicesids: isCombo ? {combolist: []} : prev.servicesids,
    }));
  };

  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppView style={[ $.flex_1]}>
      <CustomHeader
        title="Service Management"
        showBackButton
        backgroundColor={Colors.light.background}
        titleColor={Colors.light.text}
      
      />

    

      {/* Services List */}
      <FlatList
        data={serviceList}
        renderItem={renderServiceItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <AppView style={[$.p_medium, $.align_items_center]}>
            <AppText style={[$.text_tint_3, $.fw_medium]}>
              No services available. Add your first service!
            </AppText>

            <Button title={'Add Service'} onPress={() => openServiceForm(undefined, false)}/>
          </AppView>
        }
      />

      <AppView style={[$.mx_normal,$.mb_normal,$.flex_row]}>
        {serviceList.length >= 2 && (
          <Button 
            title={'Combo'} 
            variant='save' 
            style={[$.flex_1,$.mr_small]}  
            onPress={() => openServiceForm(undefined, true)}
          />
        )}
        <Button 
          title={'New Service'} 
          style={[$.flex_1]} 
          variant='secondary' 
          onPress={() => openServiceForm(undefined, false)}
        />
      </AppView>

      {(isFromSignup || isFromOTPVerification) && (
        <Button 
          title={'Save'} 
          variant='secondary' 
          style={[$.mx_normal,$.mb_normal]} 
          onPress={() => {
            navigation.navigate('Timing', { fromService: true }); 
          }}
        />
      )}
     

      {/* Bottom Sheet for Service/Combo Form */}
      <BottomSheetComponent
        ref={bottomSheetRef}
        screenname={service.Iscombo ? 'Combo Details' : 'Service Details'}
        Save={handleSaveService}
        close={() => bottomSheetRef.current?.close()}>
      

        {service.Iscombo && (
          <AppMultiSelect
            data={serviceList.filter(s => !s.Iscombo)}
            keyExtractor={item => item.id.toString()}
            searchKeyExtractor={item => item.Servicename}
            required={true}
            renderItemLabel={item => (
              <AppView style={[$.flex_row, $.mr_compact, $.align_items_center]}>
                <AppText
                  style={[
                    $.ml_compact,
                    $.fs_compact,
                    $.fw_semibold,
                    $.text_primary5,
                  ]}>
                  {item.Servicename} (₹{item.prize})
                </AppText>
              </AppView>
            )}
            selecteditemlist={selectedComboServices}
            onSelect={handleComboSelection}
            title="Select Services for Combo"
          />
        )}

        <FormInput
          label={service.Iscombo ? 'Combo Name' : 'Service Name'}
          value={service.Servicename}
          onChangeText={text => setService({...service, Servicename: text})}
          placeholder={
            service.Iscombo ? 'Enter combo name' : 'Enter service name'
          }
          containerStyle={inputContainerStyle}
        />

        {!service.Iscombo && (
          <FormInput
            label="Price"
            value={service.prize.toString()}
            onChangeText={text =>
              setService({
                ...service,
                prize: parseInt(text) || 0,
              })
            }
            placeholder="Enter price in ₹"
            keyboardType="numeric"
            containerStyle={inputContainerStyle}
          />
        )}

        <FormInput
          label="Offer Price"
          value={service.offerprize.toString()}
          onChangeText={text =>
            setService({
              ...service,
              offerprize: parseInt(text) || 0,
            })
          }
          placeholder="Enter offer price in ₹"
          keyboardType="numeric"
          containerStyle={inputContainerStyle}
        />

        <FormInput
          label="Duration"
          value={service.timetaken.toString()}
          onChangeText={text =>
            setService({
              ...service,
              timetaken: parseInt(text) || 0,
            })
          }
          placeholder="Enter duration in minutes"
          keyboardType="numeric"
          containerStyle={inputContainerStyle}
        />

        <FormInput
          label="Notes"
          value={service.notes || ''}
          onChangeText={text => setService({...service, notes: text})}
          placeholder="Enter any additional notes about the service"
          multiline={true}
          numberOfLines={3}
          containerStyle={inputContainerStyle}
        />
      </BottomSheetComponent>
    </AppView>
    </SafeAreaView>
  );
}
