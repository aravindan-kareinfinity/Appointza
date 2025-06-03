import {ReactNode, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {Colors} from '../constants/colors';
import {AppText} from './apptext.component';
import {AppTextInput} from './apptextinput.component';
import {AppButton} from './appbutton.component';
import {createDelayedMethod} from '../utils/delaymethod.util';
import {ChevronDown} from 'lucide-react-native';

type AppMultiSelectProps<T> = {
  data: T[];
  selecteditemlist: T[];
  onSelect: (itemlist: T[]) => void;
  renderItemLabel: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  searchKeyExtractor: (item: T) => string;
  title: string;
  style?: ViewStyle;
  showerror?: boolean;
  required?: boolean;
  label?: string;
};

export const AppMultiSelect = <T,>(props: AppMultiSelectProps<T>) => {
  const [openModal, setOpenModal] = useState(false);
  const [selecteditemiddict, setSelecteditemiddict] = useState<{
    [key: string]: number;
  }>({});
  const [filtereddata, setFiltereddata] = useState<T[]>();
  const [searchtext, setSearchtext] = useState('');
  const delayedsearchmethod = useMemo(() => createDelayedMethod(), []);

  useEffect(() => {
    let selectediddict: {[key: string]: number} = {};
    props.selecteditemlist.forEach((e) => {
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
    setOpenModal(false);
  };

  const isvalid = () => {
    return props.required && Object.keys(selecteditemiddict).length > 0;
  };

  const getSelectedItemsText = () => {
    if (props.selecteditemlist.length === 0) {
      return "Select items";
    }
    return `${props.selecteditemlist.length} items selected`;
  };

  return (
    <View style={[styles.container, props.style]}>
      <AppText style={styles.label}>
        {props.label || props.title}
        {props.required && <AppText style={styles.required}>*</AppText>}
      </AppText>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          props.showerror && !isvalid() && styles.selectButtonError,
        ]}
        onPress={() => setOpenModal(true)}>
        <AppText style={styles.selectText}>{getSelectedItemsText()}</AppText>
        <ChevronDown size={20} color={Colors.light.text} />
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={openModal}
        onRequestClose={() => setOpenModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>{props.title}</AppText>
            
            <AppTextInput
              style={styles.searchInput}
              placeholder="Search"
              onChangeText={text => {
                setSearchtext(text);
                delayedsearchmethod(() => onSearch(text));
              }}
            />

            <FlatList
              data={filtereddata}
              style={styles.list}
              renderItem={({item}) => {
                const id = props.keyExtractor(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected(id) && styles.selectedOption,
                    ]}
                    onPress={() => toggleSelection(id)}>
                    {props.renderItemLabel(item)}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDone}>
              <AppText style={styles.closeButtonText}>Done</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: Colors.light.text,
  },
  required: {
    color: Colors.light.error,
    marginLeft: 4,
  },
  selectButton: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonError: {
    borderColor: Colors.light.error,
  },
  selectText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: Colors.light.text,
  },
  searchInput: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  list: {
    marginBottom: 16,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  selectedOption: {
    backgroundColor: `${Colors.light.primary}20`,
  },
  closeButton: {
    padding: 16,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
});
