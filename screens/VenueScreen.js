import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
  Image, Modal, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getVenue, updateVenue, deleteVenue, uploadVenueLogo, getVenueLogoUrl } from '../services/venueService';
import { getSpaces, createSpace, updateSpace, deleteSpace } from '../services/spaceService';
import { createBooking } from '../services/bookingService';
import { notifyBookingConfirmed } from '../services/notificationService';

let ImagePicker = null;
try { ImagePicker = require('expo-image-picker'); } catch { /* not available in Expo Go */ }

let DateTimePicker = null;
try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch { /* not available */ }

const buildTimeSlots = (openTime = '09:00', closeTime = '22:00') => {
  const start = parseInt(openTime.split(':')[0], 10);
  const end = parseInt(closeTime.split(':')[0], 10);
  if (isNaN(start) || isNaN(end) || end <= start) return [];
  return Array.from({ length: end - start }, (_, i) => {
    const s = String(start + i).padStart(2, '0');
    const e = String(start + i + 1).padStart(2, '0');
    return `${s}:00-${e}:00`;
  });
};

export default function VenueScreen({ venueId, manage = false, navigate, goBack }) {
  const { token, user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookingDates, setBookingDates] = useState({});
  const [bookingSlots, setBookingSlots] = useState({});
  const [datePickerSpace, setDatePickerSpace] = useState(null);
  const [pendingDate, setPendingDate] = useState(new Date());
  const [bookingLoading, setBookingLoading] = useState(null);

  const [editVenueOpen, setEditVenueOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueOpen, setVenueOpen] = useState('09:00');
  const [venueClose, setVenueClose] = useState('22:00');
  const [venueLoading, setVenueLoading] = useState(false);

  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [spaceName, setSpaceName] = useState('');
  const [sportType, setSportType] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [spaceStatus, setSpaceStatus] = useState('available');
  const [spaceLoading, setSpaceLoading] = useState(false);

  const isManager = user?.role === 'manager';
  const currentUserId = user?._id || user?.id;
  const venueManagerId = venue?.manager?._id || venue?.manager;
  const isOwner = isManager && currentUserId && venueManagerId && String(currentUserId) === String(venueManagerId);
  const canManage = isOwner && manage;

  const accent = canManage ? '#8B6A4A' : '#4A7A4A';
  const bg = canManage ? '#F8F3EE' : '#F4F8EF';

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [venueData, spacesData] = await Promise.all([
        getVenue(venueId, token),
        getSpaces(venueId, token),
      ]);
      setVenue(venueData.data);
      setSpaces(spacesData.data);
    } catch (err) {
      setError(err.message || 'Could not load venue. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [venueId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadLogo = async () => {
    if (!ImagePicker) {
      Alert.alert('Dev Build Required', 'Camera access requires npx expo run:ios — not available in Expo Go.');
      return;
    }
    Alert.alert('Upload Logo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission denied'); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) await doUpload(result.assets[0].uri);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission denied'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) await doUpload(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const doUpload = async (uri) => {
    try {
      await uploadVenueLogo(venueId, token, uri);
      await fetchData();
      Alert.alert('Success', 'Logo updated!');
    } catch (err) {
      Alert.alert('Upload Failed', err.message);
    }
  };

  const handleBook = async (space) => {
    const date = bookingDates[space._id];
    const slot = bookingSlots[space._id];
    if (!date || !slot) { Alert.alert('Missing details', 'Please select a date and time slot.'); return; }

    setBookingLoading(space._id);
    try {
      await createBooking(token, { venue: venueId, space: space._id, bookingDate: date, timeSlot: slot });
      await notifyBookingConfirmed({ venueName: venue.name, spaceName: space.name, date, timeSlot: slot });
      Alert.alert('Booking Confirmed!', `${space.name} booked for ${date} at ${slot}.`);
      setBookingDates(p => { const n = { ...p }; delete n[space._id]; return n; });
      setBookingSlots(p => { const n = { ...p }; delete n[space._id]; return n; });
      navigate('Bookings');
    } catch (err) {
      Alert.alert('Booking Failed', err.message);
    } finally {
      setBookingLoading(null);
    }
  };

  const openEditVenue = () => {
    setVenueName(venue.name);
    setVenueAddress(venue.address);
    setVenueOpen(venue.openTime || '09:00');
    setVenueClose(venue.closeTime || '22:00');
    setEditVenueOpen(true);
  };

  const handleSaveVenue = async () => {
    setVenueLoading(true);
    try {
      const data = await updateVenue(venueId, token, { name: venueName, address: venueAddress, openTime: venueOpen, closeTime: venueClose });
      setVenue(data.data);
      setEditVenueOpen(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setVenueLoading(false);
    }
  };

  const handleDeleteVenue = () => {
    Alert.alert('Delete Venue', 'This will permanently delete the venue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteVenue(venueId, token); goBack(); }
        catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const openAddSpace = () => {
    setEditingSpace(null);
    setSpaceName(''); setSportType(''); setPricePerHour(''); setSpaceStatus('available');
    setSpaceModalOpen(true);
  };

  const openEditSpace = (space) => {
    setEditingSpace(space);
    setSpaceName(space.name); setSportType(space.sportType);
    setPricePerHour(String(space.pricePerHour)); setSpaceStatus(space.status);
    setSpaceModalOpen(true);
  };

  const handleSaveSpace = async () => {
    if (!spaceName || !sportType || !pricePerHour) { Alert.alert('Missing fields', 'Name, sport type and price are required.'); return; }
    setSpaceLoading(true);
    try {
      const body = { name: spaceName, sportType, pricePerHour: parseFloat(pricePerHour), status: spaceStatus };
      if (editingSpace) {
        const data = await updateSpace(venueId, editingSpace._id, token, body);
        setSpaces(p => p.map(s => s._id === editingSpace._id ? data.data : s));
      } else {
        const data = await createSpace(venueId, token, body);
        setSpaces(p => [...p, data.data]);
      }
      setSpaceModalOpen(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSpaceLoading(false);
    }
  };

  const handleDeleteSpace = (space) => {
    Alert.alert('Delete Space', `Delete "${space.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteSpace(venueId, space._id, token); setSpaces(p => p.filter(s => s._id !== space._id)); }
        catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator size="large" color="#4A7A4A" /></SafeAreaView>;

  if (error || !venue) return (
    <SafeAreaView style={[styles.safe, styles.center]}>
      <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
      <Text style={styles.errorText}>{error || 'Venue not found.'}</Text>
      <Pressable style={styles.retryBtn} onPress={fetchData}><Text style={styles.retryTxt}>Retry</Text></Pressable>
    </SafeAreaView>
  );

  const timeSlots = buildTimeSlots(venue.openTime, venue.closeTime);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar style="dark" />
      <View style={styles.navBar}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={accent} />
        </Pressable>
        <Text style={[styles.navTitle, { color: accent }]} numberOfLines={1}>{venue.name}</Text>
        {canManage && (
          <Pressable onPress={handleDeleteVenue} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#C0392B" />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.venueCard}>
          <View style={styles.venueHeaderRow}>
            {venue.logo && venue.logo !== 'no-photo.jpg' ? (
              <Image source={{ uri: getVenueLogoUrl(venue._id) }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: canManage ? '#E3C9B0' : '#C8E0B4' }]}>
                <Text style={[styles.logoLetter, { color: accent }]}>{venue.name.charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.venueName, { color: accent }]}>{venue.name}</Text>
              <Text style={styles.venueAddress}>{venue.address}</Text>
              <Text style={styles.venueHours}>Open {venue.openTime} – {venue.closeTime}</Text>
            </View>
          </View>

          {canManage && (
            <View style={styles.manageActions}>
              <Pressable style={[styles.actionBtn, { borderColor: accent }]} onPress={handleUploadLogo}>
                <Ionicons name="camera-outline" size={16} color={accent} />
                <Text style={[styles.actionTxt, { color: accent }]}>Upload Logo</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: accent }]} onPress={openEditVenue}>
                <Ionicons name="pencil-outline" size={16} color={accent} />
                <Text style={[styles.actionTxt, { color: accent }]}>Edit Venue</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spaces</Text>
          {canManage && (
            <Pressable style={[styles.addSpaceBtn, { backgroundColor: accent }]} onPress={openAddSpace}>
              <Text style={styles.addSpaceTxt}>+ Add Space</Text>
            </Pressable>
          )}
        </View>

        {spaces.length === 0 ? (
          <View style={styles.emptySpaces}><Text style={styles.emptyTxt}>No spaces added yet.</Text></View>
        ) : (
          spaces.map(space => (
            <View key={space._id} style={styles.spaceCard}>
              <View style={styles.spaceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spaceName}>{space.name}</Text>
                  <Text style={styles.sportType}>{space.sportType}</Text>
                  <Text style={styles.price}>${space.pricePerHour}/hr</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: space.status === 'maintenance' ? '#FDECEA' : '#E8F5E9' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: space.status === 'maintenance' ? '#C0392B' : '#4A7A4A', textTransform: 'capitalize' }}>
                    {space.status}
                  </Text>
                </View>
              </View>

              {canManage ? (
                <View style={styles.spaceActions}>
                  <Pressable style={[styles.spaceBtn, { borderColor: accent }]} onPress={() => openEditSpace(space)}>
                    <Text style={[styles.spaceBtnTxt, { color: accent }]}>Edit</Text>
                  </Pressable>
                  <Pressable style={[styles.spaceBtn, { borderColor: '#C0392B' }]} onPress={() => handleDeleteSpace(space)}>
                    <Text style={[styles.spaceBtnTxt, { color: '#C0392B' }]}>Delete</Text>
                  </Pressable>
                </View>
              ) : user?.role === 'player' && space.status === 'available' ? (
                <View style={styles.bookingArea}>
                  <Pressable
                    style={styles.datePicker}
                    onPress={() => {
                      setPendingDate(bookingDates[space._id] ? new Date(bookingDates[space._id]) : new Date());
                      setDatePickerSpace(space._id);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#555" />
                    <Text style={styles.datePickerTxt}>{bookingDates[space._id] || 'Select date'}</Text>
                  </Pressable>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotList}>
                    {timeSlots.map(slot => (
                      <Pressable
                        key={slot}
                        style={[styles.slotBtn, bookingSlots[space._id] === slot && styles.slotBtnActive]}
                        onPress={() => setBookingSlots(p => ({ ...p, [space._id]: slot }))}
                      >
                        <Text style={[styles.slotTxt, bookingSlots[space._id] === slot && styles.slotTxtActive]}>{slot}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Pressable
                    style={[styles.bookBtn, (!bookingDates[space._id] || !bookingSlots[space._id]) && styles.bookBtnDisabled]}
                    onPress={() => handleBook(space)}
                    disabled={!bookingDates[space._id] || !bookingSlots[space._id] || bookingLoading === space._id}
                  >
                    {bookingLoading === space._id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.bookBtnTxt}>Book Now</Text>
                    }
                  </Pressable>
                </View>
              ) : !user ? (
                <Text style={styles.loginHint}>Login to book this space.</Text>
              ) : (
                <Text style={styles.loginHint}>Managers cannot book spaces.</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={editVenueOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVenueOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Venue</Text>
            <Pressable onPress={() => setEditVenueOpen(false)}><Ionicons name="close" size={24} color="#333" /></Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Venue Name</Text>
            <TextInput style={styles.fieldInput} value={venueName} onChangeText={setVenueName} />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={styles.fieldInput} value={venueAddress} onChangeText={setVenueAddress} />
            <Text style={styles.fieldLabel}>Open Time (HH:00)</Text>
            <TextInput style={styles.fieldInput} value={venueOpen} onChangeText={setVenueOpen} placeholder="09:00" />
            <Text style={styles.fieldLabel}>Close Time (HH:00)</Text>
            <TextInput style={styles.fieldInput} value={venueClose} onChangeText={setVenueClose} placeholder="22:00" />
            <Pressable style={[styles.bookBtn, { marginTop: 24 }]} onPress={handleSaveVenue} disabled={venueLoading}>
              {venueLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnTxt}>Save Changes</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={spaceModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSpaceModalOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingSpace ? 'Edit Space' : 'Add Space'}</Text>
            <Pressable onPress={() => setSpaceModalOpen(false)}><Ionicons name="close" size={24} color="#333" /></Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Space Name</Text>
            <TextInput style={styles.fieldInput} value={spaceName} onChangeText={setSpaceName} placeholder="e.g. Centre Court" />
            <Text style={styles.fieldLabel}>Sport Type</Text>
            <TextInput style={styles.fieldInput} value={sportType} onChangeText={setSportType} placeholder="e.g. Basketball" />
            <Text style={styles.fieldLabel}>Price per Hour ($)</Text>
            <TextInput style={styles.fieldInput} value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" placeholder="0" />
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.roleRow}>
              {['available', 'maintenance'].map(s => (
                <Pressable key={s} style={[styles.roleBtn, spaceStatus === s && styles.roleBtnActive]} onPress={() => setSpaceStatus(s)}>
                  <Text style={[styles.roleTxt, spaceStatus === s && styles.roleTxtActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.bookBtn, { marginTop: 24 }]} onPress={handleSaveSpace} disabled={spaceLoading}>
              {spaceLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnTxt}>{editingSpace ? 'Save Space' : 'Add Space'}</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={datePickerSpace !== null} transparent animationType="slide" onRequestClose={() => setDatePickerSpace(null)}>
        <View style={styles.dpOverlay}>
          <View style={styles.dpSheet}>
            <View style={styles.dpHeader}>
              <Pressable onPress={() => setDatePickerSpace(null)}>
                <Text style={styles.dpCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.dpTitle}>Select Date</Text>
              <Pressable onPress={() => {
                setBookingDates(p => ({ ...p, [datePickerSpace]: pendingDate.toISOString().split('T')[0] }));
                setDatePickerSpace(null);
              }}>
                <Text style={styles.dpDone}>Done</Text>
              </Pressable>
            </View>
            {DateTimePicker ? (
              <DateTimePicker
                value={pendingDate}
                mode="date"
                minimumDate={new Date()}
                display="spinner"
                onChange={(_, date) => { if (date) setPendingDate(date); }}
                style={{ width: '100%' }}
              />
            ) : (
              <View style={styles.dpFallback}>
                <Text style={styles.dpFallbackLabel}>Enter date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={pendingDate.toISOString().split('T')[0]}
                  onChangeText={text => { const d = new Date(text); if (!isNaN(d)) setPendingDate(d); }}
                  placeholder="2025-12-31"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#888', marginTop: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#4A7A4A', marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: '#fff', fontWeight: '600' },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  backBtn: { padding: 6 },
  navTitle: { flex: 1, fontSize: 18, fontWeight: '700', marginLeft: 8 },
  deleteBtn: { padding: 6 },
  content: { padding: 16, paddingBottom: 40 },
  venueCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  venueHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 58, height: 58, borderRadius: 10, marginRight: 12 },
  logoPlaceholder: { width: 58, height: 58, borderRadius: 10, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 24, fontWeight: '800' },
  venueName: { fontSize: 18, fontWeight: '700' },
  venueAddress: { fontSize: 13, color: '#888', marginTop: 2 },
  venueHours: { fontSize: 12, color: '#aaa', marginTop: 2 },
  manageActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionTxt: { fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  addSpaceBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addSpaceTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptySpaces: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  emptyTxt: { color: '#aaa', fontSize: 14 },
  spaceCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  spaceHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  spaceName: { fontSize: 15, fontWeight: '700', color: '#333' },
  sportType: { fontSize: 13, color: '#666', marginTop: 2 },
  price: { fontSize: 13, color: '#888', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  spaceActions: { flexDirection: 'row', gap: 10 },
  spaceBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  spaceBtnTxt: { fontSize: 13, fontWeight: '600' },
  bookingArea: { gap: 8 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10 },
  datePickerTxt: { fontSize: 14, color: '#555' },
  slotList: { marginVertical: 4 },
  slotBtn: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  slotBtnActive: { backgroundColor: '#D9E7CB', borderColor: '#4A7A4A' },
  slotTxt: { fontSize: 12, color: '#666' },
  slotTxtActive: { color: '#4A7A4A', fontWeight: '700' },
  bookBtn: { backgroundColor: '#4A7A4A', borderRadius: 10, padding: 12, alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#B0C8B0' },
  bookBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  loginHint: { fontSize: 13, color: '#aaa', fontStyle: 'italic', marginTop: 4 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 12 },
  fieldInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleBtn: { flex: 1, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 10, padding: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#D9E7CB', borderColor: '#4A7A4A' },
  roleTxt: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  roleTxtActive: { color: '#4A7A4A', fontWeight: '700' },
  dpOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  dpSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  dpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  dpTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  dpCancel: { fontSize: 16, color: '#888' },
  dpDone: { fontSize: 16, color: '#4A7A4A', fontWeight: '700' },
  dpFallback: { padding: 20 },
  dpFallbackLabel: { fontSize: 13, color: '#555', marginBottom: 8 },
});
