import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, updateBookingStatus, deleteBooking } from '../services/bookingService';
import BookingCard from '../components/BookingCard';

export default function BookingsScreen() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isManager = user?.role === 'manager';
  const accent = isManager ? '#8B6A4A' : '#4A7A4A';

  const fetchBookings = useCallback(async () => {
    setError('');
    try {
      const data = await getMyBookings(token);
      setBookings(data.data);
    } catch (err) {
      setError(err.message || 'Could not load bookings. Check your connection.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchBookings(); }, [fetchBookings, token]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleStatusChange = async (id, status) => {
    try {
      await updateBookingStatus(id, token, status);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status } : b));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id, token);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={[styles.title, { color: accent }]}>
          {isManager ? 'Customer Bookings' : 'My Bookings'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={accent} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: accent }]} onPress={fetchBookings}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              userRole={user?.role}
              onApprove={() => handleStatusChange(item._id, 'confirmed')}
              onCancel={() => handleStatusChange(item._id, 'cancelled')}
              onRemove={() => handleDelete(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#ddd" />
              <Text style={styles.emptyTxt}>No bookings yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F6F1' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  title: { fontSize: 24, fontWeight: '800', paddingTop: 12 },
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: '#888', textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { color: '#aaa', fontSize: 15 },
});
