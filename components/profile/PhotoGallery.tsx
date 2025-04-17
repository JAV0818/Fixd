import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform } from 'react-native';
import { Camera, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([
    {
      id: '1',
      before: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60',
      after: 'https://images.unsplash.com/photo-1584622781867-1c5e76b81924?w=800&auto=format&fit=crop&q=60',
      description: 'Washer Repair'
    },
    {
      id: '2',
      before: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=800&auto=format&fit=crop&q=60',
      after: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=800&auto=format&fit=crop&q=60',
      description: 'HVAC Installation'
    }
  ]);

  const handleAddPhotos = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload the image to your server here
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Camera size={20} color="#0891b2" />
        <Text style={styles.title}>Before & After Gallery</Text>
      </View>
      <Text style={styles.subtitle}>Showcase your work</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.galleryScroll}
      >
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoSet}>
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo.before }} style={styles.photo} />
              <View style={styles.photoLabel}>
                <Text style={styles.labelText}>Before</Text>
              </View>
            </View>
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo.after }} style={styles.photo} />
              <View style={styles.photoLabel}>
                <Text style={styles.labelText}>After</Text>
              </View>
            </View>
            <Text style={styles.photoDescription}>{photo.description}</Text>
          </View>
        ))}
        
        <Pressable style={styles.addPhotoButton} onPress={handleAddPhotos}>
          <Plus size={24} color="#0891b2" />
          <Text style={styles.addPhotoText}>Add Photos</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1f2937',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6b7280',
    marginBottom: 16,
  },
  galleryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoSet: {
    marginRight: 16,
    width: 280,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photo: {
    width: 280,
    height: 210,
    borderRadius: 12,
  },
  photoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  photoDescription: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#1f2937',
    marginTop: 4,
  },
  addPhotoButton: {
    width: 280,
    height: 210,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  addPhotoText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#0891b2',
    marginTop: 8,
  },
});