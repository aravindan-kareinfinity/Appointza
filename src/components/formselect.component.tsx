import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Colors } from "../constants/colors";

interface Option {
  id: number;
  name: string;
  code?: string;
}

interface FormSelectProps {
  label: string;
  options: Option[];
  selectedId: number;
  onSelect: (option: Option) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export function FormSelect({
  label,
  options,
  selectedId,
  onSelect,
  error,
  containerStyle,
}: FormSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((option) => option.id === selectedId);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, error ? styles.selectButtonError : {}]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectText}>
          {selectedOption ? selectedOption.name : "Select an option"}
        </Text>
        <ChevronDown size={20} color={Colors.light.text} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.id === selectedId && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.id === selectedId && styles.selectedOptionText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
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
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  selectedOption: {
    backgroundColor: `${Colors.light.primary}20`,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: Colors.light.primary,
  },
  closeButton: {
    marginTop: 16,
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