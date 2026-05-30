import { useState, useEffect, useContext } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { requestPermissions } from './services/notificationService';
import AuthScreen    from './screens/AuthScreen';
import ExploreScreen from './screens/ExploreScreen';
import VenueScreen   from './screens/VenueScreen';
import BookingsScreen from './screens/BookingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const TABS = [
  { name: 'Explore',  icon: 'compass'  },
  { name: 'Bookings', icon: 'calendar' },
  { name: 'Profile',  icon: 'person'   },
];

function MainApp() {
  const { user } = useContext(AuthContext);
  const isManager = user?.role === 'manager';
  const activeColor = isManager ? '#8B6A4A' : '#4A7A4A';

  const [stack, setStack] = useState([{ name: 'Explore', params: {} }]);

  useEffect(() => { requestPermissions(); }, []);

  const current = stack[stack.length - 1];
  const currentTab = TABS.find(t => t.name === current.name)?.name ?? TABS[0].name;

  const navigate = (name, params = {}) => setStack(s => [...s, { name, params }]);
  const goBack   = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const switchTab = (name) => setStack([{ name, params: {} }]);

  const screenProps = { navigate, goBack };

  const renderScreen = () => {
    switch (current.name) {
      case 'Venue':    return <VenueScreen    {...screenProps} {...current.params} />;
      case 'Bookings': return <BookingsScreen {...screenProps} />;
      case 'Profile':  return <ProfileScreen  {...screenProps} />;
      default:         return <ExploreScreen  {...screenProps} />;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>
        {renderScreen()}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = currentTab === tab.name;
          return (
            <Pressable key={tab.name} style={styles.tabItem} onPress={() => switchTab(tab.name)}>
              <Ionicons
                name={active ? tab.icon : `${tab.icon}-outline`}
                size={24}
                color={active ? activeColor : '#aaa'}
              />
              <Text style={[styles.tabLabel, { color: active ? activeColor : '#aaa' }]}>
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Root() {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <MainApp /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F7F6F1' },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingBottom: 24, // notch clearance
  },
  tabItem:  { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
});
