export type RootStackParamList = {
  GoogleAuth: undefined;
  Main: undefined;
};

export type TrackStackParamList = {
  Home: {
    savedPlace?: {
      name: string;
      lat: number;
      lng: number;
      radius?: number;
    };
  } | undefined;
  Alarm: {
    destinationName?: string;
    triggeredByService?: boolean;
  };
};

export type AccountStackParamList = {
  AccountHome: undefined;
  About: undefined;
  Subscription: undefined;
  Sounds: undefined;
  PrivacyPolicy: undefined;
  Upgrade: undefined;
};

export type RideEstimateTabParams = {
  destination?: {
    name: string;
    lat: number;
    lng: number;
  };
};

export type TripStackParamList = {
  TripPlanner: undefined;
  TripItinerary: undefined;
  MyTrips: undefined;
};

export type MainTabParamList = {
  Tracking:
    | {
        screen?: keyof TrackStackParamList;
        params?: TrackStackParamList[keyof TrackStackParamList];
      }
    | undefined;
  RideEstimate: RideEstimateTabParams | undefined;
  Trip: undefined;
  Saved: undefined;
  Account: undefined;
};
