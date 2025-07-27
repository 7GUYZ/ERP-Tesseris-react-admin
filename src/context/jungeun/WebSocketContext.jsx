import React, { createContext, useContext, useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

export const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const stompClientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket 연결 함수
  const connectWebSocket = (accessToken, userIndex, onMessage) => {
    // 이미 연결되어 있다면 해제
    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log('이미 WebSocket이 연결되어 있습니다.');
      return;
    }

    console.log('WebSocket 연결 시도...');
    
    const socket = new SockJS('/ws/notifications');
    // 브라우저별 WebSocket 설정
    const isEdge = navigator.userAgent.includes('Edge');
    
    const stompClient = new StompClient({
      webSocketFactory: () => socket,
      debug: () => {}, // 디버그 로그 비활성화
      reconnectDelay: 5000, // 5초로 통일
      heartbeatIncoming: 30000, // 30초로 통일
      heartbeatOutgoing: 30000,
      connectHeaders: {
        'Authorization': 'Bearer ' + accessToken
      }
    });

        stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket 연결됨');
      
      // 구독
      const topic = '/topic/notifications/' + userIndex;
      stompClient.subscribe(topic, (message) => {
        const notification = JSON.parse(message.body);
        console.log('📨 알림 수신:', notification);
        console.log('📨 알림 메시지:', notification.message);
        console.log('📨 알림 타입:', notification.type);
        console.log('📨 알림 시간:', new Date(notification.timestamp).toLocaleString());
        
        if (onMessage) onMessage(notification);
        
        // 알림 전용 토스트 사용
        if (window.showNotificationToast) {
          console.log('📢 알림 토스트 표시:', notification.message);
          window.showNotificationToast('info', notification.message);
        }
      });
      
      stompClientRef.current = stompClient;
      window.stompClient = stompClient;
      
            // 연결 완료
    };

    stompClient.onStompError = (frame) => {
      console.error('❌ WebSocket 오류');
    };

    stompClient.onWebSocketClose = () => {
      console.log('🔌 WebSocket 끊어짐');
      stompClientRef.current = null;
      window.stompClient = null;
      
      // StompClient 내장 재연결 사용 (수동 재연결 제거)
      // reconnectTimeoutRef 제거
    };

    stompClient.activate();
  };

  // WebSocket 해제 함수
  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      window.stompClient = null;
    }
  };

  // 연결 상태 확인 함수
  const isConnected = () => {
    return stompClientRef.current && stompClientRef.current.connected;
  };

  // 수동 재연결 함수
  const forceReconnect = () => {
    disconnectWebSocket();
    
    const userInfo = JSON.parse(localStorage.getItem('user-info'));
    const token = localStorage.getItem('access-token');
    
    if (userInfo && token) {
      setTimeout(() => {
        connectWebSocket(token, userInfo.user_index, (notification) => {
          console.log('📨 알림:', notification.message);
        });
      }, 1000);
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // 연결 상태 모니터링 제거 (StompClient 내장 재연결 사용)
  // useEffect(() => {
  //   const checkConnection = () => {
  //     if (stompClientRef.current) {
  //       const isEdge = navigator.userAgent.includes('Edge');
  //       
  //       // Edge에서 연결이 끊어졌을 때 즉시 재연결 시도
  //       if (isEdge && !stompClientRef.current.connected) {
  //         forceReconnect();
  //       }
  //     }
  //   };

  //   const isEdge = navigator.userAgent.includes('Edge');
  //   const interval = setInterval(checkConnection, isEdge ? 15000 : 30000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <WebSocketContext.Provider value={{ 
      stompClientRef, 
      connectWebSocket, 
      disconnectWebSocket,
      isConnected,
      forceReconnect
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};