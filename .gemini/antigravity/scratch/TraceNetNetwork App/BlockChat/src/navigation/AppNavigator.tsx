import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TransferScreen from '../screens/TransferScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import { ActivityIndicator, View } from 'react-native';
import { User } from '../types';

export type RootStackParamList = {
    Main: undefined;
    Register: undefined;
    Transfer: undefined;
    Profile: { user: User };
    Chat: { user: User };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Feed" component={FeedScreen} />
            <Tab.Screen name="Messages" component={ConversationListScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="My Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
                        <Stack.Screen name="Transfer" component={TransferScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
                    </>
                ) : (
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Welcome' }} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
