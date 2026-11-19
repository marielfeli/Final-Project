
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

type LocationPickerProps = {
  visible: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onCancel: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
};

const DEFAULT_REGION: Region = {
  latitude: 10.1335,
  longitude: 124.8445,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPicker({
  visible,
  initialLatitude,
  initialLongitude,
  onCancel,
  onConfirm,
}: LocationPickerProps) {
  const hasInitialLocation =
    typeof initialLatitude === 'number' &&
    typeof initialLongitude === 'number';

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: hasInitialLocation ? initialLatitude! : DEFAULT_REGION.latitude,
    longitude: hasInitialLocation ? initialLongitude! : DEFAULT_REGION.longitude,
  });

  const region: Region = {
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Apartment Location</Text>
          <Text style={styles.subtitle}>
            Tap anywhere on the map or drag the marker to set the exact location.
          </Text>
        </View>

        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={(event) =>
            setSelectedLocation(event.nativeEvent.coordinate)
          }
        >
          <Marker
            coordinate={selectedLocation}
            draggable
            onDragEnd={(event) =>
              setSelectedLocation(event.nativeEvent.coordinate)
            }
            title="Apartment Location"
            description="Drag to adjust the exact location"
          />
        </MapView>

        <View style={styles.footer}>
          <Text style={styles.coordinateText}>
            Latitude: {selectedLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinateText}>
            Longitude: {selectedLocation.longitude.toFixed(6)}
          </Text>

          <Pressable
            style={styles.confirmButton}
            onPress={() =>
              onConfirm(
                selectedLocation.latitude,
                selectedLocation.longitude
              )
            }
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172B4D',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#68778B',
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAF0',
  },
  coordinateText: {
    fontSize: 13,
    color: '#526174',
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
});
