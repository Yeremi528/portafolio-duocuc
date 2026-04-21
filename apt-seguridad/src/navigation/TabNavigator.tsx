import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/Colors';

import AnalysisScreen from '../screens/tabs/AnalysisScreen';
import HistoryScreen from '../screens/tabs/HistoryScreen';
import RisksScreen from '../screens/tabs/RisksScreen';
import ProfileTabScreen from '../screens/tabs/ProfileTabScreen';

type TabParamList = {
  Análisis: undefined;
  Historial: undefined;
  Riesgos: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { active: IoniconName; inactive: IoniconName }> = {
  'Análisis':  { active: 'analytics',      inactive: 'analytics-outline' },
  'Historial': { active: 'time',           inactive: 'time-outline' },
  'Riesgos':   { active: 'warning',        inactive: 'warning-outline' },
  'Perfil':    { active: 'person',         inactive: 'person-outline' },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Análisis"  component={AnalysisScreen} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Riesgos"   component={RisksScreen} />
      <Tab.Screen name="Perfil"    component={ProfileTabScreen} />
    </Tab.Navigator>
  );
}
