import {useEffect, useState} from 'react';
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

type AppSingleSelectProps<T, V extends keyof T, L extends keyof T> = {
  data: T[];
  value: V;
  label: L;
  selected: T[V];
  onPress: (itemvalue: T[V], item: T) => void;
  title: string;
  style?: StyleProp<ViewStyle>;
};
export const AppSingleSelect = <T, V extends keyof T, L extends keyof T>(
  props: AppSingleSelectProps<T, V, L>,
) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleModel = () => {
    setOpenModal(!openModal);
  };
  const [selectedindex, setSelectedindex] = useState(-1);
  useEffect(() => {
    let index = props.data.findIndex(e => {
      return e[props.value] == props.selected;
    });
    setSelectedindex(index);
  }, [props]);
  return (
    <TouchableOpacity
      style={[$.bg_tint_10, $.p_compact, props.style]}
      onPress={toggleModel}>
      <AppText style={[$.fs_compact]}>{props.title}</AppText>

      {selectedindex > -1 && (
        <AppText style={[$.fs_compact, $.fw_semibold]}>
          {props.data[selectedindex][props.label]!.toString()}
        </AppText>
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
            ]}>
            <AppText
              style={[$.fs_compact, $.fs_medium, $.text_tint_4, $.p_compact]}>
              {props.title}
            </AppText>
            <AppTextInput style={[$.bg_tint_11]} placeholder="Search" />
            <FlatList
              data={props.data}
              style={[$.pt_compact]}
              renderItem={e => {
                return (
                  <TouchableOpacity
                    style={[$.p_compact]}
                    onPress={() => {
                      toggleModel();
                      props.onPress(e.item[props.value], e.item);
                    }}>
                    <AppText>{e.item[props.label]!.toString()}</AppText>
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
