import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getVenues } from '../services/venueService';
import VenueCard from '../components/VenueCard';

const SORT_OPTIONS = [
  { label: 'Name A–Z', value: 'name' },
  { label: 'Name Z–A', value: '-name' },
  { label: 'Newest', value: '-createdAt' },
];

export default function ExploreScreen({ navigate, goBack }) {
  const { token } = useAuth();
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchVenues = useCallback(async () => {
    setError('');
    try {
      const data = await getVenues(token, { search, sort });
      setVenues(data.data);
    } catch (err) {
      setError(err.message || 'Could not load venues. Check your connection.');
      setVenues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sort, token]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const onRefresh = () => { setRefreshing(true); fetchVenues(); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Explore Venues</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name..."
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.sortBtn, sort === opt.value && styles.sortBtnActive]}
              onPress={() => setSort(opt.value)}
            >
              <Text style={[styles.sortTxt, sort === opt.value && styles.sortTxtActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4A7A4A" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchVenues}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(v) => v._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <VenueCard
              venue={item}
              tone="matcha"
              onPress={() => navigate('Venue', { venueId: item._id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTxt}>
                {search ? 'No venues match your search.' : 'No venues available.'}
              </Text>
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
  title: { fontSize: 24, fontWeight: '800', color: '#4A7A4A', paddingTop: 12, marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 10, marginBottom: 10 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0' },
  sortBtnActive: { backgroundColor: '#D9E7CB' },
  sortTxt: { fontSize: 12, color: '#666' },
  sortTxtActive: { color: '#4A7A4A', fontWeight: '700' },
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: '#888', textAlign: 'center', marginTop: 12, marginBottom: 16, lineHeight: 20 },
  retryBtn: { backgroundColor: '#4A7A4A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyTxt: { color: '#aaa', fontSize: 15 },
});
