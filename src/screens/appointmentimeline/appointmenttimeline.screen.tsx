import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { TimelineService } from '../../services/timeline.service';
import { Timeline, TimelineSelectReq } from '../../models/timeline.model';
import { AppAlert } from '../../components/appalert.component';
import { useTheme } from '../../components/theme-provider';
import { styled } from 'nativewind';

const StyledView = styled(AppView);

type AppointmentTimelineScreenRouteProp = RouteProp<AppStackParamList, 'AppointmentTimeline'>;

export const AppointmentTimelineScreen = () => {
  const route = useRoute<AppointmentTimelineScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Timeline | null>(null);
  const timelineservice = new TimelineService();
  const { colors } = useTheme();

  useEffect(() => {
    loadAppointmentDetails();
  }, []);

  const loadAppointmentDetails = async () => {
    try {
      setIsLoading(true);
      const req = new TimelineSelectReq();
      req.appointmentid = route.params.appointmentid;
      
      const response = await timelineservice.select(req);
      if (response && response.length > 0) {
        setAppointment(response[0]);
      }
    } catch (error: any) {
      AppAlert({ message: error?.response?.data?.message || 'Failed to load appointment details' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return colors.success;
      case 'PENDING':
        return colors.warn;
      case 'CANCELLED':
        return colors.danger;
      case 'COMPLETED':
        return colors.tint_3;
      default:
        return colors.tint_3;
    }
  };

  if (isLoading) {
    return (
      <AppView className="flex-1 justify-center items-center bg-tint-11">
        <ActivityIndicator size="large" color={colors.tint_1} />
      </AppView>
    );
  }

  if (!appointment) {
    return (
      <AppView className="flex-1 justify-center items-center bg-tint-11">
        <AppText className="text-danger text-base">Appointment not found</AppText>
      </AppView>
    );
  }

  return (
    <AppView className="flex-1 bg-tint-11">
      <StyledView className="p-5 bg-tint-1 border-b border-tint-8">
        <AppText className="text-2xl font-bold text-tint-11 mb-2">Appointment Timeline</AppText>
        <AppText className="text-base text-tint-11 opacity-80">{appointment.organisationid}</AppText>
      </StyledView>

      <StyledView className="p-5">
        <StyledView className="flex-row mb-8 relative">
          <StyledView className="w-4 h-4 rounded-full bg-tint-1 border-2 border-tint-3 mr-5 mt-1.5" />
          <StyledView className="flex-1 bg-tint-10 p-4 rounded-lg shadow">
            <AppText className="text-lg font-semibold text-tint-1 mb-2">Appointment Created</AppText>
            <AppText className="text-sm text-tint-3 mb-1">
              {new Date(appointment.createdon).toLocaleString()}
            </AppText>
          </StyledView>
        </StyledView>

        <StyledView className="flex-row mb-8 relative">
          <StyledView className="w-4 h-4 rounded-full bg-tint-1 border-2 border-tint-3 mr-5 mt-1.5" />
          <StyledView className="flex-1 bg-tint-10 p-4 rounded-lg shadow">
            <AppText className="text-lg font-semibold text-tint-1 mb-2">Appointment Date</AppText>
            <AppText className="text-sm text-tint-3 mb-1">
              {new Date(appointment.createdon).toLocaleDateString()}
            </AppText>
            <AppText className="text-sm text-tint-3">{appointment.taskcode}</AppText>
          </StyledView>
        </StyledView>

        <StyledView className="flex-row mb-8 relative">
          <StyledView className="w-4 h-4 rounded-full bg-tint-1 border-2 border-tint-3 mr-5 mt-1.5" />
          <StyledView className="flex-1 bg-tint-10 p-4 rounded-lg shadow">
            <AppText className="text-lg font-semibold text-tint-1 mb-2">Current Status</AppText>
            <AppText 
              className="text-base font-semibold"
              style={{ color: getStatusColor(appointment.taskcode) }}
            >
              {appointment.taskcode}
            </AppText>
          </StyledView>
        </StyledView>

        {appointment.attributes && (
          <StyledView className="flex-row mb-8 relative">
            <StyledView className="w-4 h-4 rounded-full bg-tint-1 border-2 border-tint-3 mr-5 mt-1.5" />
            <StyledView className="flex-1 bg-tint-10 p-4 rounded-lg shadow">
              <AppText className="text-lg font-semibold text-tint-1 mb-2">Additional Information</AppText>
              <StyledView className="mt-2.5">
                {Object.entries(appointment.attributes).map(([key, value], index) => (
                  <StyledView key={index} className="flex-row justify-between mb-2 py-1 border-b border-tint-9">
                    <AppText className="text-sm text-tint-1 font-medium">{key}</AppText>
                    <AppText className="text-sm text-tint-3">{JSON.stringify(value)}</AppText>
                  </StyledView>
                ))}
              </StyledView>
            </StyledView>
          </StyledView>
        )}
      </StyledView>
    </AppView>
  );
}; 