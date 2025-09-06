import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, CreditCard, Smartphone, Wallet } from "lucide-react-native";
import { Colors } from "../constants/colors";
import { PaymentService } from "../services/payment.service";
import { CreateOrderRequest, CreateOrderResponse } from "../models/payment.model";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: string) => void;
  amount: number;
  currency: string;
  appointmentData: {
    organisationId: number;
    organisationLocationId: number;
    staffId: number;
    appointmentId: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    customerContact: string;
  };
  isLoading?: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
  amount,
  currency,
  appointmentData,
  isLoading = false,
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const paymentService = new PaymentService();

  const handlePayment = async () => {
    if (selectedPaymentMethod === 'cash') {
      // Handle cash payment
      onPaymentSuccess('cash_payment');
      return;
    }

    try {
      setProcessingPayment(true);

      // Create payment order
      const orderRequest = new CreateOrderRequest();
      orderRequest.OrganisationLocationId = appointmentData.organisationLocationId;
      orderRequest.OrganisationId = appointmentData.organisationId;
      orderRequest.StaffId = appointmentData.staffId;
      orderRequest.AppointmentId = appointmentData.appointmentId;
      orderRequest.CustomerId = appointmentData.customerId;
      orderRequest.CustomerName = appointmentData.customerName;
      orderRequest.CustomerEmail = appointmentData.customerEmail;
      orderRequest.CustomerContact = appointmentData.customerContact;
      orderRequest.Amount = amount;
      orderRequest.Notes = 'Appointment payment';

      const orderResponse = await paymentService.createOrder(orderRequest);

      if (orderResponse.success) {
        // Initiate Razorpay payment
        const paymentResult = await paymentService.initiateRazorpayPayment(
          orderResponse,
          {
            name: appointmentData.customerName,
            email: appointmentData.customerEmail,
            contact: appointmentData.customerContact,
          }
        );

        if (paymentResult.success) {
          onPaymentSuccess(paymentResult.paymentId || '');
        } else {
          onPaymentFailure(paymentResult.error || 'Payment failed');
        }
      } else {
        onPaymentFailure('Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onPaymentFailure(error.message || 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Online Payment',
      icon: CreditCard,
      description: 'Pay with UPI, Cards, Net Banking',
      color: '#3399cc',
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      icon: Wallet,
      description: 'Pay at the location',
      color: '#28a745',
    },
  ];

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
            <Text style={styles.title}>Payment Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>
                {currency} {amount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.sectionTitle}>Choose Payment Method</Text>
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodCard,
                      isSelected && styles.selectedPaymentMethod,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                    <View style={styles.paymentMethodContent}>
                      <View style={[styles.iconContainer, { backgroundColor: method.color }]}>
                        <IconComponent size={24} color="white" />
                      </View>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodName}>{method.name}</Text>
                        <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                      </View>
                      <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                        {isSelected && <View style={styles.radioButtonInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Appointment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{appointmentData.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{appointmentData.customerContact}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={processingPayment || isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handlePayment}
              disabled={processingPayment || isLoading}
            >
              {processingPayment ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {selectedPaymentMethod === 'cash' ? 'Confirm Cash Payment' : 'Pay Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxHeight: "85%",
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
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentMethod: {
    borderColor: Colors.light.primary,
    backgroundColor: '#f0f7ff',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.light.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  detailsContainer: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.light.inputBackground,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.background,
  },
}); 