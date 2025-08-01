import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

// WebSocket Context 생성
const WebSocketContext = createContext(null);

// WebSocket 훅
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// WebSocket Provider 컴포넌트
export const WebSocketChatProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

  // 연결 상태 동기화를 위한 useEffect
  useEffect(() => {
    const checkConnectionStatus = () => {
      if (stompClientRef.current) {
        const actualConnected = stompClientRef.current.connected;
        if (isConnected !== actualConnected) {
          console.log(`🔄 연결 상태 동기화: ${isConnected} → ${actualConnected}`);
          setIsConnected(actualConnected);
        }
      }
    };

    // 주기적으로 연결 상태 확인
    const interval = setInterval(checkConnectionStatus, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // WebSocket 연결 함수
  const connectWebSocket = async (accessToken, userIndex) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log('🔄 이미 WebSocket이 연결되어 있습니다.');
      return;
    }

    try {
      console.log('🔌 WebSocket 연결 시도...', { userIndex });

      // Bearer 접두사 제거
      const cleanToken = accessToken.startsWith('Bearer ') ? accessToken.substring(7) : accessToken;

      // WebSocket URL 설정
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
      const stompClient = new StompClient({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 30000,
        heartbeatOutgoing: 30000,
        connectHeaders: {
          'Authorization': 'Bearer ' + cleanToken
        }
      });

      stompClient.onConnect = () => {
        console.log('✅ WebSocket 연결 성공!');
        setIsConnected(true);
        stompClientRef.current = stompClient;
        console.log('🔗 연결 상태 업데이트:', stompClient.connected);

        // 연결 성공 후 기존 구독 복구
        if (subscriptionsRef.current.size > 0) {
          console.log('🔄 기존 구독 복구 시도...');
          subscriptionsRef.current.forEach((subscription, roomId) => {
            console.log(`🔄 방 ${roomId} 구독 복구`);
            // 구독은 이미 저장되어 있으므로 별도 처리 불필요
          });
        }
      };

      stompClient.onStompError = (frame) => {
        console.error('❌ WebSocket STOMP 오류:', frame);
        setIsConnected(false);
        stompClientRef.current = null;
      };

      stompClient.onDisconnect = () => {
        console.log('🔌 WebSocket 연결 해제됨');
        setIsConnected(false);
        setCurrentRoomId(null);
        subscriptionsRef.current.clear();
        stompClientRef.current = null;
      };

      stompClient.onWebSocketError = (error) => {
        console.error('❌ WebSocket 오류:', error);
        setIsConnected(false);
        stompClientRef.current = null;
      };

      await stompClient.activate();

    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      setIsConnected(false);
    }
  };

  // WebSocket 연결 해제 함수
  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      setIsConnected(false);
      setCurrentRoomId(null);
      subscriptionsRef.current.clear();
    }
  };

  // 채팅방 구독 함수
  const subscribeToRoom = (roomId, onMessageReceived) => {
    console.log('🔍 구독 시도 - 연결 상태:', isConnected, '클라이언트:', !!stompClientRef.current);

    // 연결 대기 함수
    const waitForConnection = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkConnection = () => {
          attempts++;
          console.log(`🔍 연결 확인 시도 ${attempts}/${maxAttempts}`);

          if (stompClientRef.current && stompClientRef.current.connected) {
            console.log('✅ 연결 확인됨');
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.error('❌ 연결 대기 시간 초과');
            reject(new Error('연결 대기 시간 초과'));
          } else {
            setTimeout(checkConnection, 500);
          }
        };

        checkConnection();
      });
    };

    const performSubscription = async () => {
      try {
        // 연결 대기
        await waitForConnection();

        // 기존 구독 해제
        unsubscribeFromRoom(roomId);

        // 새로운 구독 생성
        const subscription = stompClientRef.current.subscribe(`/queue/${roomId}`, (message) => {
          console.log(`📨 채팅방 ${roomId} 메시지 수신:`, message.body);
          const messageData = JSON.parse(message.body);
          onMessageReceived(messageData);
        });

        // 구독 정보 저장
        subscriptionsRef.current.set(roomId, subscription);
        setCurrentRoomId(roomId);

        console.log(`✅ 채팅방 ${roomId} 구독 완료`);
        return true;

      } catch (error) {
        console.error(`❌ 채팅방 ${roomId} 구독 실패:`, error);
        return false;
      }
    };

    // 연결이 없으면 재연결 시도
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.log('🔄 연결이 없어 재연결 시도...');
      const token = localStorage.getItem('access-token');
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      if (token && userInfo) {
        connectWebSocket(token, userInfo.user_index);
        // 재연결 후 구독 시도
        setTimeout(() => performSubscription(), 1000);
        return true; // 구독 진행 중으로 반환
      }
      return false;
    }

    return performSubscription();
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

  // 메시지 전송 함수
  const sendMessage = (roomId, messageData) => {
    console.log('🔍 메시지 전송 시도 - 연결 상태:', isConnected, '클라이언트:', !!stompClientRef.current);

    // 연결 대기 함수
    const waitForConnection = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkConnection = () => {
          attempts++;
          console.log(`🔍 전송 연결 확인 시도 ${attempts}/${maxAttempts}`);

          if (stompClientRef.current && stompClientRef.current.connected) {
            console.log('✅ 전송 연결 확인됨');
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.error('❌ 전송 연결 대기 시간 초과');
            reject(new Error('전송 연결 대기 시간 초과'));
          } else {
            setTimeout(checkConnection, 500);
          }
        };

        checkConnection();
      });
    };

    const performSend = async () => {
      try {
        // 연결 대기
        await waitForConnection();

        stompClientRef.current.publish({
          destination: `/app/adminchat.sendMessage/${roomId}`,
          body: JSON.stringify(messageData)
        });

        console.log(`📤 채팅방 ${roomId} 메시지 전송:`, messageData);
        return true;

      } catch (error) {
        console.error(`❌ 메시지 전송 실패:`, error);
        return false;
      }
    };

    // 연결이 없으면 재연결 시도
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.log('🔄 전송을 위해 재연결 시도...');
      const token = localStorage.getItem('access-token');
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      if (token && userInfo) {
        connectWebSocket(token, userInfo.user_index);
        // 재연결 후 전송 시도
        setTimeout(() => performSend(), 1000);
        return true; // 전송 진행 중으로 반환
      }
      return false;
    }

    return performSend();
  };

  // 컴포넌트 언마운트 시 정리


  
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const contextValue = {
    isConnected,
    currentRoomId,
    connectWebSocket,
    disconnectWebSocket,
    subscribeToRoom,
    unsubscribeFromRoom,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketChatProvider;
