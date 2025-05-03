import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {FlatList, TouchableOpacity} from 'react-native';
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

type ServiceAvailableScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'ServiceAvailable'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function ServiceAvailableScreen() {
  const navigation = useNavigation<ServiceAvailableScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const usercontext = useAppSelector(selectusercontext);
  const servicesAvailableservice = useMemo(
    () => new OrganisationServicesService(),
    [],
  );
  const bottomSheetRef = useRef<any>(null);

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
        <AppText style={[$.flex_1, $.text_primary5, $.fs_compact, $.fw_bold]}>
          {item.Servicename}
          {item.Iscombo && ' (Combo)'}
        </AppText>
        <AppText style={[$.fs_small, $.text_tint_ash]}>
          {item.timetaken} min session
        </AppText>
        <AppText style={[$.fs_small, $.flex_1, $.text_tint_ash]}>
          <AppText
            style={[
              $.flex_1,
              {textDecorationLine: 'line-through', color: 'gray'},
            ]}>
            ₹{item.prize}
          </AppText>
          <AppText> ₹{item.offerprize}</AppText>
        </AppText>
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

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      {/* Header */}
      <AppView
        style={[$.px_normal, $.flex_row, $.align_items_center, $.mb_medium]}>
        <AppView style={[$.flex_row, $.flex_1, $.align_items_center]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <CustomIcon
              name={CustomIcons.LeftArrow}
              size={$.s_regular}
              color={$.tint_primary_5}
            />
          </TouchableOpacity>
          <AppText
            style={[$.ml_compact, $.p_small, $.text_primary5, $.fw_medium]}>
            Service Management
          </AppText>
        </AppView>

        {/* Add Service Button */}
        <TouchableOpacity onPress={() => openServiceForm(undefined, false)}>
          <CustomIcon
            name={CustomIcons.Plus}
            color={$.tint_primary_5}
            size={$.s_big}
          />
        </TouchableOpacity>
      </AppView>

      {/* Create Combo Button (only shown when there are services to combine) */}
      {serviceList.length >= 2 && (
        <TouchableOpacity
          onPress={() => openServiceForm(undefined, true)}
          style={[
            $.bg_tint_11,
            $.border_rounded,
            $.mx_normal,
            $.mb_small,
            $.p_small,
            $.align_items_center,
          ]}>
          <AppText style={[$.text_primary5, $.fw_semibold]}>
            Create New Combo
          </AppText>
        </TouchableOpacity>
      )}

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

            <TouchableOpacity
              style={[$.mt_medium, $.p_small, $.bg_tint_3, $.border_rounded]}
              onPress={()=>{openServiceForm(undefined, true)}}>
              <AppText style={[$.text_tint_11, $.fw_semibold]}>Add Service</AppText>
            </TouchableOpacity>
          </AppView>
        }
      />

      <AppButton
        onPress={() => {
          navigation.navigate('Timing');
        }}
        name={'Save'}></AppButton>

      {/* Bottom Sheet for Service/Combo Form */}
      <BottomSheetComponent
        ref={bottomSheetRef}
        screenname={service.Iscombo ? 'Combo Details' : 'Service Details'}
        Save={handleSaveService}
        close={() => bottomSheetRef.current?.close()}>
        {service.Iscombo && (
          <AppMultiSelect
            data={serviceList.filter(s => !s.Iscombo)} // Only allow selecting individual services for combos
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
            style={[$.mb_normal]}
          />
        )}

        <AppTextInput
          style={[
            $.bg_tint_11,
            $.border_bottom,
            $.border_primary5,
            $.mb_compact,
          ]}
          placeholder={service.Iscombo ? 'Combo Name' : 'Service Name'}
          value={service.Servicename}
          onChangeText={text => setService({...service, Servicename: text})}
        />

        {!service.Iscombo && (
          <AppTextInput
            style={[
              $.bg_tint_11,
              $.border_bottom,
              $.border_primary5,
              $.mb_compact,
            ]}
            placeholder="Price (₹)"
            keyboardtype="numeric"
            value={service.prize.toString()}
            onChangeText={text =>
              setService({
                ...service,
                prize: parseInt(text) || 0,
              })
            }
          />
        )}

        <AppTextInput
          style={[
            $.bg_tint_11,
            $.border_bottom,
            $.border_primary5,
            $.mb_compact,
          ]}
          placeholder="Offer Price (₹)"
          keyboardtype="numeric"
          value={service.offerprize.toString()}
          onChangeText={text =>
            setService({
              ...service,
              offerprize: parseInt(text) || 0,
            })
          }
        />

        <AppTextInput
          style={[
            $.bg_tint_11,
            $.border_bottom,
            $.border_primary5,
            $.mb_compact,
          ]}
          placeholder="Duration (minutes)"
          keyboardtype="numeric"
          value={service.timetaken.toString()}
          onChangeText={text =>
            setService({
              ...service,
              timetaken: parseInt(text) || 0,
            })
          }
        />
      </BottomSheetComponent>
    </AppView>
  );
}
