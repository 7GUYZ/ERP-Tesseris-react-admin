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
      return;
    }

    try {

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
        setIsConnected(true);
        stompClientRef.current = stompClient;

        // 연결 성공 후 기존 구독 복구
        if (subscriptionsRef.current.size > 0) {
          subscriptionsRef.current.forEach((subscription, roomId) => {
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
        setIsConnected(false);
        setCurrentRoomId(null);
        subscriptionsRef.current.clear();
        stompClientRef.current = null;
      };

      stompClient.onWebSocketError = (error) => {
        setIsConnected(false);
        stompClientRef.current = null;
      };

      await stompClient.activate();

    } catch (error) {
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
    // roomId 유효성 검사
    if (!roomId || roomId === 'undefined' || roomId === 'null' || roomId === '') {
      return false;
    }

    // 이미 구독 중인지 확인
    if (subscriptionsRef.current.has(roomId)) {
      return true; // 이미 구독 중이면 성공으로 반환
    }

    // 연결 대기 함수
    const waitForConnection = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkConnection = () => {
          attempts++;

          if (stompClientRef.current && stompClientRef.current.connected) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
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

        // 새로운 구독 생성 (기존 구독 해제 없이)
        const subscription = stompClientRef.current.subscribe(`/queue/${roomId}`, (message) => {
          const messageData = JSON.parse(message.body);
          onMessageReceived(messageData);
        });

        // 구독 정보 로그 출력
        console.log(`🔔 WebSocket 구독 생성: /queue/${roomId}, id=${subscription.id}, session=${stompClientRef.current.sessionId}`);

        // 구독 정보 저장
        subscriptionsRef.current.set(roomId, subscription);
        setCurrentRoomId(roomId);

        return true;

      } catch (error) {
        return false;
      }
    };

    // 연결이 없으면 재연결 시도
    if (!stompClientRef.current || !stompClientRef.current.connected) {
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
      try {
        console.log(`🔔 WebSocket 구독 해제: /queue/${roomId}, id=${subscription.id}, session=${stompClientRef.current?.sessionId}`);
        subscription.unsubscribe();
        subscriptionsRef.current.delete(roomId);
        
        // 현재 방 ID가 해제된 방과 같으면 null로 설정
        if (currentRoomId === roomId) {
          setCurrentRoomId(null);
        }
      } catch (error) {
        // 에러가 발생해도 Map에서 제거
        subscriptionsRef.current.delete(roomId);
      }
    }
  };

  // 메시지 전송 함수
  const sendMessage = (roomId, messageData) => {

    // 연결 대기 함수
    const waitForConnection = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkConnection = () => {
          attempts++;

          if (stompClientRef.current && stompClientRef.current.connected) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
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

        return true;

      } catch (error) {
        return false;
      }
    };

    // 연결이 없으면 재연결 시도
    if (!stompClientRef.current || !stompClientRef.current.connected) {
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
