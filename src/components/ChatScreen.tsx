import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { User, Property } from '../types';

type Props = {
  user: User;
  property?: Property | null;
  onBack: () => void;
};


const getId = (value: any) => String(value?._id || value?.id || value || '');
const getInitials = (name?: string) => {
  if (!name?.trim()) return 'SF';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


export default function ChatScreen({ user, property, onBack }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<any>>(null);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Chat inbox error:', error?.message);
      Alert.alert('Messages Error', error?.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };


  const openConversation = async (conversation: any) => {
    if (!conversation?._id) {
      Alert.alert('Chat Error', 'Invalid conversation ID.');
      return;
    }

    try {
      setLoading(true);
      setActiveConversation(conversation);
      setMessages([]);
      const data = await api.getMessages(conversation._id);
      const loadedMessages = Array.isArray(data) ? data : [];
      setMessages(loadedMessages);
      await api.markMessagesAsRead(conversation._id);
    } catch (error: any) {
      console.error('Load messages error:', error?.message);
      Alert.alert('Messages Error', error?.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };


  const startChat = async () => {
    if (!property?._id) {
      Alert.alert('Chat Error', 'No property selected.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.startConversation(property._id);
      const conversation = response?.conversation || response;

      if (!conversation?._id) {
        console.error('Start conversation response:', response);
        Alert.alert('Chat Error', 'The server did not return a valid conversation.');
        return;
      }
      await openConversation(conversation);
    } catch (error: any) {
      console.error('Start conversation error:', error?.message);
      Alert.alert('Chat Error', error?.message || 'Failed to start conversation.');
    } finally {
      setLoading(false);
    }
  };


  const send = async () => {
    const messageText = text.trim();
    if (!messageText || !activeConversation?._id || sending) return;

    try {
      setSending(true);
      await api.sendMessage(activeConversation._id, messageText);
      setText('');

      const data = await api.getMessages(activeConversation._id);
      const updatedMessages = Array.isArray(data) ? data : [];
      setMessages(updatedMessages);

      const inboxData = await api.getConversations();
      setConversations(Array.isArray(inboxData) ? inboxData : []);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (error: any) {
      console.error('Send message error:', error?.message);
      Alert.alert('Send Error', error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };


  useEffect(() => {
    if (property && user.role === 'tenant') startChat();
    else loadInbox();
    // Load only once on mount; navigation remounts this screen.
  }, []);


  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages]);


  const getOtherParticipant = (conversation: any) => {
    const currentUserId = getId(user);
    return conversation?.participants?.find((participant: any) => getId(participant) !== currentUserId);
  };


  const renderConversation = ({ item }: { item: any }) => {
    const other = getOtherParticipant(item);
    const otherName = other?.name || 'StayFinder User';

    return (
      <Pressable style={styles.conversation} onPress={() => openConversation(item)} android_ripple={{ color: '#EAF3FD' }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{getInitials(otherName)}</Text>
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationTopLine}>
            <Text style={styles.name} numberOfLines={1}>{otherName}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || 'Start a conversation'}</Text>
          <View style={styles.propertyTagRow}>
            <Ionicons name="home-outline" size={12} color="#2874C7" />
            <Text style={styles.propertyName} numberOfLines={1}>{item.property?.name || 'Property conversation'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A7B6C7" />
      </Pressable>
    );
  };


  if (activeConversation) {
    const other = getOtherParticipant(activeConversation);
    const otherName = other?.name || 'Conversation';

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.chatHeader}>
          <Pressable style={styles.backButton} onPress={() => { setActiveConversation(null); setMessages([]); setText(''); }} hitSlop={10}>
            <Ionicons name="arrow-back" size={23} color="#17324F" />
          </Pressable>
          <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{getInitials(otherName)}</Text></View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{activeConversation.property?.name || 'StayFinder conversation'}</Text>
          </View>
          <View style={styles.headerIconButton}><Ionicons name="information-circle-outline" size={23} color="#2874C7" /></View>
        </View>

        {loading ? (
          <View style={styles.chatLoading}><ActivityIndicator color="#2874C7" size="large" /><Text style={styles.loadingText}>Loading messages...</Text></View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <View style={styles.emptyChatIcon}><Ionicons name="chatbubble-ellipses-outline" size={30} color="#2874C7" /></View>
            <Text style={styles.emptyChatTitle}>Start the conversation</Text>
            <Text style={styles.emptyChatText}>Say hello and ask anything about the property.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item._id || String(index)}
            contentContainerStyle={styles.messageList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const senderId = getId(item.sender);
              const myId = getId(user);
              const mine = senderId === myId;
              return (
                <View style={[styles.messageRow, mine ? styles.myRow : styles.theirRow]}>
                  <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, mine && styles.myText]}>{item.text}</Text>
                    <Text style={[styles.messageTime, mine && styles.myTime]}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a message..."
            placeholderTextColor="#91A2B5"
            style={styles.input}
            multiline
            maxLength={2000}
            textAlignVertical="center"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={[styles.sendButton, (!text.trim() || sending) && styles.disabledButton]}
            accessibilityLabel="Send message"
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.inboxHeader}>
        <Pressable style={styles.backButton} onPress={onBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={23} color="#17324F" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Messages</Text>
          <Text style={styles.headerSub}>Your conversations in one place</Text>
        </View>
        <View style={styles.headerIconButton}><Ionicons name="chatbubbles-outline" size={22} color="#2874C7" /></View>
      </View>

      {loading ? (
        <View style={styles.inboxLoading}><ActivityIndicator color="#2874C7" size="large" /><Text style={styles.loadingText}>Loading inbox...</Text></View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={38} color="#2874C7" /></View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Your messages with property owners and tenants will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderConversation}
          contentContainerStyle={styles.inboxList}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  inboxHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E7EDF4', gap: 12,
  },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E7EDF4', gap: 10,
  },
  backButton: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F1FC', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#2874C7', fontSize: 13, fontWeight: '800' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '800', color: '#17324F' },
  headerSub: { fontSize: 11, color: '#8092A6', marginTop: 3 },
  headerIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  inboxList: { paddingBottom: 12 },
  conversation: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F6',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E6F1FC', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#2874C7', fontSize: 15, fontWeight: '800' },
  conversationInfo: { flex: 1, minWidth: 0 },
  conversationTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '800', color: '#17324F' },
  lastMessage: { fontSize: 12, color: '#75869A', marginTop: 5 },
  propertyTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  propertyName: { fontSize: 10, color: '#2874C7', flex: 1 },
  messageList: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '84%', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, minWidth: 60 },
  myBubble: { backgroundColor: '#2874C7', borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#E9EEF4' },
  messageText: { color: '#17324F', fontSize: 14, lineHeight: 20 },
  myText: { color: '#FFFFFF' },
  messageTime: { fontSize: 9, color: '#8999AB', textAlign: 'right', marginTop: 5 },
  myTime: { color: '#D7E9FA' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#E5EBF2', gap: 9,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44, backgroundColor: '#F2F6FA', borderRadius: 22,
    paddingHorizontal: 15, paddingVertical: 11, fontSize: 14, color: '#17324F',
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2874C7', alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.45 },
  chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  inboxLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#8293A7', fontSize: 12, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  emptyIcon: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#E6F1FC', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#17324F', marginTop: 16 },
  emptyText: { fontSize: 12, color: '#8293A7', textAlign: 'center', lineHeight: 19, marginTop: 8 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyChatIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#E6F1FC', alignItems: 'center', justifyContent: 'center' },
  emptyChatTitle: { fontSize: 16, fontWeight: '800', color: '#17324F', marginTop: 14 },
  emptyChatText: { fontSize: 12, color: '#8293A7', textAlign: 'center', lineHeight: 19, marginTop: 7 },
});
