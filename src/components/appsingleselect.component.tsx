import {ReactNode, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import {$} from '../styles';
import {AppText} from './apptext.component';
import {AppView} from './appview.component';
import {AppTextInput} from './apptextinput.component';
import {createDelayedMethod} from '../utils/delaymethod.util';
import {CustomIcon, CustomIcons} from './customicons.component';

type AppSingleSelectProps<T> = {
  data: T[];
  selecteditem?: T;
  selecteditemid?: string;
  onSelect: (itemlist: T) => void;
  renderItemLabel: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  searchKeyExtractor: (item: T) => string;
  title: string;
  style?: StyleProp<ViewStyle>;
  onClear?: () => void;
  required?: boolean;
  issubmitted?: boolean;
  isloading?: boolean;
};
export const AppSingleSelect = <T,>(props: AppSingleSelectProps<T>) => {
  const [openModal, setOpenModal] = useState(false);
  
  const [filtereddata, setFiltereddata] = useState<T[]>();
  const [searchtext, setSearchtext] = useState('');
  const delayedsearchmethod = useMemo(() => createDelayedMethod(), []);
  const [selecteditem, setSelecteditem] = useState<T>();
  const [istouched, setIstouched] = useState(false);
  useEffect(() => {
    if (istouched == true && props.issubmitted == false) {
      setIstouched(false);
    }
  }, [props.issubmitted]);
  useEffect(() => {
    setFiltereddata(props.data);
    setSearchtext('');
    if (props.selecteditemid) {
      let selecteditem = props.data.find(
        e => props.keyExtractor(e) == props.selecteditemid,
      );
      setSelecteditem(selecteditem);
    } else {
      setSelecteditem(props.selecteditem);
    }
  }, [props]);
  const toggleModel = () => {
    setIstouched(true);           
    setOpenModal(!openModal);
  };
  const onDone = (item: T) => {
    props.onSelect(item);
    toggleModel();
  };

  const onSearch = (text: string) => {
    let filtereddata = props.data.filter(e =>
      props.searchKeyExtractor(e).toLowerCase().includes(text.toLowerCase()),
    );
    setFiltereddata(filtereddata);
  };
  const isvalid = () => {
    if (!props.required) {
      return true;
    }
    return (
      props.required &&
      selecteditem &&
      props.keyExtractor(selecteditem).length > 0
    );
  };
  return (
    <TouchableOpacity
      style={[
        $.bg_tint_10,
        $.p_compact,
        props.style,
        (istouched || props.issubmitted) && !isvalid() && [$.border, $.border_danger],
      ]}
      onPress={toggleModel}>
      <AppView style={[$.flex_row]}>
        <AppView style={[$.flex_1]}>
          {props.title.length > 0 && (
            <AppText style={[$.fs_compact]}>{props.title}</AppText>
          )}

          {selecteditem &&
            props.keyExtractor(selecteditem).length > 0 &&
            props.renderItemLabel(selecteditem)}
        </AppView>

        {props.onClear && (
          <TouchableOpacity
            onPress={props.onClear}
            style={[$.align_items_center, $.justify_content_center]}
            hitSlop={20}>
            <AppView style={[{transform: [{rotate: '45deg'}]}]}>
              <CustomIcon
                name={CustomIcons.Plus}
                color={$.tint_8}
                size={20}></CustomIcon>
            </AppView>
          </TouchableOpacity>
        )}
      </AppView>
      {(istouched || props.issubmitted) && !isvalid() && (
        <AppText style={[$.text_danger, $.fs_small]}>Required</AppText>
      )}
      <Modal
        transparent={true}
        animationType="fade"
        visible={openModal}
        onRequestClose={() => toggleModel()}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleModel}
          style={[$.w_100, $.h_100, {backgroundColor: '#000000aa'}]}>
          <AppView
            style={[
              $.bg_tint_10,
              $.flex_1,
              $.mt_colossal,
              $.border,
              $.border_tint_8,
              {borderTopLeftRadius: 20, borderTopRightRadius: 20},
              $.pt_regular,
            ]}>
            {props.title.length > 0 && (
              <AppText
                style={[
                  $.fs_compact,
                  $.fs_medium,
                  $.text_tint_4,
                  $.px_compact,
                  $.pb_compact,
                ]}>
                {props.title}
              </AppText>
            )}
            <AppTextInput
              onChangeText={text => {
                setSearchtext(text);
                delayedsearchmethod(() => onSearch(text));
              }}
              style={[$.bg_tint_11]}
              placeholder="Search"
            />
            <FlatList
              data={filtereddata}
              style={[$.pt_compact]}
              renderItem={({item}) => {
                return (
                  <TouchableOpacity
                    style={[$.p_compact]}
                    onPress={() => {
                      onDone(item);
                    }}>
                    {props.renderItemLabel(item)}
                  </TouchableOpacity>
                );
              }}
            />
          </AppView>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};
