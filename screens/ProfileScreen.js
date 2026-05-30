import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../services/authService';
import { getVenues, createVenue } from '../services/venueService';
import VenueCard from '../components/VenueCard';

const HOUR_OPTIONS = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

export default function ProfileScreen({ navigate, goBack }) {
  const { user, logout, token } = useAuth();
  const [profile, setProfile] = useState(user);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [creating, setCreating] = useState(false);

  const isManager = user?.role === 'manager';
  const accent = isManager ? '#8B6A4A' : '#4A7A4A';
  const bg = isManager ? '#F8F3EE' : '#F4F8EF';

  const fetchVenues = useCallback(async () => {
    if (!isManager) { setLoading(false); return; }
    setError('');
    try {
      const data = await getVenues(token, { manager: 'me' });
      setVenues(data.data);
    } catch (err) {
      setError(err.message || 'Could not load venues. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isManager, token]);

  useEffect(() => {
    if (!token) return;
    getMe(token).then(d => setProfile(d.data)).catch(() => {});
  }, [token]);

  useEffect(() => { if (user) fetchVenues(); }, [user, fetchVenues]);

  const onRefresh = () => {
    setRefreshing(true);
    getMe(token).then(d => setProfile(d.data)).catch(() => {});
    fetchVenues();
  };

  const handleCreateVenue = async () => {
    if (!venueName || !venueAddress) { Alert.alert('Required', 'Name and address are required.'); return; }
    setCreating(true);
    try {
      const data = await createVenue(token, { name: venueName, address: venueAddress, openTime, closeTime });
      setVenues((prev) => [...prev, data.data]);
      setCreateOpen(false);
      setVenueName(''); setVenueAddress(''); setOpenTime('09:00'); setCloseTime('22:00');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={[styles.title, { color: accent }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: isManager ? '#E3C9B0' : '#C8E0B4' }]}>
            <Text style={[styles.avatarLetter, { color: accent }]}>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{profile?.name || 'GameOn User'}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: isManager ? '#E3C9B0' : '#C8E0B4' }]}>
              <Text style={[styles.roleText, { color: accent }]}>{profile?.role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {isManager && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: accent }]}>My Venues</Text>
              <Pressable style={[styles.addBtn, { backgroundColor: accent }]} onPress={() => setCreateOpen(true)}>
                <Text style={styles.addBtnTxt}>+ Add Venue</Text>
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            ) : venues.length === 0 ? (
              <Text style={styles.emptyTxt}>You haven't listed any venues yet.</Text>
            ) : (
              venues.map((venue) => (
                <VenueCard
                  key={venue._id}
                  venue={venue}
                  tone="earth"
                  onPress={() => navigate('Venue', { venueId: venue._id, manage: true })}
                />
              ))
            )}
          </View>
        )}

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#C0392B" />
          <Text style={styles.logoutTxt}>Logout</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCreateOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Venue</Text>
            <Pressable onPress={() => setCreateOpen(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Venue Name</Text>
            <TextInput style={styles.fieldInput} value={venueName} onChangeText={setVenueName} placeholder="e.g. City Sports Hub" />

            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={styles.fieldInput} value={venueAddress} onChangeText={setVenueAddress} placeholder="123 Main St, Brisbane" />

            <Text style={styles.fieldLabel}>Opening Hours</Text>
            <View style={styles.hoursRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Open</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {HOUR_OPTIONS.slice(0, 10).map((h) => (
                    <Pressable
                      key={h}
                      style={[styles.hourBtn, openTime === h && styles.hourBtnActive]}
                      onPress={() => setOpenTime(h)}
                    >
                      <Text style={[styles.hourTxt, openTime === h && styles.hourTxtActive]}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.hoursRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Close</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {HOUR_OPTIONS.slice(4).map((h) => (
                    <Pressable
                      key={h}
                      style={[styles.hourBtn, closeTime === h && styles.hourBtnActive]}
                      onPress={() => setCloseTime(h)}
                    >
                      <Text style={[styles.hourTxt, closeTime === h && styles.hourTxtActive]}>{h}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable
              style={[styles.submitBtn, { backgroundColor: accent }]}
              onPress={handleCreateVenue}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Create Venue</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F6F1' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  title: { fontSize: 24, fontWeight: '800', paddingTop: 12 },
  content: { padding: 16, paddingBottom: 40 },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, borderWidth: 1, borderColor: '#E5E5E5' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 24, fontWeight: '800' },
  userName: { fontSize: 17, fontWeight: '700', color: '#333' },
  userEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  roleBadge: { marginTop: 6, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: '700' },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  errorBanner: { backgroundColor: '#FDECEA', borderRadius: 10, padding: 12 },
  errorTxt: { color: '#C0392B', fontSize: 13 },
  emptyTxt: { color: '#aaa', fontSize: 14, textAlign: 'center', padding: 20 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, padding: 14 },
  logoutTxt: { color: '#C0392B', fontSize: 15, fontWeight: '600' },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  subLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  fieldInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  hoursRow: { marginBottom: 8 },
  hourBtn: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginTop: 4 },
  hourBtnActive: { backgroundColor: '#D9E7CB', borderColor: '#4A7A4A' },
  hourTxt: { fontSize: 13, color: '#666' },
  hourTxtActive: { color: '#4A7A4A', fontWeight: '700' },
  submitBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
