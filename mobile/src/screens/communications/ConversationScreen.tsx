import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type ConversationScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { conversationId: string; contactName: string } }, 'params'>;
};

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: 'Hi Maria, following up on your support request. Are you still experiencing the login issue?', sender: 'me', time: '09:30' },
  { id: '2', text: 'Yes, I am. It\'s been happening since yesterday afternoon.', sender: 'them', time: '09:32' },
  { id: '3', text: 'I\'ve escalated this to our engineering team. They\'re investigating now.', sender: 'me', time: '09:35' },
  { id: '4', text: 'Thanks for the update! Let me know when it\'s ready.', sender: 'them', time: '09:42' },
  { id: '5', text: 'Will do! We\'ll have a fix deployed within the hour.', sender: 'me', time: '09:43' },
];

export default function ConversationScreen({ navigation, route }: ConversationScreenProps) {
  const { conversationId, contactName } = route.params;
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn}>
          <Text style={styles.attachBtnText}>+</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={`Message ${contactName || 'contact'}...`}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
  },
  bubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timestampMe: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachBtnText: {
    fontSize: 22,
    color: '#6B7280',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
