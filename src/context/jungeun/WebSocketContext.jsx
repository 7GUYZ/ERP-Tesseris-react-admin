import React, { createContext, useContext, useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

export const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const stompClientRef = useRef(null);

  // WebSocket 연결 함수
  const connectWebSocket = (accessToken, userIndex, onMessage) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log('🔄 이미 WebSocket이 연결되어 있습니다.');
      return;
    }
    console.log('🔌 WebSocket 연결 시도...', { userIndex, accessToken: accessToken ? '있음' : '없음' });
    
    // Bearer 접두사 제거
    const cleanToken = accessToken.startsWith('Bearer ') ? accessToken.substring(7) : accessToken;
    
    // WebSocket URL 설정 - 배포환경 최적화
    const getWebSocketUrl = () => {
      const currentHost = window.location.hostname;
      const currentProtocol = window.location.protocol;
      
      // 개발 환경 (localhost)
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return `${currentProtocol}//${currentHost}:19091/api/springboot/ws/notifications`;
      }
      
      // 배포 환경 (kschost.ddns.net)
      if (currentHost === 'kschost.ddns.net') {
        return `${currentProtocol}//${currentHost}/api/springboot/ws/notifications`;
      }
      
      // 기타 배포 환경
      return `${currentProtocol}//${currentHost}/api/springboot/ws/notifications`;
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
      const topic = '/topic/notifications/' + userIndex;
      console.log('📡 구독 토픽:', topic);
      
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
      console.log('💾 WebSocket 클라이언트 저장 완료');
    };

    stompClient.onStompError = (frame) => {
      console.error('❌ WebSocket STOMP 오류:', frame);
    };
    
    stompClient.onWebSocketClose = () => {
      console.log('🔌 WebSocket 연결 종료');
      stompClientRef.current = null;
      window.stompClient = null;
    };
    
    stompClient.onWebSocketError = (error) => {
      console.error('❌ WebSocket 오류:', error);
    };

    stompClient.activate();
  };

  // WebSocket 해제 함수
  const disconnectWebSocket = () => {
    console.log('🔌 WebSocket 연결 해제 시도...');
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      window.stompClient = null;
      console.log('✅ WebSocket 연결 해제 완료');
    } else {
      console.log('ℹ️ 이미 WebSocket이 해제되어 있습니다.');
    }
  };

  // 연결 상태 확인 함수
  const isConnected = () => {
    const connected = stompClientRef.current && stompClientRef.current.connected;
    console.log('🔍 WebSocket 연결 상태:', connected);
    return connected;
  };

  // 수동 재연결 함수
  const forceReconnect = () => {
    console.log('🔄 수동 재연결 시도...');
    disconnectWebSocket();
    const userInfo = JSON.parse(localStorage.getItem('user-info'));
    const token = localStorage.getItem('access-token');
    if (userInfo && token) {
      console.log('🔄 재연결 정보:', { userIndex: userInfo.user_index, hasToken: !!token });
              setTimeout(() => {
          connectWebSocket(token, userInfo.user_index, (notification) => {
            console.log('📨 재연결 후 알림 수신:', notification);
            if (window.showNotificationToast) window.showNotificationToast('info', notification.message);
          });
        }, 1000);
    } else {
      console.log('❌ 재연결 실패: 사용자 정보 또는 토큰 없음');
    }
  };

  useEffect(() => () => { disconnectWebSocket(); }, []);

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