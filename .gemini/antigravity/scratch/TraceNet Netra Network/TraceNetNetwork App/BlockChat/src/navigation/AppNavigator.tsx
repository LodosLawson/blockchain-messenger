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
import DebugScreen from '../screens/DebugScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import { ActivityIndicator, View, Text } from 'react-native';
import { User } from '../types';
import { NetraTheme, Colors } from '../theme/NetraTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationProvider } from '../context/NotificationContext';

const Stack = createNativeStackNavigator<{
    Register: undefined;
    Main: undefined;
    Transfer: { recipientWallet?: string };
    Profile: { nickname?: string; wallet_id?: string; user?: any };
    Chat: { user: User };
    Debug: undefined;
}>();

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: Colors.TraceEmerald,
                tabBarInactiveTintColor: Colors.MutedText,
                tabBarStyle: {
                    backgroundColor: Colors.DeepVoid,
                    borderTopColor: Colors.SubtleBorder,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    fontFamily: 'monospace',
                },
                headerStyle: {
                    backgroundColor: Colors.DeepVoid,
                    borderBottomColor: Colors.SubtleBorder,
                    borderBottomWidth: 1,
                },
                headerTintColor: Colors.TraceEmerald,
                headerTitleStyle: {
                    fontWeight: '700',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                    title: 'Home',
                }}
            />
            <Tab.Screen
                name="Feed"
                component={FeedScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="layers-outline" size={size} color={color} />
                    ),
                    title: 'Feed',
                }}
            />
            <Tab.Screen
                name="Messages"
                component={ConversationListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
                    ),
                    title: 'Messages',
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search-outline" size={size} color={color} />
                    ),
                    title: 'Search',
                }}
            />
            <Tab.Screen
                name="My Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
                    ),
                    title: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.DeepVoid }}>
                <ActivityIndicator size="large" color={Colors.TraceEmerald} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={NetraTheme}>
            <NotificationProvider>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: Colors.DeepVoid,
                        },
                        headerTintColor: Colors.TraceEmerald,
                        headerTitleStyle: {
                            fontWeight: '700',
                        },
                        contentStyle: {
                            backgroundColor: Colors.DeepVoid,
                        }
                    }}
                >
                    {user ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
                            <Stack.Screen
                                name="Transfer"
                                component={TransferScreen}
                                options={{ title: '💸 Send Money' }}
                            />
                            <Stack.Screen
                                name="Profile"
                                component={ProfileScreen}
                                options={{ title: '👤 Profile' }}
                            />

                            <Stack.Screen
                                name="Chat"
                                component={ChatScreen}
                                options={{ title: '💬 Chat' }}
                            />
                            <Stack.Screen
                                name="Debug"
                                component={DebugScreen}
                                options={{ title: '🔧 Debug' }}
                            />
                        </>
                    ) : (
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '🌐 Welcome to BlockChat' }} />
                    )}
                </Stack.Navigator>
            </NotificationProvider>
        </NavigationContainer>
    );
}
