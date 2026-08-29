import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFontSize } from '../_layout';

function FontSizeSelector() {
    const { fontScale, setFontScale } = useFontSize();
    const options = [0.9, 1, 1.2, 1.4];

    return (
        <View style={styles.fontSelector}>
            {options.map((option) => {
                const active = Math.abs(option - fontScale) < 0.01;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[styles.fontOption, active && styles.fontOptionActive]}
                        onPress={() => setFontScale(option)}
                    >
                        <Text style={[styles.fontOptionText, active && styles.fontOptionTextActive]}>
                            {option < 1 ? 'A-' : option === 1 ? 'A' : option === 1.2 ? 'A+' : 'A++'}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#ffd33d',
            headerStyle: {
                backgroundColor: '#909396',
            },
            headerShadowVisible: false,
            headerTintColor: '#fff',
            headerRight: () => <FontSizeSelector />,
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

const styles = StyleSheet.create({
    fontSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingRight: 12,
    },
    fontOption: {
        minWidth: 34,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    fontOptionActive: {
        backgroundColor: '#ffd33d',
    },
    fontOptionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    fontOptionTextActive: {
        color: '#1f2937',
    },
});
