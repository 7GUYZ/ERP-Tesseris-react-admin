import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

import RealTimeChatButton from './RealTimeChatButton';
import ChatMainWindow from './ChatMainWindow';
import ChatRoomWindow from './ChatRoomWindow';

function RealTimeChat() {
  // 채팅 시스템 상태
  const [currentView, setCurrentView] = useState('closed'); // 'closed', 'main', 'room'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // localStorage에서 사용자 정보 가져오기
  useEffect(() => {
    const userInfoStr = localStorage.getItem('user-info');
    
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        const user = {
          id: userInfo.id, // 로그인된 사용자 ID 사용
          name: userInfo.name, // 로그인된 사용자 이름 사용 (예: "김관리")
          avatar: null
        };
        
        console.log('👤 로그인된 사용자 정보 사용:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        // 파싱 실패 시 기본값 사용
        setCurrentUser({
          id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: `게스트${Math.floor(Math.random() * 1000)}`,
          avatar: null
        });
      }
    } else {
      console.warn('로그인 정보 없음, 기본 사용자 생성');
      // 로그인 정보 없으면 기본값 사용
      setCurrentUser({
        id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `게스트${Math.floor(Math.random() * 1000)}`,
        avatar: null
      });
    }
  }, []);

  // STOMP WebSocket 연결 (메인 창이 열릴 때만)
  useEffect(() => {
    if (!currentUser || currentView === 'closed') return;

    console.log('🔗 STOMP WebSocket 연결 시도:', currentUser.name, currentUser.id);

    // 이미 연결되어 있다면 중복 연결 방지
    if (stompClient?.connected) {
      console.log('⚠️ 이미 연결되어 있음, 새 연결 건너뛰기');
      return;
    }

    // SockJS + STOMP 연결 설정
    const socket = new SockJS('http://localhost:8080/ws'); // Spring Boot WebSocket 엔드포인트
    const client = Stomp.over(socket);

    // STOMP 연결 옵션
    const connectHeaders = {
      'user-id': currentUser.id,
      'user-name': currentUser.name
    };

    client.connect(connectHeaders, 
      // 연결 성공 콜백
      (frame) => {
        setIsConnected(true);
        console.log('✅ STOMP 서버에 연결됨:', frame, '사용자:', currentUser.name);

        // 전역 채팅 토픽 구독
        client.subscribe('/topic/global', (message) => {
          const messageData = JSON.parse(message.body);
          console.log('🌍 전역 메시지 수신:', messageData);
          
          // 창이 닫혀있고, 다른 사용자의 메시지인 경우 읽지 않은 메시지 카운트 증가
          if (currentView === 'closed' && 
              messageData.sender && 
              messageData.sender.id && 
              currentUser && 
              messageData.sender.id !== currentUser.id) {
            setUnreadCount(prev => prev + 1);
          }
        });

        // 사용자별 개인 메시지 토픽 구독
        client.subscribe(`/topic/user/${currentUser.id}`, (message) => {
          const messageData = JSON.parse(message.body);
          console.log('📨 개인 메시지 수신:', messageData);
        });

        // 온라인 사용자 토픽 구독
        client.subscribe('/topic/users', (message) => {
          const users = JSON.parse(message.body);
          console.log('👥 온라인 사용자 업데이트:', users);
        });

        setStompClient(client);
      },
      // 연결 실패 콜백
      (error) => {
        console.error('🚨 STOMP 연결 오류:', error);
        setIsConnected(false);
      }
    );

    // 연결 해제 이벤트
    client.onWebSocketClose = (event) => {
      setIsConnected(false);
      console.log('❌ STOMP 서버 연결 끊김:', event, '사용자:', currentUser.name);
    };

    // 정리 함수
    return () => {
      console.log('🔌 STOMP 연결 정리:', currentUser.name, currentUser.id);
      if (client.connected) {
        client.disconnect();
      }
    };
  }, [currentUser?.id, currentView]);

  // 버튼 클릭 핸들러 - ChatMainWindow 열기
  const handleChatButtonClick = () => {
    setCurrentView('main');
    setUnreadCount(0); // 메인 창 열면 읽지 않은 메시지 카운트 리셋
  };

  // 메인 창 닫기
  const handleMainWindowClose = () => {
    setCurrentView('closed');
    // STOMP 연결 해제
    if (stompClient?.connected) {
      stompClient.disconnect();
      setStompClient(null);
      setIsConnected(false);
    }
  };

  // 채팅방 선택 핸들러
  const handleRoomSelect = (roomData) => {
    console.log('선택된 채팅방:', roomData);
    setSelectedRoom(roomData);
    setCurrentView('room');
  };

  // 채팅방에서 메인으로 돌아가기
  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedRoom(null);
  };

  // 채팅방 닫기
  const handleRoomClose = () => {
    setCurrentView('closed');
    setSelectedRoom(null);
    
    // 채팅방 퇴장 메시지 전송
    if (stompClient && stompClient.connected && selectedRoom && currentUser) {
      stompClient.send('/app/chat/leave', {}, JSON.stringify({
        roomId: selectedRoom.id,
        user: currentUser
      }));
    }

    // STOMP 연결 해제
    if (stompClient?.connected) {
      stompClient.disconnect();
      setStompClient(null);
      setIsConnected(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* 드래그 가능한 채팅 버튼 */}
      <RealTimeChatButton
        onClick={handleChatButtonClick}
        unreadCount={unreadCount}
        isOnline={isConnected}
      />

      {/* 메인 채팅 창 (관리자, 채팅방 목록, 설정) */}
      <ChatMainWindow
        open={currentView === 'main'}
        onClose={handleMainWindowClose}
        onRoomSelect={handleRoomSelect}
        stompClient={stompClient}
        currentUser={currentUser}
      />

      {/* 개별 채팅방 창 */}
      <ChatRoomWindow
        open={currentView === 'room'}
        onClose={handleRoomClose}
        onBack={handleBackToMain}
        roomData={selectedRoom}
        stompClient={stompClient}
        currentUser={currentUser}
      />
    </>
  );
}

export default RealTimeChat; 