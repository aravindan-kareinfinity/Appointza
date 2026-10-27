import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Animated, Dimensions, Vibration, NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { setActiveTracking, setTriggered } from '../../services/storage/trackingStorage';
import { stopBackgroundTracking } from '../../services/alarm/backgroundTracking';
import { TrackingServiceAPI } from '../../services/native/TrackingServiceModule';
import { ANDROID_APPLICATION_ID } from '../../constants/androidApplicationId';
const { SoundModule } = NativeModules;
const { width } = Dimensions.get('window');

const soundAssets: Record<string, string> = {
  classic: `android.resource://${ANDROID_APPLICATION_ID}/raw/classic`,
  radar:   `android.resource://${ANDROID_APPLICATION_ID}/raw/radar`,
  beacon:  `android.resource://${ANDROID_APPLICATION_ID}/raw/beacon`,
  gentle:  `android.resource://${ANDROID_APPLICATION_ID}/raw/gentle`,
  urgent:  `android.resource://${ANDROID_APPLICATION_ID}/raw/urgent`,
};

type AlarmScreenNavigationProp = NativeStackNavigationProp<any>;

export default function AlarmScreen() {
  const navigation = useNavigation<AlarmScreenNavigationProp>();
  const route = useRoute<any>();
  const { destinationName, triggeredByService = false } = route.params ?? {};

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Entry animations
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();

    // Clear tracking state
    setTriggered(null).catch(() => {});
    setActiveTracking(null).catch(() => {});
    stopBackgroundTracking().catch(() => {});

    if (triggeredByService) {
      // Native service already plays sound + vibration — nothing to do in JS
    } else {
      // App was open when alarm fired; native service was already stopped by HomeScreen.
      // Play sound and vibration from JS layer.
      startJsAlarm();
    }

    return () => {
      stopJsAlarm();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startJsAlarm = async () => {
    try {
      let soundUri = soundAssets.classic;
      const selected = await AsyncStorage.getItem('alarmSound');
      if (selected === 'custom') {
        const uri = await AsyncStorage.getItem('customSoundUri');
        if (uri) soundUri = uri;
      } else if (selected && soundAssets[selected]) {
        soundUri = soundAssets[selected];
      }
      if (SoundModule) await SoundModule.playSound(soundUri);
    } catch {}

    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 300, 500], true);
    }
  };

  const stopJsAlarm = () => {
    try { SoundModule?.stopSound(); } catch {}
    Vibration.cancel();
  };

  const handleStop = () => {
    // Stop native service (stops native sound + vibration if triggered from background)
    TrackingServiceAPI.stopTrackingService().catch(() => {});
    // Stop JS alarm if it was playing
    stopJsAlarm();
    // Navigate back to Home
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const bgOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const iconScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.bgPulse, { opacity: bgOpacity }]} />

      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <View style={styles.iconCircle}>
              <Icon name="alarm" size={56} color="#FFF" />
            </View>
          </Animated.View>
        </Animated.View>

        <Text style={styles.title}>YOU'VE ARRIVED!</Text>
        <Text style={styles.subtitle} numberOfLines={3}>
          {destinationName || 'Destination'}
        </Text>

        <TouchableOpacity
          testID="stop-alarm-button"
          style={styles.stopButton}
          onPress={handleStop}
          activeOpacity={0.9}
        >
          <Text style={styles.stopButtonText}>STOP ALARM</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF2A2A' },
  bgPulse: { backgroundColor: '#FF2A2A' },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: { marginBottom: 28 },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 32, fontWeight: '900', color: '#FFF',
    letterSpacing: 3, marginBottom: 10, textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', marginBottom: 48, lineHeight: 22,
    maxWidth: width * 0.8,
  },
  stopButton: {
    width: '100%', maxWidth: 300, height: 68,
    backgroundColor: '#FFF', borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  } as any,
  stopButtonText: {
    fontSize: 20, fontWeight: '900', color: '#FF2A2A',
    letterSpacing: 3,
  },
});
