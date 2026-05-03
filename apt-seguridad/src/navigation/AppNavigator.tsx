import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login    from '../screens/Login';
import Register from '../screens/Register';
import TabNavigator from './TabNavigator';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/authContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Tabs" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login"    component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
