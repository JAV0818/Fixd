import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Dimensions } from 'react-native';
import { X, Activity } from 'lucide-react-native';

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

type NotificationPanelProps = {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotificationPanel({ 
  notifications, 
  onClose, 
  onMarkAsRead,
  onMarkAllAsRead 
}: NotificationPanelProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable 
        style={[
          styles.overlay,
          Platform.select({
            web: styles.overlayWeb,
            default: styles.overlayNative
          })
        ]} 
        onPress={onClose} 
      />
      <View 
        style={[
          styles.container,
          Platform.select({
            web: styles.containerWeb,
            default: styles.containerNative
          })
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Activity size={20} color="#00F0FF" />
            <Text style={styles.title}>QUANTUM ALERTS</Text>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>clear</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#00F0FF" />
            </Pressable>
          </View>
        </View>
        <ScrollView style={styles.notificationList}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[
                styles.notification,
                notification.read ? styles.notificationRead : styles.notificationUnread,
              ]}
              onPress={() => onMarkAsRead(notification.id)}
            >
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.timestamp}</Text>
              </View>
              {!notification.read && (
                <View style={styles.unreadIndicator} />
              )}
              <View style={styles.notificationLine} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    elevation: 1000,
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(10, 15, 30, 0.8)',
    elevation: 1000,
    zIndex: 1000,
  },
  overlayWeb: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayNative: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: Platform.select({
      web: 320,
      default: Math.min(SCREEN_WIDTH - 32, 320)
    }),
    maxHeight: 480,
    backgroundColor: '#0A0F1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3555',
    shadowColor: '#00F0FF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 1001,
    zIndex: 1001,
    overflow: 'hidden',
  },
  containerWeb: {
    position: 'fixed',
    top: 80,
    right: 16,
  },
  containerNative: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    backgroundColor: 'rgba(122, 137, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#00F0FF',
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  markAllText: {
    color: '#00F0FF',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationList: {
    maxHeight: 400,
  },
  notification: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3555',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  notificationUnread: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  notificationRead: {
    backgroundColor: 'transparent',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#00F0FF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7A89FF',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F0FF',
    marginLeft: 12,
    shadowColor: '#00F0FF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  notificationLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#00F0FF',
  },
});