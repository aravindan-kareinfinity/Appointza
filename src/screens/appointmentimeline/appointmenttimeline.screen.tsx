import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
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
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';

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
        return '#10B981'; // Green
      case 'PENDING':
        return '#F59E0B'; // Amber
      case 'CANCELLED':
        return '#EF4444'; // Red
      case 'COMPLETED':
        return '#3B82F6'; // Blue
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '#ECFDF5'; // Light green
      case 'PENDING':
        return '#FFFBEB'; // Light amber
      case 'CANCELLED':
        return '#FEE2E2'; // Light red
      case 'COMPLETED':
        return '#EFF6FF'; // Light blue
      default:
        return '#F3F4F6'; // Light gray
    }
  };

  if (isLoading) {
    return (
      <AppView style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB'
      }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </AppView>
    );
  }

  if (!appointment) {
    return (
      <AppView style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB'
      }}>
        <AppText style={{
          fontSize: 16,
          fontWeight: '500',
          color: '#EF4444'
        }}>Appointment not found</AppText>
      </AppView>
    );
  }

  return (
    <AppView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <CustomHeader
        title="Appointment Timeline"
        showBackButton
        backgroundColor="#FFFFFF"
        titleColor="#111827"
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Timeline container */}
        <AppView style={{ position: 'relative' }}>
          {/* Vertical line */}
          <AppView style={{
            position: 'absolute',
            left: 28,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#E5E7EB'
          }} />

          {/* Timeline items */}
          <AppView style={{ marginBottom: 24 }}>
            <AppView style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Timeline dot */}
              <AppView style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#3B82F6',
                borderWidth: 3,
                borderColor: '#EFF6FF',
                marginRight: 20,
                zIndex: 1
              }} />
              
              {/* Content card */}
              <AppView style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
              }}>
                <AppText style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 8
                }}>Appointment Created</AppText>
                <AppText style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginBottom: 4
                }}>
                  {new Date(appointment.createdon).toLocaleString()}
                </AppText>
              </AppView>
            </AppView>
          </AppView>

          <AppView style={{ marginBottom: 24 }}>
            <AppView style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AppView style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#3B82F6',
                borderWidth: 3,
                borderColor: '#EFF6FF',
                marginRight: 20,
                zIndex: 1
              }} />
              
              <AppView style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
              }}>
                <AppText style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 8
                }}>Appointment Date</AppText>
                <AppText style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginBottom: 4
                }}>
                  {new Date(appointment.createdon).toLocaleDateString()}
                </AppText>
                <AppText style={{
                  fontSize: 14,
                  color: '#6B7280'
                }}>{appointment.taskcode}</AppText>
              </AppView>
            </AppView>
          </AppView>

          <AppView style={{ marginBottom: 24 }}>
            <AppView style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AppView style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#3B82F6',
                borderWidth: 3,
                borderColor: '#EFF6FF',
                marginRight: 20,
                zIndex: 1
              }} />
              
              <AppView style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
              }}>
                <AppText style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 8
                }}>Current Status</AppText>
                <AppView style={{
                  backgroundColor: getStatusBackground(appointment.taskcode),
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  alignSelf: 'flex-start'
                }}>
                  <AppText style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: getStatusColor(appointment.taskcode),
                    textTransform: 'capitalize'
                  }}>
                    {appointment.taskcode}
                  </AppText>
                </AppView>
              </AppView>
            </AppView>
          </AppView>

          {appointment.attributes && (
            <AppView style={{ marginBottom: 24 }}>
              <AppView style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <AppView style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#3B82F6',
                  borderWidth: 3,
                  borderColor: '#EFF6FF',
                  marginRight: 20,
                  zIndex: 1
                }} />
                
                <AppView style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  padding: 16,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2
                }}>
                  <AppText style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 12
                  }}>Additional Information</AppText>
                  
                  <AppView style={{ marginTop: 8 }}>
                    {Object.entries(appointment.attributes).map(([key, value], index) => (
                      <AppView key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6'
                      }}>
                        <AppText style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: '#374151',
                          flex: 1
                        }}>{key}</AppText>
                        <AppText style={{
                          fontSize: 14,
                          color: '#6B7280',
                          flex: 1,
                          textAlign: 'right'
                        }}>{JSON.stringify(value)}</AppText>
                      </AppView>
                    ))}
                  </AppView>
                </AppView>
              </AppView>
            </AppView>
          )}
        </AppView>
      </ScrollView>
    </AppView>
  );
};