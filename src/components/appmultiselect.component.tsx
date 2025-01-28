import {ReactNode, useEffect, useState} from 'react';
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
type AppMultiSelectData = {
  id: number;
};
type AppMultiSelectProps<T, V, L extends keyof V, M extends keyof T> = {
  data: T[];
  dataidproperty: M;
  selected: T[];
  onPress: (itemlist: T[]) => void;
  title: string;
  style?: StyleProp<ViewStyle>;
  getLabel: (item: T) => ReactNode;
};
export const AppMultiSelect = <T, V, L extends keyof V, M extends keyof T>(
  props: AppMultiSelectProps<T, V, L, M>,
) => {
  const [openModal, setOpenModal] = useState(false);
  const toggleModel = () => {
    setOpenModal(!openModal);
  };
  const [selectediddict, setSelectediddict] = useState<{[key: string]: number}>(
    {},
  );
  useEffect(() => {
    let selectediddict: {[key: string]: number} = {};
    props.selected.forEach((e, i) => {
      let key = e[props.dataidproperty]!.toString();
      selectediddict[key] = -1;
    });
    setSelectediddict(selectediddict);
  }, [props]);

  return (
    <TouchableOpacity
      style={[$.bg_tint_10, $.p_compact, props.style]}
      onPress={toggleModel}>
      <AppText style={[$.fs_compact]}>{props.title}</AppText>
      <AppView style={[$.flex_row]}>
        {props.selected.map(selecteditem => {
          return props.getLabel(selecteditem);
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
              style={[$.pt_compact, $.flex_1]}
              renderItem={e => {
                let key = e.item[props.dataidproperty]!.toString();

                return (
                  <TouchableOpacity
                    style={[
                      $.p_compact,
                      selectediddict.hasOwnProperty(key) && $.bg_tint_11,
                    ]}
                    onPress={() => {
                      if (selectediddict.hasOwnProperty(key)) {
                        delete selectediddict[key];
                      } else {
                        selectediddict[key] = e.index;
                      }
                      setSelectediddict({
                        ...selectediddict,
                      });
                    }}>
                    {props.getLabel(e.item)}
                  </TouchableOpacity>
                );
              }}
            />
            <AppButton
              onPress={() => {
                let selectedlist: T[] = [];
                for (const key in selectediddict) {
                  if (selectediddict[key] > -1) {
                    selectedlist.push(props.data[selectediddict[key]]);
                  }
                }
                props.selected.forEach(e => {
                  let key = e[props.dataidproperty]!.toString();
                  if (selectediddict.hasOwnProperty(key)) {
                    selectedlist.push(e);
                  }
                });
                props.onPress(selectedlist);
                toggleModel();
              }}
              name="Done"></AppButton>
          </AppView>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};
