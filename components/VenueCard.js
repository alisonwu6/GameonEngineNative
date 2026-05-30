import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { getVenueLogoUrl } from '../services/venueService';

export default function VenueCard({ venue, onPress, tone = 'matcha' }) {
  const isEarth = tone === 'earth';
  const border = isEarth ? '#E3D7CA' : '#D9E7CB';
  const bg = isEarth ? '#FBF7F3' : '#F4F8EF';
  const accent = isEarth ? '#8B6A4A' : '#4A7A4A';
  const hasLogo = venue.logo && venue.logo !== 'no-photo.jpg';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderColor: border, backgroundColor: bg, opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.row}>
        {hasLogo ? (
          <Image source={{ uri: getVenueLogoUrl(venue._id) }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: isEarth ? '#E3C9B0' : '#C8E0B4' }]}>
            <Text style={[styles.logoLetter, { color: accent }]}>{venue.name?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.name, { color: accent }]} numberOfLines={1}>{venue.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{venue.address}</Text>
          <Text style={styles.hours}>
            {venue.openTime || '09:00'} – {venue.closeTime || '22:00'}
          </Text>
          {venue.spaces && (
            <Text style={styles.spaces}>{venue.spaces.length} space{venue.spaces.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  logoPlaceholder: {
    width: 52, height: 52, borderRadius: 10, marginRight: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontSize: 22, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  address: { fontSize: 13, color: '#888', marginTop: 2 },
  hours: { fontSize: 12, color: '#aaa', marginTop: 2 },
  spaces: { fontSize: 12, color: '#aaa', marginTop: 2 },
});
