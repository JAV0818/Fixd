import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  FlatList, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Camera, File, Download, X } from 'lucide-react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { Timestamp, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from '@/styles/theme';

type MechanicChatScreenRouteProp = RouteProp<RootStackParamList, 'MechanicChat'>;
type MechanicChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MechanicChat'>;

type Message = {
  id: string;
  text?: string;
  createdAt: Timestamp;
  senderId: string;
  sentBy: 'customer' | 'provider';
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document' | 'camera';
  attachmentName?: string;
  attachmentSize?: number;
};

export default function MechanicChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MechanicChatScreenNavigationProp>();
  const route = useRoute<MechanicChatScreenRouteProp>();
  const { orderId, mechanicName } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;

  // Fetch messages
  useEffect(() => {
    if (!orderId || !currentUser) {
      setLoading(false);
      setError("Missing order ID or user information.");
      return;
    }

    setLoading(true);
    const messagesRef = collection(firestore, 'repair-orders', orderId, 'activeChat');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))
        .filter(msg => msg.createdAt && msg.createdAt.toDate); // Filter out messages without valid createdAt
      setMessages(fetchedMessages);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, currentUser]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access photos is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleSendAttachment(result.assets[0].uri, 'image', result.assets[0].fileName || 'image.jpg');
    }
    setShowAttachmentModal(false);
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handleSendAttachment(result.assets[0].uri, 'camera', 'photo.jpg');
    }
    setShowAttachmentModal(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        await handleSendAttachment(result.assets[0].uri, 'document', result.assets[0].name);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Could not pick document.");
    }
    setShowAttachmentModal(false);
  };

  const handleSendAttachment = async (uri: string, type: 'image' | 'document' | 'camera', fileName?: string) => {
    if (!currentUser || !orderId) return;
    setUploadingAttachment(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a file smaller than 10MB.");
        return;
      }

      const uploadFileName = `${Date.now()}-${currentUser.uid}-${fileName || 'file'}`;
      const attachmentRef = ref(storage, `chatAttachments/activeChat/${orderId}/${uploadFileName}`);
      
      await uploadBytes(attachmentRef, blob);
      const downloadURL = await getDownloadURL(attachmentRef);

      const messagesRef = collection(firestore, 'repair-orders', orderId, 'activeChat');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        attachmentUrl: downloadURL,
        attachmentType: type,
        attachmentName: fileName,
        attachmentSize: blob.size,
        createdAt: serverTimestamp(),
        sentBy: 'customer',
        text: '',
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Error sending attachment:", error);
      Alert.alert("Error", "Could not send attachment.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || !orderId) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    const messagesRef = collection(firestore, 'repair-orders', orderId, 'activeChat');

    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text: messageText,
        createdAt: serverTimestamp(),
        sentBy: 'customer'
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Could not send message.");
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleDownloadAttachment = async (url: string, fileName?: string) => {
    try {
      const downloadPath = `${FileSystem.documentDirectory}${fileName || 'download'}`;
      const { uri } = await FileSystem.downloadAsync(url, downloadPath);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `File saved to ${uri}`);
      }
    } catch (error) {
      console.error("Error downloading:", error);
      Alert.alert("Error", "Could not download file.");
    }
  };

  const formatTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp: Timestamp | undefined) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = () => {
    const grouped: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    messages.forEach(msg => {
      if (!msg.createdAt?.toDate) return;
      const dateStr = formatDateHeader(msg.createdAt);
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        grouped.push({ date: dateStr, messages: [msg] });
      } else {
        if (grouped.length > 0) {
          grouped[grouped.length - 1].messages.push(msg);
        }
      }
    });
    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{mechanicName || 'Mechanic'}</Text>
          <Text style={styles.headerSubtitle}>Active Order</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item, index) => `group-${index}`}
          contentContainerStyle={styles.messagesContent}
          renderItem={({ item: group }) => {
            if (!group || !group.messages) return null;
            return (
              <View>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{group.date}</Text>
                  <View style={styles.dateLine} />
                </View>
                
                {/* Messages for this date */}
                {group.messages.map(msg => {
                const isMe = msg.sentBy === 'customer';
                return (
                  <View 
                    key={msg.id} 
                    style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}
                  >
                    <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                      {msg.attachmentUrl && (
                        msg.attachmentType === 'image' || msg.attachmentType === 'camera' ? (
                          <Pressable onPress={() => handleDownloadAttachment(msg.attachmentUrl!, msg.attachmentName)}>
                            <Image source={{ uri: msg.attachmentUrl }} style={styles.attachmentImage} />
                          </Pressable>
                        ) : (
                          <Pressable 
                            style={styles.documentAttachment}
                            onPress={() => handleDownloadAttachment(msg.attachmentUrl!, msg.attachmentName)}
                          >
                            <File size={20} color={isMe ? '#FFFFFF' : colors.primary} />
                            <Text style={[styles.documentName, isMe && styles.documentNameMe]}>
                              {msg.attachmentName || 'Document'}
                            </Text>
                            <Download size={16} color={isMe ? '#FFFFFF' : colors.primary} />
                          </Pressable>
                        )
                      )}
                      {msg.text ? (
                        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                          {msg.text}
                        </Text>
                      ) : null}
                      <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                        {formatTime(msg.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />

        {/* Uploading indicator */}
        {uploadingAttachment && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.attachButton} onPress={() => setShowAttachmentModal(true)}>
            <Paperclip size={22} color={colors.textSecondary} />
          </Pressable>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>
          
          <IconButton
            icon="send"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sending || !inputText.trim()}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Attachment</Text>
              <Pressable onPress={() => setShowAttachmentModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            
            <View style={styles.modalOptions}>
              <Pressable style={styles.modalOption} onPress={handleTakePhoto}>
                <View style={[styles.optionIcon, { backgroundColor: colors.primaryLight }]}>
                  <Camera size={24} color={colors.primary} />
                </View>
                <Text style={styles.optionLabel}>Camera</Text>
              </Pressable>
              
              <Pressable style={styles.modalOption} onPress={handlePickImage}>
                <View style={[styles.optionIcon, { backgroundColor: colors.successLight }]}>
                  <ImageIcon size={24} color={colors.success} />
                </View>
                <Text style={styles.optionLabel}>Photos</Text>
              </Pressable>
              
              <Pressable style={styles.modalOption} onPress={handlePickDocument}>
                <View style={[styles.optionIcon, { backgroundColor: colors.warningLight }]}>
                  <File size={24} color={colors.warning} />
                </View>
                <Text style={styles.optionLabel}>Document</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textTertiary,
    marginTop: 2,
  },
  
  // Messages
  keyboardAvoid: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginHorizontal: 12,
  },
  messageRow: {
    marginVertical: 4,
  },
  messageRowRight: {
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  theirText: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: colors.textTertiary,
  },
  
  // Attachments
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  documentName: {
    flex: 1,
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  documentNameMe: {
    color: '#FFFFFF',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  
  // Uploading
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  uploadingText: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  
  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalOption: {
    alignItems: 'center',
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
});
