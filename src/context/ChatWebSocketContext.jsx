import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

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
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectIntervalRef = useRef(null);
  
  // stompClient를 useRef로도 관리하여 최신 상태 보장
  const stompClientRef = useRef(null);

  // 자동 재연결 처리
  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ 최대 재연결 시도 횟수 초과');
      return;
    }

    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
    }

    reconnectIntervalRef.current = setTimeout(() => {
      console.log(`🔄 재연결 시도 ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`);
      reconnectAttemptsRef.current++;
      
      if (currentUser) {
        connectWebSocket(currentUser);
      }
    }, 1000 * Math.pow(2, reconnectAttemptsRef.current)); // 지수 백오프
  };

  // WebSocket 연결 함수
  const connectWebSocket = (user) => {
    // 이미 연결되어 있으면 재사용
    if (stompClient && stompClient.connected) {
      console.log('🔗 채팅 WebSocket이 이미 연결되어 있습니다.');
      return;
    }
    
    // 기존 연결이 있지만 연결되지 않은 경우에만 해제
    if (stompClient && !stompClient.connected) {
      console.log('🔌 연결되지 않은 기존 WebSocket 정리');
      try {
        stompClient.deactivate();
      } catch (error) {
        console.error('기존 연결 해제 중 에러:', error);
      }
      setStompClient(null);
      setIsConnected(false);
    }

    console.log('🔗 채팅 WebSocket 연결 시작...', user);
    
    // WebSocket URL 설정 - 배포환경 최적화
    const getWebSocketUrl = () => {
      const currentHost = window.location.hostname;
      const currentProtocol = window.location.protocol;
      
      // 개발 환경 (localhost)
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return `${currentProtocol}//${currentHost}:19091/ws/adminchat`;
      }
      
      // 배포 환경 (kschost.ddns.net)
      if (currentHost === 'kschost.ddns.net') {
        return `${currentProtocol}//${currentHost}/springboot/api/ws/adminchat`;
      }
      
      // 기타 배포 환경
      return `${currentProtocol}//${currentHost}/api/ws/adminchat`;
    };
    
    const socket = new SockJS(getWebSocketUrl());
    const client = new StompClient({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      connectHeaders: {
        'Authorization': `Bearer ${localStorage.getItem('admin-access-token')}`
      }
    });
    
    client.onConnect = () => {
      console.log('✅ 채팅 WebSocket 연결 성공!');
      setIsConnected(true);
      setCurrentUser(user);
      setStompClient(client);
      stompClientRef.current = client; // useRef도 함께 업데이트
      reconnectAttemptsRef.current = 0; // 연결 성공 시 재연결 시도 횟수 초기화

      // 연결 성공 후 기존 구독 복구
      if (subscriptionsRef.current.size > 0) {
        console.log('🔄 기존 구독 복구 중...');
        // 기존 구독 정보를 임시로 저장
        const existingSubscriptions = new Map(subscriptionsRef.current);
        subscriptionsRef.current.clear();
        
        // 각 구독을 다시 생성
        existingSubscriptions.forEach((subscription, roomId) => {
          console.log(`📡 구독 복구 시도: ${roomId}`);
          // 구독 복구는 실제로는 ChatRoomWindow에서 처리됨
        });
      }
      
      console.log(`📊 WebSocket 연결 완료 - 현재 구독 수: ${subscriptionsRef.current.size}`);
    };

    client.onStompError = (frame) => {
      console.error('❌ 채팅 WebSocket STOMP 에러:', frame);
      setIsConnected(false);
      setStompClient(null);
      handleReconnect();
    };

    client.onDisconnect = () => {
      console.log('🔌 채팅 WebSocket 연결 해제');
      setIsConnected(false);
      // 구독 정보는 유지 (재연결 시 복구를 위해)
      setStompClient(null);
      // 자동 재연결 비활성화 - 무한 루프 방지
      // handleReconnect();
    };

    client.onWebSocketError = (error) => {
      console.error('❌ 채팅 WebSocket 에러:', error);
      setIsConnected(false);
      setStompClient(null);
      // 자동 재연결 비활성화 - 무한 루프 방지
      // handleReconnect();
    };

    // 연결 시작
    client.activate();
  };

  // WebSocket 연결 해제 함수
  const disconnectWebSocket = () => {
    if (reconnectIntervalRef.current) {
      clearTimeout(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    
    if (stompClient) {
      // 모든 구독 해제
      subscriptionsRef.current.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('구독 해제 중 에러:', error);
        }
      });
      subscriptionsRef.current.clear();
      
      stompClient.deactivate();
      setStompClient(null);
      stompClientRef.current = null; // useRef도 함께 업데이트
      setIsConnected(false);
      setCurrentUser(null);
      console.log('🔌 채팅 WebSocket 연결 해제');
    }
  };

  // 채팅방 구독 함수 (useRef로 최신 상태 참조)
  const subscribeToRoom = useCallback((roomId, onMessageReceived) => {
    // useRef를 사용하여 최신 stompClient 상태 확인
    const currentStompClient = stompClientRef.current;
    const currentIsConnected = isConnected;
    
    console.log('🔍 subscribeToRoom 연결 상태 확인:', {
      hasStompClient: !!currentStompClient,
      stompConnected: currentStompClient?.connected,
      isConnected: currentIsConnected,
      stompClientId: currentStompClient ? 'exists' : 'null',
      useRefValue: !!stompClientRef.current
    });
    
    if (!currentStompClient || !currentStompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      console.log('🔍 연결 실패 상세:', {
        stompClientExists: !!currentStompClient,
        stompConnected: currentStompClient?.connected,
        isConnected: currentIsConnected,
        useRefValue: !!stompClientRef.current
      });
      return false;
    }

    // roomId를 안전하게 추출 (객체인 경우 처리)
    let extractedRoomId = roomId;
    
    // roomId가 객체인 경우 room_index 필드 추출
    if (extractedRoomId && typeof extractedRoomId === 'object') {
      extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
    }
    
    // "admin"은 특별히 허용 (새 방 생성용)
    if (extractedRoomId === 'admin') {
      console.log('📡 admin 구독 허용 (새 방 생성용)');
    } else {
      // 문자열로 변환하고 숫자만 추출
      extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
    }
    
    if (!extractedRoomId) {
      console.error('❌ 유효하지 않은 roomId:', roomId);
      return false;
    }

    // 이미 구독 중인지 확인
    if (subscriptionsRef.current.has(extractedRoomId)) {
      console.log(`📡 채팅방 ${extractedRoomId}는 이미 구독 중입니다.`);
      return true;
    }

    try {
      // DB에서 생성되는 room_index로 직접 구독
      const subscriptionPath = `/queue/${extractedRoomId}`;
      console.log(`📡 구독 시도: ${subscriptionPath} (원본 roomId: ${roomId}, 추출된 roomId: ${extractedRoomId})`);
      console.log(`🔍 구독 시 사용할 stompClient:`, {
        exists: !!currentStompClient,
        connected: currentStompClient?.connected,
        id: currentStompClient ? 'valid' : 'null'
      });
      
      const subscription = currentStompClient.subscribe(subscriptionPath, (message) => {
        const chatMessage = JSON.parse(message.body);
        console.log(`📨 ${extractedRoomId} 메시지 수신:`, chatMessage);
        onMessageReceived(chatMessage);
      });

      subscriptionsRef.current.set(extractedRoomId, subscription);
      console.log(`✅ ${extractedRoomId} 구독 성공 (경로: ${subscriptionPath})`);
      return true;
    } catch (error) {
      console.error(`❌ ${extractedRoomId} 구독 실패:`, error);
      return false;
    }
  }, [isConnected]); // stompClient 대신 isConnected만 의존성으로 사용

  // 채팅방 구독 해제 함수
  const unsubscribeFromRoom = (roomId) => {
    // roomId를 안전하게 추출 (객체인 경우 처리)
    let extractedRoomId = roomId;
    
    // roomId가 객체인 경우 room_index 필드 추출
    if (extractedRoomId && typeof extractedRoomId === 'object') {
      extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
    }
    
    // "admin"은 특별히 허용 (새 방 생성용)
    if (extractedRoomId === 'admin') {
      console.log('🔌 admin 구독 해제 허용 (새 방 생성용)');
    } else {
      // 문자열로 변환하고 숫자만 추출
      extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
    }
    
    if (!extractedRoomId) {
      console.error('❌ 유효하지 않은 roomId:', roomId);
      return;
    }

    const subscription = subscriptionsRef.current.get(extractedRoomId);
    if (subscription) {
      try {
        console.log(`🔌 채팅방 ${extractedRoomId} 구독 해제 시도`);
        subscription.unsubscribe();
        subscriptionsRef.current.delete(extractedRoomId);
        console.log(`✅ 채팅방 ${extractedRoomId} 구독 해제 성공`);
      } catch (error) {
        console.error(`❌ 채팅방 ${extractedRoomId} 구독 해제 실패:`, error);
        // 에러가 발생해도 Map에서 제거
        subscriptionsRef.current.delete(extractedRoomId);
      }
    } else {
      console.log(`📡 구독이 존재하지 않는 채팅방: ${extractedRoomId}`);
    }
    
    // 구독 해제 후 연결 상태 확인
    console.log(`📊 현재 구독 상태: ${subscriptionsRef.current.size}개 구독 중`);
  };

  // 메시지 전송 함수
  const sendMessage = (roomId, messageData) => {
    if (!stompClient || !stompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      return false;
    }

    // roomId를 안전하게 추출 (객체인 경우 처리)
    let extractedRoomId = roomId;
    
    // roomId가 객체인 경우 room_index 필드 추출
    if (extractedRoomId && typeof extractedRoomId === 'object') {
      extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
    }
    
    // 새로운 방 생성인지 확인 (room_index가 null이거나 "admin"인 경우)
    const isNewRoomCreation = !extractedRoomId || 
                             extractedRoomId === 'admin' || 
                             extractedRoomId === 'null' || 
                             (messageData && messageData.room_index === null);
    
    if (isNewRoomCreation) {
      // 새로운 방 생성인 경우 "admin" 사용
      console.log('📤 새 방 생성 메시지 전송 (admin 사용):', { roomId, messageData });
      try {
        stompClient.publish({
          destination: `/app/adminchat.sendMessage/admin`,
          body: JSON.stringify(messageData)
        });
        console.log('✅ 새 방 생성 메시지 전송 완료');
        return true;
      } catch (error) {
        console.error('❌ 새 방 생성 메시지 전송 실패:', error);
        return false;
      }
    }
    
    // 기존 방인 경우 숫자만 추출
    console.log('📤 채팅 메시지 전송:', extractedRoomId);
    extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
    
    if (!extractedRoomId) {
      console.error('❌ 유효하지 않은 roomId:', roomId);
      return false;
    }

    try {
      console.log('📤 채팅 메시지 전송:', { roomId, extractedRoomId, messageData });
      stompClient.publish({
        destination: `/app/adminchat.sendMessage/${extractedRoomId}`,
        body: JSON.stringify(messageData)
      });
      console.log('✅ 채팅 메시지 전송 완료');
      return true;
    } catch (error) {
      console.error('❌ 채팅 메시지 전송 실패:', error);
      return false;
    }
  };

  // 메시지 삭제 함수
  const deleteMessage = (roomId, messageIndex) => {
    if (!stompClient || !stompClient.connected) {
      console.error('❌ 채팅 WebSocket이 연결되지 않았습니다.');
      return false;
    }

    // roomId를 안전하게 추출 (객체인 경우 처리)
    let extractedRoomId = roomId;
    
    // roomId가 객체인 경우 room_index 필드 추출
    if (extractedRoomId && typeof extractedRoomId === 'object') {
      extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
    }
    
    // 문자열로 변환하고 숫자만 추출
    extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
    
    if (!extractedRoomId) {
      console.error('❌ 유효하지 않은 roomId:', roomId);
      return false;
    }

    try {
      console.log('🗑️ 채팅 메시지 삭제:', { roomId, extractedRoomId, messageIndex });
      stompClient.publish({
        destination: `/app/adminchat.deleteMessage/${extractedRoomId}`,
        body: JSON.stringify({
          message_index: messageIndex
        })
      });
      console.log('✅ 채팅 메시지 삭제 완료');
      return true;
    } catch (error) {
      console.error('❌ 채팅 메시지 삭제 실패:', error);
      return false;
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
      }
      disconnectWebSocket();
    };
  }, []);

  const contextValue = {
    isConnected,
    stompClient,
    connectWebSocket,
    disconnectWebSocket,
    subscribeToRoom,
    unsubscribeFromRoom,
    sendMessage,
    deleteMessage
  };

  return (
    <ChatWebSocketContext.Provider value={contextValue}>
      {children}
    </ChatWebSocketContext.Provider>
  );
}; 