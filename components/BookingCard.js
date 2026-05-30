import { View, Text, Pressable, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  confirmed: '#4A7A4A',
  pending: '#B8860B',
  cancelled: '#C0392B',
};

export default function BookingCard({ booking, userRole, onApprove, onCancel, onRemove }) {
  const isManager = userRole === 'manager';
  const statusColor = STATUS_COLORS[booking.status] || '#888';
  const venueName = booking.venue?.name || 'Venue';
  const spaceName = booking.space?.name || 'Space';
  const date = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.venueName}>{venueName}</Text>
          <Text style={styles.spaceName}>{spaceName}</Text>
          {isManager && booking.user?.email && (
            <Text style={styles.meta}>Player: {booking.user.email}</Text>
          )}
          <Text style={styles.meta}>{date} · {booking.timeSlot}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isManager && booking.status === 'pending' && (
          <Pressable style={[styles.btn, styles.approveBtn]} onPress={onApprove}>
            <Text style={styles.approveTxt}>Confirm</Text>
          </Pressable>
        )}
        {booking.status !== 'cancelled' && (
          <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </Pressable>
        )}
        {isManager && (
          <Pressable style={[styles.btn, styles.removeBtn]} onPress={onRemove}>
            <Text style={styles.removeTxt}>Delete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  venueName: { fontSize: 15, fontWeight: '700', color: '#333' },
  spaceName: { fontSize: 13, color: '#555', marginTop: 2 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  approveBtn: { backgroundColor: '#E8F5E9' },
  approveTxt: { color: '#4A7A4A', fontSize: 13, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#FFF3E0' },
  cancelTxt: { color: '#B8860B', fontSize: 13, fontWeight: '600' },
  removeBtn: { backgroundColor: '#FDECEA' },
  removeTxt: { color: '#C0392B', fontSize: 13, fontWeight: '600' },
});
