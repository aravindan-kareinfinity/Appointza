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
import {AppButton} from './appbutton.component';
import {createDelayedMethod} from '../utils/delaymethod.util';
type AppMultiSelectProps<T> = {
  data: T[];
  selecteditemlist: T[];
  onSelect: (itemlist: T[]) => void;
  renderItemLabel: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  searchKeyExtractor: (item: T) => string;
  title: string;
  style?: StyleProp<ViewStyle>;
  showerror?: boolean;
  required?: boolean;
};
export const AppMultiSelect = <T,>(props: AppMultiSelectProps<T>) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleModel = () => {
    setOpenModal(!openModal);
  };
  const [selecteditemiddict, setSelecteditemiddict] = useState<{
    [key: string]: number;
  }>({});
  const [filtereddata, setFiltereddata] = useState<T[]>();
  const [searchtext, setSearchtext] = useState('');
  const delayedsearchmethod = useMemo(() => createDelayedMethod(), []);

  useEffect(() => {
    let selectediddict: {[key: string]: number} = {};
    props.selecteditemlist.forEach((e, i) => {
      let key = props.keyExtractor(e);
      selectediddict[key] = 1;
    });
    setSelecteditemiddict(selectediddict);
    setFiltereddata(props.data);
    setSearchtext('');
  }, [props]);

  const onSearch = (text: string) => {
    let filtereddata = props.data.filter(e =>
      props.searchKeyExtractor(e).toLowerCase().includes(text.toLowerCase()),
    );
    setFiltereddata(filtereddata);
  };

  const isSelected = (id: string) => {
    return selecteditemiddict.hasOwnProperty(id);
  };
  const toggleSelection = (id: string) => {
    if (selecteditemiddict[id]) {
      delete selecteditemiddict[id];
    } else {
      selecteditemiddict[id] = 1;
    }
    setSelecteditemiddict({...selecteditemiddict});
  };
  const onDone = () => {
    let selecteditemlist = props.data.filter(e => {
      return selecteditemiddict[props.keyExtractor(e)];
    });
    props.onSelect(selecteditemlist);
    toggleModel();
  };
  const isvalid = () => {
    return props.required && Object.keys(selecteditemiddict).length > 0;
  };
  return (
    <TouchableOpacity
      style={[
        $.bg_tint_11,$.p_small,$.m_tiny,$.border_rounded,
        props.style,$.elevation_4,
        props.showerror && !isvalid() && [$.border, $.border_danger],
      ]}
      onPress={toggleModel}>
      <AppView style={$.flex_row}>
        <AppText style={[$.fs_compact,$.text_primary5, $.flex_1]}>{props.title}</AppText>
        {props.required && (
          <AppText style={[$.text_danger, $.fs_regular]}>*</AppText>
        )}
      </AppView>
      <AppView style={[$.flex_row, $.flex_wrap_wrap]}>
        {props.selecteditemlist.map(selecteditem => {
          return props.renderItemLabel(selecteditem);
        })}
      </AppView>

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
              $.bg_tint_11,
              $.flex_1,
              $.mt_colossal,
              $.border,
              $.border_tint_8,
              {borderTopLeftRadius: 20, borderTopRightRadius: 20},
            ]}>
            <AppText
              style={[$.fs_compact, $.fs_medium, $.text_primary5, $.p_compact]}>
              {props.title}
            </AppText>
            <AppTextInput
              style={[$.bg_tint_11,$.px_compact,$.text_primary5]}
              placeholder="Search"
              onChangeText={text => {
                setSearchtext(text);
                delayedsearchmethod(() => onSearch(text));
              }}
            />
            <FlatList
              data={filtereddata}
              style={[$.pt_compact,]}
              renderItem={({item}) => {
                let id = props.keyExtractor(item);

                return (
                  <TouchableOpacity
                    style={[$.p_compact, isSelected(id) && [$.bg_tint_8]]}
                    onPress={() => {
                      toggleSelection(id);
                    }}>
                    {props.renderItemLabel(item)}
                  </TouchableOpacity>
                );
              }}
            />
            <AppButton onPress={onDone} name="Done"></AppButton>
          </AppView>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};
