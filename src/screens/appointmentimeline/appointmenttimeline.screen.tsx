import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { TimelineService } from '../../services/timeline.service';
import { Timeline, TimelineSelectReq } from '../../models/timeline.model';
import { AppAlert } from '../../components/appalert.component';
import { useTheme } from '../../components/theme-provider';
import { styled } from 'nativewind';
import { $ } from '../../styles';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { AppText as AppTextStyle } from '../../styles/app-text.style';
import { AppView as AppViewStyle } from '../../styles/app-view.style';

const StyledView = styled(AppView);
const textStyle = AppTextStyle.instance;
const viewStyle = AppViewStyle.instance;

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
      <AppView style={[viewStyle.flex_1, viewStyle.justify_content_center, viewStyle.align_items_center, { backgroundColor: colors.tint_11 }]}>
        <ActivityIndicator size="large" color={colors.tint_1} />
      </AppView>
    );
  }

  if (!appointment) {
    return (
      <AppView style={[viewStyle.flex_1, viewStyle.justify_content_center, viewStyle.align_items_center, { backgroundColor: colors.tint_11 }]}>
        <AppText style={[textStyle.fs_regular, textStyle.fw_medium, { color: colors.danger }]}>Appointment not found</AppText>
      </AppView>
    );
  }

  return (
    <AppView style={[viewStyle.flex_1, { backgroundColor: colors.tint_11 }]}>
      <View style={[viewStyle.flex_row, viewStyle.m_regular, viewStyle.px_regular]}>
        <AppText style={[textStyle.fs_regular, textStyle.fw_bold, { color: colors.tint_1 }]}>Appointment Timeline</AppText>
      </View>

      <StyledView style={[viewStyle.p_regular]}>
        <StyledView style={[viewStyle.flex_row, viewStyle.mb_big, viewStyle.align_items_center]}>
          <StyledView style={[viewStyle.w_100, { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.tint_1, borderWidth: 2, borderColor: colors.tint_3, marginRight: 20 }]} />
          <StyledView style={[viewStyle.flex_1, { backgroundColor: colors.tint_10, padding: 16, borderRadius: 12, elevation: 2 }]}>
            <AppText style={[textStyle.fs_regular, textStyle.fw_semibold, { color: colors.tint_1, marginBottom: 8 }]}>Appointment Created</AppText>
            <AppText style={[textStyle.fs_small, { color: colors.tint_3, marginBottom: 4 }]}>
              {new Date(appointment.createdon).toLocaleString()}
            </AppText>
          </StyledView>
        </StyledView>

        <StyledView style={[viewStyle.flex_row, viewStyle.mb_big, viewStyle.align_items_center]}>
          <StyledView style={[viewStyle.w_100, { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.tint_1, borderWidth: 2, borderColor: colors.tint_3, marginRight: 20 }]} />
          <StyledView style={[viewStyle.flex_1, { backgroundColor: colors.tint_10, padding: 16, borderRadius: 12, elevation: 2 }]}>
            <AppText style={[textStyle.fs_regular, textStyle.fw_semibold, { color: colors.tint_1, marginBottom: 8 }]}>Appointment Date</AppText>
            <AppText style={[textStyle.fs_small, { color: colors.tint_3, marginBottom: 4 }]}>
              {new Date(appointment.createdon).toLocaleDateString()}
            </AppText>
            <AppText style={[textStyle.fs_small, { color: colors.tint_3 }]}>{appointment.taskcode}</AppText>
          </StyledView>
        </StyledView>

        <StyledView style={[viewStyle.flex_row, viewStyle.mb_big, viewStyle.align_items_center]}>
          <StyledView style={[viewStyle.w_100, { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.tint_1, borderWidth: 2, borderColor: colors.tint_3, marginRight: 20 }]} />
          <StyledView style={[viewStyle.flex_1, { backgroundColor: colors.tint_10, padding: 16, borderRadius: 12, elevation: 2 }]}>
            <AppText style={[textStyle.fs_regular, textStyle.fw_semibold, { color: colors.tint_1, marginBottom: 8 }]}>Current Status</AppText>
            <AppText 
              style={[textStyle.fs_compact, textStyle.fw_semibold, { color: getStatusColor(appointment.taskcode) }]}
            >
              {appointment.taskcode}
            </AppText>
          </StyledView>
        </StyledView>

        {appointment.attributes && (
          <StyledView style={[viewStyle.flex_row, viewStyle.mb_big, viewStyle.align_items_center]}>
            <StyledView style={[viewStyle.w_100, { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.tint_1, borderWidth: 2, borderColor: colors.tint_3, marginRight: 20 }]} />
            <StyledView style={[viewStyle.flex_1, { backgroundColor: colors.tint_10, padding: 16, borderRadius: 12, elevation: 2 }]}>
              <AppText style={[textStyle.fs_regular, textStyle.fw_semibold, { color: colors.tint_1, marginBottom: 12 }]}>Additional Information</AppText>
              <StyledView style={[viewStyle.mt_small]}>
                {Object.entries(appointment.attributes).map(([key, value], index) => (
                  <StyledView key={index} style={[viewStyle.flex_row, viewStyle.justify_content_center, viewStyle.mb_small, viewStyle.py_small, { borderBottomWidth: 1, borderBottomColor: colors.tint_9 }]}>
                    <AppText style={[textStyle.fs_small, textStyle.fw_medium, { color: colors.tint_1, flex: 1 }]}>{key}</AppText>
                    <AppText style={[textStyle.fs_small, { color: colors.tint_3, flex: 1, textAlign: 'right' }]}>{JSON.stringify(value)}</AppText>
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