// import React, {useState, useEffect, useRef} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Animated,
//   TouchableWithoutFeedback,
// } from 'react-native';

// type props = {
//   message: string;
//   visible: boolean;
//   onClose: () => void;
// };
// export const AppAlertV2 = (props: props) => {
//   const slideAnim = useRef(new Animated.Value(100)).current;
//   console.log('inside');
//   useEffect(() => {
//     if (props.visible) {
//       // Slide up
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();

//       // Auto-hide after 3 seconds
//       const timer = setTimeout(() => {
//         props.onClose();
//       }, 3000);

//       return () => clearTimeout(timer);
//     } else {
//       // Slide down
//       Animated.timing(slideAnim, {
//         toValue: 100,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [props.visible, slideAnim, props.onClose]);

//   return (
//     <Animated.View
//       style={[styles.alertContainer, {transform: [{translateY: slideAnim}]}]}>
//       <TouchableWithoutFeedback onPress={props.onClose}>
//         <View style={styles.alertContent}>
//           {/* <Ionicons name={icon} size={24} color="white" style={styles.icon} /> */}
//           <Text style={styles.message}>{props.message}</Text>
//         </View>
//       </TouchableWithoutFeedback>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   alertContainer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#333',
//     padding: 10,
//     zIndex: 1000,
//   },
//   alertContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   icon: {
//     marginRight: 10,
//   },
//   message: {
//     color: 'white',
//     fontSize: 16,
//   },
// });

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

// Alert Context
const AlertContext = createContext<{
  showAlert: (message: string) => void;
}>({showAlert: () => {}});

export const useAlert = () => useContext(AlertContext);

const AlertProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(100)).current;

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  useEffect(() => {
    if (alertVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100, // Slide down before hiding
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Wait for animation to complete before hiding
          setAlertVisible(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alertVisible, slideAnim]);

  return (
    <AlertContext.Provider value={{showAlert}}>
      {children}
      {alertVisible && (
        <Animated.View
          style={[
            styles.alertContainer,
            {transform: [{translateY: slideAnim}]},
          ]}>
          <TouchableWithoutFeedback onPress={() => setAlertVisible(false)}>
            <View style={styles.alertContent}>
              <Text style={styles.message}>{alertMessage}</Text>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </AlertContext.Provider>
  );
};

// Styles for the alert
const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContent: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AlertProvider;
