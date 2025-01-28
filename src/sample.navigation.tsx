import {Button, Text} from '@react-navigation/elements';
import {
  CompositeNavigationProp,
  createNavigationContainerRef,
  NavigationContainer,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {useEffect} from 'react';
import {Image, View} from 'react-native';

type HomeScreenProp = NativeStackScreenProps<RootStackParamList, 'Home'>;
type HomeScreenNavigationProp = HomeScreenProp['navigation'];
type HomeScreenRouteProp = HomeScreenProp['route'];
function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  useEffect(() => {
    if (route.params?.post) {
      // Post updated, do something with `route.params.post`
      // For example, send the post to the server
      console.log('New post: ' + route.params?.post);
    }
  }, [route.params?.post]);
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Home Screen</Text>
      <Button
        onPress={() =>
          navigation.navigate('Details', {
            param: 10,
            name: 'postName',
          })
        }>
        Go to Details
      </Button>
    </View>
  );
}
// const navigationRef = createNavigationContainerRef<RootStackParamList>();
// navigationRef.navigate('Home');
type DetailsScreenProp = NativeStackScreenProps<RootStackParamList, 'Details'>;
type DetailsScreenNavigationProp = DetailsScreenProp['navigation'];
type DetailsScreenRouteProp = DetailsScreenProp['route'];

function DetailsScreen() {
  const navigation = useNavigation<DetailsScreenNavigationProp>();
  const route = useRoute<DetailsScreenRouteProp>();
  const updateParam = () => {
    navigation.setParams({
      param: Math.floor(Math.random() * 100),
    });
  };
  const updateOptions = () => {
    navigation.setOptions({
      title: 'new title',
      headerRight: () => <Button onPress={() => {}}>Update count</Button>,
    });
  };
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text>Details Screen</Text>
      <Button
        onPress={() =>
          navigation.push('Details', {
            param: Math.floor(Math.random() * 100),
            name: 'postName',
          })
        }>
        Go to Details... again {route.params.param.toString()}
      </Button>
      <Button onPress={() => navigation.goBack()}>Go back</Button>
      <Button onPress={() => navigation.popTo('Home', {post: 'postText'})}>
        Go to Home
      </Button>
      <Button onPress={() => navigation.popToTop()}>
        Go back to first screen in stack
      </Button>
    </View>
  );
}

const RootStack = createNativeStackNavigator<RootStackParamList>();

type RootStackParamList = {
  Home?: {
    post: string;
  };
  Details: {
    param: number;
    name: string;
  };
};
function LogoTitle(props: {
  /**
   * The title text of the header.
   */
  children: string;
  /**
   * Tint color for the header.
   */
  tintColor?: string;
}) {
  return (
    <Image
      style={{width: 50, height: 50}}
      source={require('@expo/snack-static/react-native-logo.png')}
    />
  );
}
function RootStackNavigation() {
  return (
    <RootStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <RootStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: props => <LogoTitle {...props} />,
          headerRight: () => <Button onPress={() => {}}>Info</Button>,
          headerBackTitle: 'Custom Back',
          headerBackTitleStyle: {fontSize: 30},
        }}
      />
      <RootStack.Screen
        name="Details"
        component={DetailsScreen}
        initialParams={{param: 42}}
        options={({route}) => ({
          title: route.params.name,
          presentation: 'modal',
        })}
      />
    </RootStack.Navigator>
  );
}

function SampleNavigation() {
  return (
    <NavigationContainer>
      <RootStackNavigation />
    </NavigationContainer>
  );
}

export {SampleNavigation};
