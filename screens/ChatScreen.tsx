// ===========================================
// ======== ⭐️ ChatScreen.tsx (ENGLISH) ========
// ======== (Streaming + Markdown Support) ========
// ===========================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useHeaderHeight } from '@react-navigation/elements';
import Markdown from 'react-native-markdown-display';

// ===================== TYPES =====================
interface Message {
  id: string;
  text: string;
  isBot: boolean;
}
interface AskBotResponse {
  text: string;
}

// ===================== CONSTANTS =====================
const BOT_AVATAR_URL = 'https://i.imgur.com/7k12EPD.png';
const STREAM_SPEED_MS = 50; // Speed of the typing effect

// ===================== COMPONENT =====================
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const currentUser = auth().currentUser;
  const scrollViewRef = useRef<ScrollView>(null);
  
  const headerHeight = useHeaderHeight();

  // ===================== INITIAL MESSAGE (⭐️ UPDATED TO ENGLISH) =====================
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: 'Hello! I am your Smart Gas Assistant 🔥\nYou can ask me about the cylinder weight or gas leak status.',
        isBot: true,
      },
    ]);
  }, []);

  // ===================== STREAMING FUNCTION (No Change) =====================
  const streamBotResponse = (fullText: string, messageId: string) => {
    const words = fullText.split(' ');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < words.length) {
        const currentText = words.slice(0, index + 1).join(' ');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, text: currentText } : msg
          )
        );
        index++;
      } else {
        clearInterval(interval);
      }
    }, STREAM_SPEED_MS);
  };


  // ===================== SEND MESSAGE (⭐️ ERROR UPDATED TO ENGLISH) =====================
  const onSend = useCallback(async () => {
    const messageText = currentText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentText('');
    setLoading(true);

    try {
      const askBot = functions().httpsCallable<
        { text: string },
        AskBotResponse
      >('askBot');
      const response = await askBot({ text: messageText });
      const botResponseText =
        response.data?.text || 'Sorry, I could not understand that.';

      setLoading(false); 

      const botMessageId = (Date.now() + 1).toString();
      const emptyBotMessage: Message = {
        id: botMessageId,
        text: '', 
        isBot: true,
      };
      setMessages(prev => [...prev, emptyBotMessage]);

      streamBotResponse(botResponseText, botMessageId);

    } catch (error: any) {
      console.error('🔥 Cloud Function Error:', error);
      setLoading(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        // ⭐️ UPDATED TO ENGLISH
        text: "Sorry, I'm having trouble connecting to the bot.",
        isBot: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [currentUser, currentText]);

  // Scroll to bottom effect
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // ===================== UI RENDER =====================
  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        {/* 1. Chat messages */}
        <ScrollView
          style={styles.messageContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageRow,
                msg.isBot ? styles.botRow : styles.userRow
              ]}
            >
              {msg.isBot && (
                <Image source={{ uri: BOT_AVATAR_URL }} style={styles.avatar} />
              )}
              
              <View
                style={[
                  styles.bubble,
                  msg.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Markdown style={markdownStyles}>
                  {msg.text}
                </Markdown>
              </View>
            </View>
          ))}
          
          {/* "Bot is typing" indicator */}
          {loading && (
            <View style={[styles.messageRow, styles.botRow]}>
              <Image source={{ uri: BOT_AVATAR_URL }} style={styles.avatar} />
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 2. Text Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={currentText}
            onChangeText={setCurrentText}
            // ⭐️ UPDATED TO ENGLISH
            placeholder="Type your question..."
            placeholderTextColor="#888"
            multiline={true}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={onSend}
            disabled={loading || currentText.trim().length === 0}
          >
            <Icon 
              name="send" 
              size={24} 
              color={currentText.trim().length === 0 ? "#888" : "#007AFF"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===================== STYLES =====================

// Markdown styles (for bold, lists, etc.)
const markdownStyles = StyleSheet.create({
  text: {
    color: '#FFF',
    fontSize: 16,
  },
  strong: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  list_item: {
    color: '#FFF',
    fontSize: 16,
  }
});

// Main component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010A18',
  },
  messageContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxWidth: '80%',
  },
  botBubble: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 5,
  },
  typingBubble: {
    width: 60,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', 
    paddingHorizontal: 10,
    paddingVertical: 8, 
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    backgroundColor: '#010A18',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#FFF',
    marginRight: 10,
    maxHeight: 120,
  },
  sendButton: {
    padding: 5,
    marginBottom: 8,
  },
});