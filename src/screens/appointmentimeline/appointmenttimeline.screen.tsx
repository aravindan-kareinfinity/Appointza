import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppoinmentService } from '../../services/appoinment.service';
import { AppointmentSummary, AppointmentSummarySelectReq } from '../../models/appointmentsummary.model';
import { AppAlert } from '../../components/appalert.component';
import { CustomHeader } from '../../components/customheader.component';

type AppointmentTimelineScreenRouteProp = RouteProp<AppStackParamList, 'AppointmentTimeline'>;

export const AppointmentTimelineScreen = () => {
  const route = useRoute<AppointmentTimelineScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const appointmentService = new AppoinmentService();

  useEffect(() => {
    loadAppointmentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointmentDetails = async () => {
    try {
      setIsLoading(true);
      const req = new AppointmentSummarySelectReq();
      req.appointmentid = route.params.appointmentid;

      const response = await appointmentService.GetAppointmentSummary(req);
      if (response) {
        setAppointment(response);
      } else {
        AppAlert({ message: 'No appointment data found' });
      }
    } catch (error: any) {
      console.error('Error loading appointment details:', error);
      AppAlert({ message: error?.response?.data?.message || 'Failed to load appointment details' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#6B7280';
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'CANCELLED':
        return '#EF4444';
      case 'COMPLETED':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusBackground = (status?: string) => {
    if (!status) return '#F3F4F6';
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return '#ECFDF5';
      case 'PENDING':
        return '#FFFBEB';
      case 'CANCELLED':
        return '#FEE2E2';
      case 'COMPLETED':
        return '#EFF6FF';
      default:
        return '#F3F4F6';
    }
  };

  if (isLoading) {
    return (
      <AppView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </AppView>
    );
  }

  if (!appointment) {
    return (
      <AppView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 }}>
        <AppText style={{ fontSize: 18, fontWeight: '600', color: '#EF4444', textAlign: 'center', marginBottom: 8 }}>
          Appointment Not Found
        </AppText>
        <AppText style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
          The requested appointment could not be found or may have been removed.
        </AppText>
      </AppView>
    );
  }

  return (
    <AppView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <CustomHeader title="Appointment Summary" showBackButton backgroundColor="#FFFFFF" titleColor="#111827" />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Appointment Status Card */}
        <AppView
          style={{
            backgroundColor: '#FFFFFF',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <AppView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <AppText style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Appointment #{appointment.id}</AppText>
            <AppView
              style={{
                backgroundColor: getStatusBackground(appointment.status),
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: getStatusColor(appointment.status),
                  textTransform: 'capitalize',
                }}
              >
                {appointment.status || 'Unknown'}
              </AppText>
            </AppView>
          </AppView>

          <AppText style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            {appointment.organisationname || 'N/A'}
          </AppText>
          <AppText style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>{appointment.locationname || 'N/A'}</AppText>
          <AppText style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>{appointment.locationaddress || 'N/A'}</AppText>

          <AppView
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <AppView>
              <AppText style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Date & Time</AppText>
              <AppText style={{ fontSize: 14, color: '#6B7280' }}>
                {appointment.appointmentdate
                  ? new Date(appointment.appointmentdate).toLocaleDateString()
                  : 'N/A'}{' '}
                at {appointment.fromtime || 'N/A'} - {appointment.totime || 'N/A'}
              </AppText>
            </AppView>
          
          </AppView>
        </AppView>

        {/* Services Card */}
        {Array.isArray(appointment.services) && appointment.services.length > 0 ? (
          <AppView
            style={{
              backgroundColor: '#FFFFFF',
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <AppText style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Services Booked</AppText>
            {appointment.services.map((service, index) => (
              <AppView
                key={service.id || index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < appointment.services.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <AppView style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                    {service.servicename || 'N/A'}
                  </AppText>
                  {service.servicedescription && (
                    <AppText style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                      {service.servicedescription}
                    </AppText>
                  )}
                  {/* <AppText style={{ fontSize: 12, color: '#9CA3AF' }}>{service.duration || '0'} minutes</AppText> */}
                </AppView>
                <AppText style={{ fontSize: 16, fontWeight: '700', color: '#059669' }}>₹{service.serviceprice || '0'}</AppText>
              </AppView>
            ))}
          </AppView>
        ) : (
          <AppView
            style={{
              backgroundColor: '#FFFFFF',
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <AppText style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
              No services booked for this appointment
            </AppText>
          </AppView>
        )}

        {/* Other cards (organization, staff, payment, timeline, notes) stay the same */}
      </ScrollView>
    </AppView>
  );
};
