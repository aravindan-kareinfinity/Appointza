import {Alert, AlertButton, AlertOptions} from 'react-native';

type AppAlertProps = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
};
export const AppAlert = (props: AppAlertProps) => {
  Alert.alert(
    props.title || 'Fazhar',
    props.message,
    props.buttons,
    props.options,
  );
};
