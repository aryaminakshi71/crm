import React, { useState, useRef, useEffect } from 'react';
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
import { api } from '../../services/api';

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

export default function AgentChatScreen({ navigation, route }: AgentChatScreenProps) {
  const { agentId, agentName } = route.params;
  // Use a stable session ID per screen mount (agent + timestamp)
  const sessionId = useRef(`${agentId}-${Date.now()}`).current;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await api.getAgentChatHistory(agentId, sessionId);
      const history: ChatMessage[] = (data.messages ?? []).map((m: any) => ({
        id: m.id,
        text: m.content,
        sender: m.role === 'user' ? 'user' : 'agent',
        timestamp: new Date(m.timestamp),
      }));
      setMessages(history);
    } catch (error) {
      // Start with empty history if fetch fails — user can still chat
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }

  const sendMessage = async () => {
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

    try {
      const data = await api.sendAgentMessage(agentId, text, sessionId);
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'agent',
        timestamp: new Date(data.timestamp),
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I could not process your request. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setIsTyping(false);
    }
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chat history...</Text>
      </View>
    );
  }

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
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Start a conversation with {agentName || 'the agent'}.</Text>
          </View>
        }
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
          style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 15,
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
  emptyChat: {
    padding: 40,
    alignItems: 'center',
  },
  emptyChatText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
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
