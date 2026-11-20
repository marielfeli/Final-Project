
import React, { useEffect, useState } from 'react';
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

export default function ChatScreen({ user, property, onBack }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // LOAD INBOX
  const loadInbox = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Chat inbox error:', error.message);
      Alert.alert('Messages Error', error.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  // OPEN CONVERSATION
  const openConversation = async (conversation: any) => {
    if (!conversation?._id) {
      console.error('Invalid conversation:', conversation);
      Alert.alert('Chat Error', 'Invalid conversation ID.');
      return;
    }

    try {
      setLoading(true);
      setActiveConversation(conversation);

      const data = await api.getMessages(conversation._id);
      setMessages(Array.isArray(data) ? data : []);

      await api.markMessagesAsRead(conversation._id);
    } catch (error: any) {
      console.error('Load messages error:', error.message);
      Alert.alert('Messages Error', error.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  // START CHAT WITH PROPERTY OWNER
  const startChat = async () => {
    if (!property?._id) {
      Alert.alert('Chat Error', 'No property selected.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.startConversation(property._id);

      // Backend response is { message, conversation }
      const conversation = response?.conversation || response;

      if (!conversation?._id) {
        console.error('Start conversation response:', response);
        Alert.alert('Chat Error', 'The server did not return a valid conversation.');
        return;
      }

      await openConversation(conversation);
    } catch (error: any) {
      console.error('Start conversation error:', error.message);
      Alert.alert('Chat Error', error.message || 'Failed to start conversation.');
    } finally {
      setLoading(false);
    }
  };

  // SEND MESSAGE
  const send = async () => {
    const messageText = text.trim();

    if (!messageText || !activeConversation?._id || sending) {
      return;
    }

    try {
      setSending(true);

      await api.sendMessage(activeConversation._id, messageText);
      setText('');

      const data = await api.getMessages(activeConversation._id);
      setMessages(Array.isArray(data) ? data : []);

      const inboxData = await api.getConversations();
      setConversations(Array.isArray(inboxData) ? inboxData : []);
    } catch (error: any) {
      console.error('Send message error:', error.message);
      Alert.alert('Send Error', error.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    if (property && user.role === 'tenant') {
      startChat();
    } else {
      loadInbox();
    }
  }, []);

  // GET OTHER PARTICIPANT
  const getOtherParticipant = (conversation: any) => {
    return conversation?.participants?.find(
      (participant: any) =>
        (participant._id || participant.id) !== (user.id || user._id),
    );
  };

  // INBOX ITEM
  const renderConversation = ({ item }: { item: any }) => {
    const other = getOtherParticipant(item);

    return (
      <Pressable
        style={styles.conversation}
        onPress={() => openConversation(item)}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color="#2874C7" />
        </View>

        <View style={styles.conversationInfo}>
          <Text style={styles.name}>{other?.name || 'User'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Start a conversation'}
          </Text>
          <Text style={styles.propertyName}>
            {item.property?.name || 'Apartment'}
          </Text>
        </View>
      </Pressable>
    );
  };

  // CHAT VIEW
  if (activeConversation) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => {
            setActiveConversation(null);
            setMessages([]);
          }}>
            <Ionicons name="arrow-back" size={24} color="#17324F" />
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {getOtherParticipant(activeConversation)?.name || 'Conversation'}
            </Text>
            <Text style={styles.headerSub}>
              {activeConversation.property?.name || 'StayFinder'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#2874C7" />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item, index) => item._id || String(index)}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const senderId = item.sender?._id || item.sender;
              const myId = user.id || user._id;
              const mine = String(senderId) === String(myId);

              return (
                <View
                  style={[
                    styles.messageRow,
                    mine ? styles.myRow : styles.theirRow,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, mine && styles.myText]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.messageTime, mine && styles.myTime]}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </Text>
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
            placeholder="Type a message..."
            placeholderTextColor="#95A3B4"
            style={styles.input}
            multiline
          />

          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.disabledButton,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={19} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // INBOX VIEW
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#17324F" />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Messages</Text>
          <Text style={styles.headerSub}>Your StayFinder conversations</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#2874C7" />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={52} color="#A9C5E2" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>
            Your messages with apartment owners and customers will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderConversation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF3',
    gap: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17324F',
  },
  headerSub: {
    fontSize: 11,
    color: '#8292A5',
    marginTop: 3,
  },
  conversation: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17324F',
  },
  lastMessage: {
    fontSize: 12,
    color: '#73849A',
    marginTop: 4,
  },
  propertyName: {
    fontSize: 10,
    color: '#2874C7',
    marginTop: 4,
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#2874C7',
    borderBottomRightRadius: 5,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    color: '#17324F',
    fontSize: 14,
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 9,
    color: '#8A9AAF',
    textAlign: 'right',
    marginTop: 5,
  },
  myTime: {
    color: '#D6E9FC',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5EBF2',
    gap: 9,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 42,
    backgroundColor: '#F3F6FA',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: '#17324F',
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#2874C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17324F',
    marginTop: 14,
  },
  emptyText: {
    fontSize: 12,
    color: '#8393A7',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
});
