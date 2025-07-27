/**
 * WebSocket 연결 상태 확인 및 관리 유틸리티
 */

/**
 * WebSocket 연결 상태 확인
 * @returns {boolean} 연결 상태
 */
export const isWebSocketConnected = () => {
  return window.stompClient && window.stompClient.connected;
};

/**
 * WebSocket 연결 정보 출력
 */
export const logWebSocketStatus = () => {
  if (window.stompClient) {
    console.log('WebSocket 상태:', {
      connected: window.stompClient.connected,
      subscriptions: window.stompClient.subscriptions ? Object.keys(window.stompClient.subscriptions) : [],
      clientId: window.stompClient.clientId
    });
  } else {
    console.log('WebSocket 클라이언트가 없습니다.');
  }
};

/**
 * WebSocket 재연결 시도
 * @param {string} accessToken 액세스 토큰
 * @param {string} userIndex 사용자 인덱스
 * @param {Function} onMessage 메시지 수신 콜백
 */
export const reconnectWebSocket = (accessToken, userIndex, onMessage) => {
  if (window.stompClient && window.stompClient.connected) {
    console.log('WebSocket이 이미 연결되어 있습니다.');
    return;
  }

  console.log('WebSocket 재연결 시도...');
  
  const SockJS = require('sockjs-client');
  const { Client: StompClient } = require('@stomp/stompjs');
  
  const socket = new SockJS('/ws/notifications');
  const stompClient = new StompClient({
    webSocketFactory: () => socket,
    debug: (str) => console.log(str)
  });

  const headers = {
    'Authorization': 'Bearer ' + accessToken
  };

  stompClient.onConnect = (frame) => {
    console.log('WebSocket 재연결 성공');
    
    // 구독
    stompClient.subscribe('/topic/notifications/' + userIndex, (message) => {
      const notification = JSON.parse(message.body);
      console.log('알림 수신:', notification);
      if (onMessage) {
        onMessage(notification);
      }
    });
    
    window.stompClient = stompClient;
  };

  stompClient.onStompError = (frame) => {
    console.error('WebSocket 재연결 오류:', frame);
  };

  stompClient.activate();
};

/**
 * 테스트 알림 전송 (개발용)
 */
export const sendTestNotification = () => {
  if (window.stompClient && window.stompClient.connected) {
    console.log('테스트 알림 전송 시도...');
    // 실제로는 백엔드에서 전송하지만, 연결 상태 확인용
    window.stompClient.publish({
      destination: '/app/test',
      body: JSON.stringify({ message: '테스트 알림' })
    });
  } else {
    console.log('WebSocket이 연결되지 않았습니다.');
  }
}; 