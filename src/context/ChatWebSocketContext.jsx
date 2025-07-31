import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const ChatWebSocketContext = createContext();

export const useChatWebSocket = () => {
  const context = useContext(ChatWebSocketContext);
  if (!context) {
    throw new Error('useChatWebSocket must be used within a ChatWebSocketProvider');
  }
  return context;
};

export const ChatWebSocketProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const subscriptionsRef = useRef(new Map()); // 채팅방별 구독 관리

  // WebSocket 연결 함수
  const connectWebSocket = (user) => {
    if (stompClient && stompClient.connected) {
      console.log('🔗 채팅 WebSocket이 이미 연결되어 있습니다.');
      return;
    }

    console.log('🔗 채팅 WebSocket 연결 시작...');
    
    // WebSocket URL 설정 - 배포환경 최적화
    const getWebSocketUrl = () => {
      const currentHost = window.location.hostname;
      const currentProtocol = window.location.protocol;
      
      // 개발 환경 (localhost)
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return `${currentProtocol}//${currentHost}:19091/ws/chat`;
      }
      
      // 배포 환경 (kschost.ddns.net)
      if (currentHost === 'kschost.ddns.net') {
        return `${currentProtocol}//${currentHost}/ws/chat`;
      }
      
      // 기타 배포 환경
      return `${currentProtocol}//${currentHost}/ws/chat`;
    };
    
    const socket = new SockJS(getWebSocketUrl());
    const client = Stomp.over(socket);
    
    client.connect(
      {},
      (frame) => {
        console.log('✅ 채팅 WebSocket 연결 성공:', frame);
        setIsConnected(true);
        setCurrentUser(user);
        setStompClient(client);
        
        // 로그인 알림 전송
        client.send('/app/chat/login', {}, JSON.stringify({
          user: user,
          timestamp: new Date().toISOString()
        }));
      },
      (error) => {
        console.error('❌ 채팅 WebSocket 연결 실패:', error);
        setIsConnected(false);
        setStompClient(null);
      }
    );
  };

  // WebSocket 연결 해제 함수
  const disconnectWebSocket = () => {
    if (stompClient) {
      // 모든 구독 해제
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current.clear();
      
      // 로그아웃 알림 전송
      if (currentUser) {
        stompClient.send('/app/chat/logout', {}, JSON.stringify({
          user: currentUser,
          timestamp: new Date().toISOString()
        }));
      }
      
      stompClient.disconnect();
      setStompClient(null);
      setIsConnected(false);
      setCurrentUser(null);
      console.log('🔌 채팅 WebSocket 연결 해제');
    }
  };

  // 채팅방 구독 함수
  const subscribeToRoom = (roomId, onMessageReceived) => {
    if (!stompClient || !stompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      return false;
    }

    const topic = `/topic/room/${roomId}`;
    
    // 이미 구독 중인지 확인
    if (subscriptionsRef.current.has(roomId)) {
      console.log(`📡 채팅방 ${roomId}는 이미 구독 중입니다.`);
      return true;
    }

    try {
      const subscription = stompClient.subscribe(topic, (message) => {
        const chatMessage = JSON.parse(message.body);
        console.log(`📨 채팅방 ${roomId} 메시지 수신:`, chatMessage);
        onMessageReceived(chatMessage);
      });

      subscriptionsRef.current.set(roomId, subscription);
      console.log(`✅ 채팅방 ${roomId} 구독 성공`);
      return true;
    } catch (error) {
      console.error(`❌ 채팅방 ${roomId} 구독 실패:`, error);
      return false;
    }
  };

  // 채팅방 구독 해제 함수
  const unsubscribeFromRoom = (roomId) => {
    const subscription = subscriptionsRef.current.get(roomId);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(roomId);
      console.log(`🔌 채팅방 ${roomId} 구독 해제`);
    }
  };

  // 채팅방 메시지 전송 함수
  const sendMessageToRoom = (roomId, message) => {
    if (!stompClient || !stompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      return false;
    }

    if (!currentUser) {
      console.error('❌ 사용자 정보가 없습니다.');
      return false;
    }

    const chatMessage = {
      id: `${currentUser.id}_${Date.now()}`,
      roomId: roomId,
      text: message,
      sender: currentUser,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };

    try {
      stompClient.send('/app/chat/room', {}, JSON.stringify(chatMessage));
      console.log(`📤 채팅방 ${roomId} 메시지 전송:`, chatMessage);
      return true;
    } catch (error) {
      console.error(`❌ 채팅방 ${roomId} 메시지 전송 실패:`, error);
      return false;
    }
  };

  // 전역 메시지 전송 함수
  const sendGlobalMessage = (message) => {
    if (!stompClient || !stompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      return false;
    }

    if (!currentUser) {
      console.error('❌ 사용자 정보가 없습니다.');
      return false;
    }

    const globalMessage = {
      id: `${currentUser.id}_${Date.now()}`,
      text: message,
      sender: currentUser,
      timestamp: new Date().toISOString(),
      type: 'global'
    };

    try {
      stompClient.send('/app/chat/global', {}, JSON.stringify(globalMessage));
      console.log('📤 전역 메시지 전송:', globalMessage);
      return true;
    } catch (error) {
      console.error('❌ 전역 메시지 전송 실패:', error);
      return false;
    }
  };

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const value = {
    stompClient,
    isConnected,
    currentUser,
    connectWebSocket,
    disconnectWebSocket,
    subscribeToRoom,
    unsubscribeFromRoom,
    sendMessageToRoom,
    sendGlobalMessage
  };

  return (
    <ChatWebSocketContext.Provider value={value}>
      {children}
    </ChatWebSocketContext.Provider>
  );
}; 