import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#ffd33d',
            headerStyle: {
                backgroundColor: '#909396',
            },
            headerShadowVisible: false,
            headerTintColor: '#fff',
            tabBarStyle: {
                backgroundColor: '#b2b6bb',
            },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24} />
                    ),
                }}
            />
        </Tabs>
    );
}
