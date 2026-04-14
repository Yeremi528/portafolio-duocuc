import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import Main from '../screens/Main';
import Register from '../screens/Register';
import PerfilScreen from '../screens/Profile';
import UploadImageScreen from '../screens/UploadImageScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Profile" component={PerfilScreen} />
        <Stack.Screen name="Upload" component={UploadImageScreen} />
        <Stack.Screen
          name="Main"
          component={Main}
          options={({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) => ({
            headerRight: () => (
              <Button
                title="Salir"
                onPress={() => navigation.replace('Login')}
              />
            ),
            title: 'APT Seguridad',
          })}
        />
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
