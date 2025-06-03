import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { CustomIcon, CustomIcons } from './customicons.component';
import { $ } from '../styles';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  onBackPress?: () => void;
}

export function CustomHeader({
  title,
  showBackButton = false,
  rightComponent,
  backgroundColor = Colors.light.background,
  titleColor = Colors.light.text,
  onBackPress,
}: CustomHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor,
        paddingTop: Platform.OS === 'ios' ? insets.top : 0,
      }
    ]}>
      <View style={[$.my_small, styles.content]}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={$.tint_2} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text 
          style={[styles.title, { color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    zIndex: 10,
  },
  content: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 8,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
});