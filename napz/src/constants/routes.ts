export const ROUTES = {
  root: {
    googleAuth: 'GoogleAuth',
    main: 'Main',
  },
  tabs: {
    tracking: 'Tracking',
    rideEstimate: 'RideEstimate',
    saved: 'Saved',
    trip: 'Trip',
    account: 'Account',
  },
  trip: {
    planner: 'TripPlanner',
    itinerary: 'TripItinerary',
    mine: 'MyTrips',
  },
  track: {
    home: 'Home',
    alarm: 'Alarm',
  },
  account: {
    home: 'AccountHome',
    about: 'About',
    subscription: 'Subscription',
    sounds: 'Sounds',
    privacyPolicy: 'PrivacyPolicy',
    upgrade: 'Upgrade',
  },
} as const;
