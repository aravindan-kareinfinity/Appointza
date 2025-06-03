import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Colors } from "../constants/colors";

interface CountryCode {
  code: string;
  country: string;
}

interface CountryCodeSelectProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  options: CountryCode[];
  error?: string;
}

export function CountryCodeSelect({
  selectedCode,
  onSelect,
  options,
  error,
}: CountryCodeSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.codeButton, error ? styles.codeButtonError : {}]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.codeText}>{selectedCode || "+1"}</Text>
        <ChevronDown size={16} color={Colors.light.text} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.code === selectedCode && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.code === selectedCode && styles.selectedOptionText,
                    ]}
                  >
                    {item.code} ({item.country})
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
    width: 80,
    marginRight: 8,
  },
  codeButton: {
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeButtonError: {
    borderColor: Colors.light.error,
  },
  codeText: {
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