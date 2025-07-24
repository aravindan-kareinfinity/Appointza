import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {counteractions, selectcounter} from '../../redux/counter.redux';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {ScrollView, SafeAreaView} from 'react-native';

type HomeScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp['navigation']>();
  const route = useRoute<HomeScreenProp['route']>();
  const counter = useAppSelector(selectcounter);
  const dispatch = useAppDispatch();
  const updateCounter = () => {
    dispatch(counteractions.incrementByAmount(1));
  };
  const [textinputvalue, setTextinputvalue] = useState('');
  const [textinputwithiconvalue, setTextinputwithiconvalue] = useState('');
  const [switchvalue, setSwitchvalue] = useState(false);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
      <AppView style={$.p_compact}>
        <AppText style={[$.mb_compact, $.fs_tiny]}>Tiny</AppText>
        <AppText style={[$.mb_compact, $.fs_extrasmall]}>Extrasmall</AppText>
        <AppText style={[$.mb_compact, $.fs_small]}>Small</AppText>
        <AppText style={[$.mb_compact, $.fs_compact]}>Compact</AppText>
        <AppText style={[$.mb_compact, $.fs_regular]}>Regular</AppText>
        <AppText style={[$.mb_compact, $.fs_normal]}>Normal</AppText>
        <AppText style={[$.mb_compact, $.fs_medium]}>Medium</AppText>
        <AppText style={[$.mb_compact, $.fs_big]}>Big</AppText>
        <AppText style={[$.mb_compact, $.fs_large]}>Large</AppText>
        <AppText style={[$.mb_compact, $.fs_huge]}>Huge</AppText>
        <AppText style={[$.mb_compact, $.fs_massive]}>Massive</AppText>
        <AppText style={[$.mb_compact, $.fs_enormous]}>Enormous</AppText>
        <AppText style={[$.mb_compact, $.fs_giant]}>Giant</AppText>
        <AppText style={[$.mb_compact, $.fs_extralarge]}>Extralarge</AppText>
        <AppText style={[$.mb_compact, $.fs_colossal]}>Colossal</AppText>
        <AppTextInput
          style={[$.mb_compact]}
          placeholder="Text Input"
          value={textinputvalue}
          onChangeText={text => setTextinputvalue(text)}
        />
        <AppTextInput
          icon={CustomIcons.AddAccount}
          style={[$.mb_compact]}
          placeholder="Text Input with Icon"
          value={textinputwithiconvalue}
          onChangeText={text => setTextinputwithiconvalue(text)}
        />
        <AppButton
          name="Save"
          style={[$.bg_success, $.mb_compact]}
       
          onPress={() => {}}
        />
        <AppButton
          name="Cancel"
          style={[$.bg_tint_10, $.mb_compact]}
          
          onPress={() => {}}
        />
        <AppView style={[$.flex_row, $.align_items_center]}>
          <AppSwitch
            onValueChange={value => {
              setSwitchvalue(value);
            }}
            value={switchvalue}
          />
          <AppText style={[$.pl_compact]}>Switch</AppText>
        </AppView>
              </AppView>
      </ScrollView>
    </SafeAreaView>
  );
}
