import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";
import { Colors } from "../constants/colors";

interface StaffAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: "default" | "danger";
}

interface StaffActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: StaffAction[];
}

export function StaffActionSheet({
  visible,
  onClose,
  title,
  actions,
}: StaffActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  action.variant === "danger" && styles.dangerButton,
                ]}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
              >
                {action.icon && <View style={styles.iconContainer}>{action.icon}</View>}
                <View style={styles.actionContent}>
                  <Text
                    style={[
                      styles.actionTitle,
                      action.variant === "danger" && styles.dangerText,
                    ]}
                  >
                    {action.title}
                  </Text>
                  {action.description && (
                    <Text style={styles.actionDescription}>
                      {action.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: `${Colors.light.error}20`,
  },
  iconContainer: {
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  dangerText: {
    color: Colors.light.error,
  },
  cancelButton: {
    padding: 16,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
}); 