import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {PINK} from './src/theme';
import CalculatorScreen from './src/screens/CalculatorScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TodayScreen from './src/screens/TodayScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

enableScreens();

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  계산기: 'calculator-variant',
  달력: 'calendar-month',
  오늘: 'star-circle',
  기록: 'notebook-edit',
  설정: 'cog',
};

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={PINK} />
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarActiveTintColor: PINK,
          tabBarInactiveTintColor: '#bbb',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#f0e0e6',
            borderTopWidth: 1,
            paddingBottom: 4,
            height: 58,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
          },
          tabBarIcon: ({color, size}) => (
            <Icon name={ICONS[route.name]} size={size} color={color} />
          ),
        })}>
        <Tab.Screen name="계산기" component={CalculatorScreen} />
        <Tab.Screen name="달력" component={CalendarScreen} />
        <Tab.Screen name="오늘" component={TodayScreen} />
        <Tab.Screen name="기록" component={RecordsScreen} />
        <Tab.Screen name="설정" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
