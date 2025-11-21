import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {$} from '../../styles';
import {ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform} from 'react-native';
import {AppAlert} from '../../components/appalert.component';
import {FilesService} from '../../services/files.service';
import {EventService} from '../../services/event.service';
import {EventBookingService} from '../../services/eventbooking.service';
import {
  Event,
  EventSelectReq,
} from '../../models/event.model';
import {
  EventBooking,
} from '../../models/eventbooking.model';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import { CustomHeader } from '../../components/customheader.component';
import { Colors } from '../../constants/colors';
import { AppTextInput } from '../../components/apptextinput.component';
import { AppButton } from '../../components/appbutton.component';
import {selectiscustomer} from '../../redux/iscustomer.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {useRoute, useNavigation} from '@react-navigation/native';

type EventBookingScreenProp = NativeStackScreenProps<AppStackParamList, 'EventBooking'>;

export function EventBookingScreen() {
  const navigation = useNavigation<EventBookingScreenProp['navigation']>();
  const route = useRoute<EventBookingScreenProp['route']>();
  const eventId = route.params?.eventId || 0;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<string>('1');
  const [attendeeNames, setAttendeeNames] = useState<string[]>(['']);
  
  const eventService = useMemo(() => new EventService(), []);
  const eventBookingService = useMemo(() => new EventBookingService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  
  const isLoggedIn = useAppSelector(selectiscustomer).isLoggedIn;
  const isCustomer = useAppSelector(selectiscustomer).isCustomer;
  const usercontext = useAppSelector(selectusercontext);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || eventId === 0) {
        AppAlert({message: 'Event ID is missing'});
        navigation.goBack();
        return;
      }

      try {
        setIsLoading(true);
        const req = new EventSelectReq();
        req.id = eventId;
        req.organisation_id = 0;
        req.organisation_location_id = 0;
        req.status = '';
        req.is_public = true;
        
        const response = await eventService.select(req);
        
        if (response && response.length > 0) {
          const eventData = response[0];
          setEvent(eventData);
          
          // Load event image
          if (eventData.images?.ImageIds && eventData.images.ImageIds.length > 0) {
            const firstImageId = eventData.images.ImageIds[0];
            if (firstImageId > 0) {
              setEventImageUrl(filesService.get(firstImageId));
            }
          }
        } else {
          AppAlert({message: 'Event not found'});
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        AppAlert({message: 'Failed to load event details'});
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, eventService, filesService, navigation]);

  // Handle number of people change
  const handleNumberOfPeopleChange = (value: string) => {
    const count = parseInt(value) || 1;
    setNumberOfPeople(value);
    
    // Update attendee names array
    if (count > 1) {
      const newNames = Array(count).fill('').map((_, index) => attendeeNames[index] || '');
      setAttendeeNames(newNames);
    } else {
      setAttendeeNames(['']);
    }
  };

  // Handle attendee name change
  const handleAttendeeNameChange = (index: number, value: string) => {
    const newNames = [...attendeeNames];
    newNames[index] = value;
    setAttendeeNames(newNames);
  };

  // Validate and submit booking
  const handleBookEvent = async () => {
    // Check if user is logged in
    if (!isLoggedIn || !isCustomer) {
      AppAlert({
        message: 'Please log in to confirm your booking',
        onPress: () => {
          navigation.navigate('Login');
        },
      });
      return;
    }

    if (!event) {
      AppAlert({message: 'Event information is missing'});
      return;
    }

    const peopleCount = parseInt(numberOfPeople) || 1;

    // Validate slots available
    if (event.remainingslot < peopleCount) {
      AppAlert({message: `Only ${event.remainingslot} slot(s) available`});
      return;
    }

    // Validate names if number_of_people > 1
    if (peopleCount > 1) {
      const validNames = attendeeNames.filter(name => name.trim().length > 0);
      if (validNames.length !== peopleCount) {
        AppAlert({message: `Please enter names for all ${peopleCount} attendee(s)`});
        return;
      }
    }

    try {
      setIsBooking(true);

      const booking = new EventBooking();
      booking.event_id = event.id;
      booking.user_id = usercontext.value.userid || 0;
      booking.number_of_people = peopleCount;
      
      // Calculate total amount
      if (event.entry_amount > 0) {
        booking.total_amount = event.entry_amount * peopleCount;
      }

      // Store names in notes if number_of_people > 1
      if (peopleCount > 1) {
        booking.notes = attendeeNames.filter(name => name.trim().length > 0).join(', ');
      }

      await eventBookingService.insert(booking);

      setBookingSuccess(true);
      AppAlert({
        message: `Successfully booked ${peopleCount} slot(s) for ${event.event_name}`,
      });
    } catch (error: any) {
      console.error('Error booking event:', error);
      AppAlert({
        message: error?.message || 'Failed to book event. Please try again.',
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Format date
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format date range
  const formatDateRange = (fromDate: Date | null, toDate: Date | null): string => {
    if (!fromDate || !toDate) return 'N/A';
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    return `${from} - ${to}`;
  };

  // Get event date display
  const getEventDateDisplay = (event: Event): string => {
    switch (event.event_type) {
      case 'single':
        return formatDate(event.event_date);
      case 'range':
        return formatDateRange(event.from_date, event.to_date);
      case 'daily':
        return 'Daily Recurring';
      default:
        return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={$.tint_3} />
          <AppText style={[$.mt_medium, $.text_primary5]}>
            Loading event details...
          </AppText>
        </AppView>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center, $.p_large]}>
          <AppText style={[$.fs_medium, $.fw_semibold, $.mb_small, $.text_primary5]}>
            Event Not Found
          </AppText>
          <AppText style={[$.text_tint_3, $.text_center, $.mb_medium]}>
            The event you're looking for doesn't exist.
          </AppText>
          <AppButton
            name="Back to Events"
            onPress={() => navigation.goBack()}
          />
        </AppView>
      </SafeAreaView>
    );
  }

  // Show success message after booking
  if (bookingSuccess) {
    const peopleCount = parseInt(numberOfPeople) || 1;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <AppView style={[$.bg_tint_11, $.flex_1]}>
          <CustomHeader
            title="Booking Confirmed"
            backgroundColor={Colors.light.background}
            titleColor={Colors.light.text}
          />
          <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center, $.p_large]}>
            <CustomIcon
              name={CustomIcons.CheckBox}
              color="#4CAF50"
              size={64}
            />
            <AppText style={[$.fs_large, $.fw_bold, $.mt_medium, $.mb_small, { color: '#4CAF50' }]}>
              Booking Confirmed!
            </AppText>
            <AppText style={[$.text_center, $.mb_medium, $.text_tint_3]}>
              You have successfully booked {peopleCount} slot(s) for{' '}
              <AppText style={[$.fw_semibold]}>{event.event_name}</AppText>.
            </AppText>
            {event.entry_amount > 0 && (
              <AppText style={[$.fs_medium, $.fw_semibold, $.mb_large, $.text_primary5]}>
                Total Amount: ₹{(event.entry_amount * peopleCount).toLocaleString()}
              </AppText>
            )}
            <AppView style={[$.flex_row, { gap: 12 }]}>
              <AppButton
                name="Back to Events"
                onPress={() => navigation.goBack()}
                style={[$.flex_1, $.bg_tint_9]}
                textStyle={[$.text_tint_1]}
              />
              {isLoggedIn && isCustomer && (
                <AppButton
                  name="View My Bookings"
                  onPress={() => {
                    navigation.navigate('HomeTab', { screen: 'UserAppoinment' });
                  }}
                  style={[$.flex_1]}
                />
              )}
            </AppView>
          </AppView>
        </AppView>
      </SafeAreaView>
    );
  }

  const peopleCount = parseInt(numberOfPeople) || 1;
  const maxPeople = event.remainingslot || event.slot_limit || 1;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <AppView style={[$.bg_tint_11, $.flex_1]}>
          <CustomHeader
            title="Book Event"
            backgroundColor={Colors.light.background}
            titleColor={Colors.light.text}
          />
          <ScrollView
            contentContainerStyle={[$.p_small]}
            showsVerticalScrollIndicator={false}>
            {/* Back Button */}
            <TouchableOpacity
              style={[$.mb_small, $.flex_row, $.align_items_center]}
              onPress={() => navigation.goBack()}>
              <CustomIcon
                name={CustomIcons.LeftArrow}
                color={$.tint_1}
                size={20}
              />
              <AppText style={[$.ml_tiny, $.text_tint_1, $.fw_medium]}>
                Back to Events
              </AppText>
            </TouchableOpacity>
            {/* Event Details Card */}
            <AppView
              style={[
                $.mb_small,
                $.p_regular,
                $.border_rounded,
                {
                  backgroundColor: Colors.light.background,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}>
              <AppText style={[$.fs_large, $.fw_bold, $.mb_small, $.text_tint_1]}>
                {event.event_name}
              </AppText>
              <AppView style={[$.flex_row, $.align_items_center, $.mb_small]}>
                <CustomIcon
                  name={CustomIcons.AppointmentCalendar}
                  color={$.tint_3}
                  size={16}
                />
                <AppText style={[$.ml_tiny, $.text_tint_3, $.fs_small]}>
                  {getEventDateDisplay(event)}
                </AppText>
              </AppView>

              {/* Event Image */}
              {eventImageUrl && (
                <AppView style={[$.mb_small, { borderRadius: 8, overflow: 'hidden' }]}>
                  <Image
                    source={{ uri: eventImageUrl }}
                    style={{ width: '100%', height: 200 }}
                    resizeMode="cover"
                  />
                </AppView>
              )}

              {/* Event Description */}
              {event.description && (
                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_semibold, $.mb_tiny, $.text_primary5]}>
                    Description
                  </AppText>
                  <AppText style={[$.text_tint_3, $.fs_small]}>
                    {event.description}
                  </AppText>
                </AppView>
              )}

              {/* Event Details Grid */}
              <AppView style={[$.mb_small]}>
                {event.location && (
                  <AppView style={[$.flex_row, $.align_items_start, $.mb_small]}>
                    <CustomIcon
                      name={CustomIcons.LocationPin}
                      color={$.tint_3}
                      size={16}
                    />
                    <AppView style={[$.ml_tiny, $.flex_1]}>
                      <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
                        Location
                      </AppText>
                      <AppText style={[$.text_tint_3, $.fs_small]}>
                        {event.location}
                      </AppText>
                    </AppView>
                  </AppView>
                )}

                {event.entry_amount > 0 && (
                  <AppView style={[$.flex_row, $.align_items_start, $.mb_small]}>
                    <CustomIcon
                      name={CustomIcons.Cart}
                      color={$.tint_3}
                      size={16}
                    />
                    <AppView style={[$.ml_tiny, $.flex_1]}>
                      <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
                        Entry Amount
                      </AppText>
                      <AppText style={[$.text_tint_3, $.fs_small]}>
                        ₹{event.entry_amount.toLocaleString()} per person
                      </AppText>
                    </AppView>
                  </AppView>
                )}

                <AppView style={[$.flex_row, $.align_items_start, $.mb_small]}>
                  <CustomIcon
                    name={CustomIcons.Shop}
                    color={$.tint_3}
                    size={16}
                  />
                  <AppView style={[$.ml_tiny, $.flex_1]}>
                    <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
                      Available Slots
                    </AppText>
                    <AppText style={[$.text_tint_3, $.fs_small]}>
                      {event.remainingslot || event.slot_limit} / {event.slot_limit} slots
                    </AppText>
                  </AppView>
                </AppView>

                {event.payment_type && (
                  <AppView style={[$.flex_row, $.align_items_start]}>
                    <CustomIcon
                      name={CustomIcons.Cart}
                      color={$.tint_3}
                      size={16}
                    />
                    <AppView style={[$.ml_tiny, $.flex_1]}>
                      <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
                        Payment Type
                      </AppText>
                      <AppText style={[$.text_tint_3, $.fs_small, { textTransform: 'capitalize' }]}>
                        {event.payment_type}
                      </AppText>
                    </AppView>
                  </AppView>
                )}
              </AppView>

              {/* Dress Code */}
              {event.dress_code && (
                <AppView style={[$.pt_small, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                  <AppText style={[$.fs_small, $.text_tint_3]}>
                    <AppText style={[$.fw_semibold]}>Dress Code:</AppText> {event.dress_code}
                  </AppText>
                </AppView>
              )}
            </AppView>

            {/* Booking Form Card */}
            <AppView
              style={[
                $.p_regular,
                $.border_rounded,
                {
                  backgroundColor: Colors.light.background,
                  borderWidth: 2,
                  borderColor: $.tint_1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}>
              <AppText style={[$.fs_medium, $.fw_semibold, $.mb_tiny, $.text_tint_1]}>
                Book Event Slot
              </AppText>
              <AppText style={[$.fs_small, $.text_tint_3, $.mb_medium]}>
                Fill in the details below to book your slot
              </AppText>

              {/* Number of People */}
              <AppView style={[$.mb_small]}>
              <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                Number of People *
              </AppText>
              <AppTextInput
                placeholder="Enter number of people"
                value={numberOfPeople}
                onChangeText={(text) => {
                  // Only allow numbers and limit to max available slots
                  const num = parseInt(text) || 0;
                  if (text === '' || (num >= 1 && num <= maxPeople)) {
                    handleNumberOfPeopleChange(text);
                  }
                }}
                keyboardtype="numeric"
                style={[$.border, $.border_tint_9, $.border_rounded, $.p_small]}
                readonly={isBooking || !event.remainingslot || event.remainingslot === 0}
              />
              <AppText style={[$.fs_tiny, $.text_tint_3, $.mt_tiny]}>
                Available slots: {event.remainingslot || event.slot_limit}
                {maxPeople > 0 && ` (Max: ${maxPeople})`}
              </AppText>
            </AppView>

              {/* Attendee Names (if number_of_people > 1) */}
              {peopleCount > 1 && (
                <AppView style={[$.mb_small]}>
                  <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                    Attendee Names *
                  </AppText>
                  <AppText style={[$.fs_tiny, $.text_tint_3, $.mb_small]}>
                    Please enter names for all {peopleCount} attendee(s)
                  </AppText>
                  {attendeeNames.map((name, index) => (
                    <AppView key={index} style={[$.mb_small]}>
                      <AppText style={[$.fs_small, $.fw_medium, $.mb_tiny, $.text_primary5]}>
                        Person {index + 1} Name *
                      </AppText>
                      <AppTextInput
                        placeholder={`Enter name for person ${index + 1}`}
                        value={name}
                        onChangeText={(text) => handleAttendeeNameChange(index, text)}
                        style={[$.border, $.border_tint_9, $.border_rounded, $.p_small]}
                      />
                    </AppView>
                  ))}
                </AppView>
              )}

              {/* Total Amount */}
              {event.entry_amount > 0 && (
                <AppView
                  style={[
                    $.pt_small,
                    $.mb_small,
                    { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
                  ]}>
                  <AppView style={[$.flex_row, $.justify_content_space_between, $.align_items_center]}>
                    <AppText style={[$.fs_small, $.fw_medium, $.text_primary5]}>
                      Total Amount:
                    </AppText>
                    <AppText style={[$.fs_large, $.fw_bold, $.text_tint_1]}>
                      ₹{(event.entry_amount * peopleCount).toLocaleString()}
                    </AppText>
                  </AppView>
                  <AppText style={[$.fs_tiny, $.text_tint_3, $.mt_tiny]}>
                    ₹{event.entry_amount.toLocaleString()} × {peopleCount} person(s)
                  </AppText>
                </AppView>
              )}

              {/* Login Notice */}
              {!isLoggedIn && (
                <AppView
                  style={[
                    $.pt_small,
                    $.mb_small,
                    $.p_small,
                    $.border_rounded,
                    { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: '#FFF9E6' },
                  ]}>
                  <AppText style={[$.fs_small, $.text_tint_3]}>
                    <AppText style={[$.fw_semibold]}>Note:</AppText> You need to be logged in to confirm your booking.
                    You will be redirected to the login page when you click "Confirm Booking".
                  </AppText>
                </AppView>
              )}

              {/* Action Buttons */}
              <AppView style={[$.flex_row, { gap: 12 }, $.pt_small, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                <AppButton
                  name="Cancel"
                  onPress={() => navigation.goBack()}
                  disabled={isBooking}
                  style={[$.flex_1, $.bg_tint_9]}
                  textStyle={[$.text_tint_1]}
                />
                <AppButton
                  name={isBooking ? 'Booking...' : 'Confirm Booking'}
                  onPress={handleBookEvent}
                  disabled={isBooking || !event.remainingslot || event.remainingslot === 0}
                  isLoading={isBooking}
                  style={[$.flex_1]}
                />
              </AppView>
            </AppView>
          </ScrollView>
        </AppView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

