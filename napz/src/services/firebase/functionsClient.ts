import functions from '@react-native-firebase/functions';

/** Cloud Functions are deployed in asia-south1. */
export function napzFunctions() {
  return functions().app.functions('asia-south1');
}
