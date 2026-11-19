import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

type PropertyMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  propertyName: string;
  propertyLocation: string;
};

export default function PropertyMap({ latitude, longitude, propertyName, propertyLocation }: PropertyMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number' &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

  const openDirections = async () => {
    const destination = hasCoordinates ? `${latitude},${longitude}` : propertyLocation;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Maps unavailable', 'Unable to open directions right now.');
    }
  };

  return (
    <View style={styles.container}>
      {hasCoordinates ? (
        <MapView
          style={styles.map}
          initialRegion={{ latitude, longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }} title={propertyName} description={propertyLocation} />
        </MapView>
      ) : (
        <View style={styles.noMap}>
          <Ionicons name="map-outline" size={36} color="#2D6CDF" />
          <Text style={styles.noMapTitle}>Map location not set yet</Text>
          <Text style={styles.noMapText}>The apartment owner needs to add accurate latitude and longitude coordinates for the map pin.</Text>
        </View>
      )}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={18} color="#2D6CDF" />
        <Text style={styles.locationText} numberOfLines={2}>{propertyLocation}</Text>
      </View>
      <TouchableOpacity style={styles.directionsButton} activeOpacity={0.85} onPress={openDirections}>
        <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  map: { width: '100%', height: 230 },
  noMap: { height: 230, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FC' },
  noMapTitle: { fontSize: 15, fontWeight: '800', color: '#172D49', marginTop: 10, textAlign: 'center' },
  noMapText: { fontSize: 12, lineHeight: 18, color: '#66758A', marginTop: 6, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  locationText: { flex: 1, fontSize: 12, color: '#526174' },
  directionsButton: { marginHorizontal: 12, marginBottom: 12, backgroundColor: '#2D6CDF', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  directionsText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
