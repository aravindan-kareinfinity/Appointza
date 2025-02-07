import {useEffect, useRef, useState} from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {$} from '../styles';
import {AppView} from './appview.component';
type AppSwitchProps = {
  onValueChange?: (value: boolean) => Promise<void> | void;
  value?: boolean;
};
export const AppSwitch = (props: AppSwitchProps) => {
  const [isOn, setIsOn] = useState(props.value ?? false);
  const animation = useRef(new Animated.Value(props.value ? 1 : 0)).current;
  const movePosition = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 27],
  });
  useEffect(() => {
    Animated.timing(animation, {
      toValue: props.value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsOn(props.value ?? false);
  }, [props.value]);

  // const handlePress = () => {
  //   setIsOn(!isOn);
  //   Animated.timing(animation, {
  //     toValue: props.value ? 1 : 0,
  //     duration: 200,
  //     useNativeDriver: true,
  //   }).start();
  // };
  const handlePress = () => {
    props.onValueChange?.(!props.value);
  };

  return (
    // <Switch
    //   trackColor={{false: $.muted, true: $.primaryshade}}
    //   thumbColor={$.primary}
    //   ios_backgroundColor="#3e3e3e"
    //   onValueChange={props.onValueChange}
    //   value={props.value}
    // />
    <TouchableOpacity
      hitSlop={20}
      activeOpacity={1}
      onPress={handlePress}
      style={[
        $.border_tint_6,
        $.flex_row,
        $.align_items_center,
        isOn ? {borderColor: 'none', backgroundColor: $.tint_9} : $.border,
        {
          width: 54,
          height: 26,
          borderRadius: 30,
          padding: 4,
        },
      ]}>
      <AppView>
        <Animated.View
          style={[
            $.bg_tint_2,
            {
              width: 18,
              height: 18,
              borderRadius: 34,
              backgroundColor: $.tint_2,
              transform: [{translateX: movePosition}],
            },
          ]}
        />
      </AppView>
    </TouchableOpacity>
  );
};
