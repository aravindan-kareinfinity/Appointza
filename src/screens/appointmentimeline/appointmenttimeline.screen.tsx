import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { DefaultColor } from '../../styles/default-color.style';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../appstack.navigation';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { TimelineService } from '../../services/timeline.service';
import { Timeline, TimelineSelectReq } from '../../models/timeline.model';
import { AppAlert } from '../../components/appalert.component';

const colors = DefaultColor.instance.colors;

type AppointmentTimelineScreenRouteProp = RouteProp<AppStackParamList, 'AppointmentTimeline'>;

export const AppointmentTimelineScreen = () => {
  const route = useRoute<AppointmentTimelineScreenRouteProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<Timeline | null>(null);
  const timelineservice = new TimelineService();

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

  if (isLoading) {
    return (
      <AppView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint_1} />
      </AppView>
    );
  }

  if (!appointment) {
    return (
      <AppView style={styles.container}>
        <AppText style={styles.errorText}>Appointment not found</AppText>
      </AppView>
    );
  }

  return (
    <AppView style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.title}>Appointment Timeline</AppText>
        <AppText style={styles.subtitle}>{appointment.organisationid}</AppText>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.activeDot]} />
          <View style={styles.timelineContent}>
            <AppText style={styles.timelineTitle}>Appointment Created</AppText>
            <AppText style={styles.timelineDate}>
              {new Date(appointment.createdon).toLocaleString()}
            </AppText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.activeDot]} />
          <View style={styles.timelineContent}>
            <AppText style={styles.timelineTitle}>Appointment Date</AppText>
            <AppText style={styles.timelineDate}>
              {new Date(appointment.createdon).toLocaleDateString()}
            </AppText>
            <AppText style={styles.timelineTime}>
              {appointment.taskcode}
            </AppText>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.activeDot]} />
          <View style={styles.timelineContent}>
            <AppText style={styles.timelineTitle}>Current Status</AppText>
            <AppText style={[styles.timelineStatus, { color: getStatusColor(appointment.taskcode) }]}>
              {appointment.taskcode}
            </AppText>
          </View>
        </View>

        {appointment.attributes && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.activeDot]} />
            <View style={styles.timelineContent}>
              <AppText style={styles.timelineTitle}>Additional Information</AppText>
              <View style={styles.attributesContainer}>
                {Object.entries(appointment.attributes).map(([key, value], index) => (
                  <View key={index} style={styles.attributeItem}>
                    <AppText style={styles.attributeKey}>{key}</AppText>
                    <AppText style={styles.attributeValue}>{JSON.stringify(value)}</AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </AppView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tint_11,
  },
  header: {
    padding: 20,
    backgroundColor: colors.tint_1,
    borderBottomWidth: 1,
    borderBottomColor: colors.tint_8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.tint_11,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.tint_11,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 20,
  },
  timelineContainer: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.tint_8,
    marginRight: 20,
    marginTop: 6,
  },
  activeDot: {
    backgroundColor: colors.tint_1,
    borderWidth: 2,
    borderColor: colors.tint_3,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.tint_10,
    padding: 15,
    borderRadius: 10,
    shadowColor: colors.tint_1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.tint_1,
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 14,
    color: colors.tint_3,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
    color: colors.tint_3,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  attributesContainer: {
    marginTop: 10,
  },
  attributeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.tint_9,
  },
  attributeKey: {
    fontSize: 14,
    color: colors.tint_1,
    fontWeight: '500',
  },
  attributeValue: {
    fontSize: 14,
    color: colors.tint_3,
  },
}); 