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

type AgentChatScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { agentId: string; agentName: string } }, 'params'>;
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: 'Hello! I\'m your Customer Support Agent. How can I help you today?',
    sender: 'agent',
    timestamp: new Date('2026-03-22T09:00:00Z'),
  },
  {
    id: '2',
    text: 'Can you pull up the latest open tickets?',
    sender: 'user',
    timestamp: new Date('2026-03-22T09:01:00Z'),
  },
  {
    id: '3',
    text: 'Sure! You currently have 4 open tickets: 2 urgent, 1 high priority, and 1 medium. The most critical is "Mobile app crashes on Android" (JOB-006, assigned to Mike Torres). Would you like me to escalate any of these?',
    sender: 'agent',
    timestamp: new Date('2026-03-22T09:01:10Z'),
  },
];

const AGENT_RESPONSES = [
  'I\'m looking into that for you now...',
  'Based on the data available, here\'s what I found: the issue appears to be related to the recent deployment.',
  'I\'ve updated the status and notified the relevant team members.',
  'That task has been completed. Is there anything else I can help with?',
  'I\'m analyzing the patterns in your data. This may take a moment.',
];

export default function AgentChatScreen({ navigation, route }: AgentChatScreenProps) {
  const { agentId, agentName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const response = AGENT_RESPONSES[Math.floor(Math.random() * AGENT_RESPONSES.length)];
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarText}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
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
      <View style={styles.agentBanner}>
        <View style={styles.statusDot} />
        <Text style={styles.agentBannerText}>{agentName || 'AI Agent'} is online</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.messageRow}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentAvatarText}>🤖</Text>
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingDots}>···</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask the agent something..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendBtnText}>Send</Text>
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
  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  agentBannerText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleAgent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingDots: {
    fontSize: 20,
    color: '#6B7280',
    letterSpacing: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
