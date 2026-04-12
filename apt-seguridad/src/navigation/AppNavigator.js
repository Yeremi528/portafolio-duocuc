import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button } from 'react-native';

import Login from '../screens/Login';
import Main from '../screens/Main';
import Register from '../screens/Register';
import PerfilScreen from '../screens/Profile';
import UploadImageScreen from '../screens/UploadImageScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Profile" component={PerfilScreen}/>
        <Stack.Screen name="Upload" component={UploadImageScreen}/>
        <Stack.Screen 
            name="Main" 
            component={Main} 
            options={({ navigation }) => ({
                headerRight: () => (
                <Button 
                    title="Salir" 
                    onPress={() => navigation.replace('Login')} 
                />
                ),
                title: 'APT Seguridad'
                })}
            />
        
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}