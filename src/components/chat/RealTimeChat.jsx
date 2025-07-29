import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

import RealTimeChatButton from './RealTimeChatButton';
import ChatMainWindow from './ChatMainWindow';
import ChatRoomWindow from './ChatRoomWindow';

function RealTimeChat() {
  // 채팅 시스템 상태
  const [currentView, setCurrentView] = useState('closed'); // 'closed', 'main', 'room'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);
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

  // WebSocket 연결 (메인 창이 열릴 때만)
  useEffect(() => {
    if (!currentUser || currentView === 'closed') return;

    console.log('🔗 WebSocket 연결 시도:', currentUser.name, currentUser.id);

    // 이미 연결되어 있다면 중복 연결 방지
    if (socket?.connected) {
      console.log('⚠️ 이미 연결되어 있음, 새 연결 건너뛰기');
      return;
    }
    const socketConnection = io(process.env.NODE_ENV === 'development' ? 'ws://localhost:4000' : `ws://${process.env.REACT_APP_CHAT_SERVER_HOST}:4000`, {
      query: { userId: currentUser.id, userName: currentUser.name },
      forceNew: true,
      timeout: 5000,
      transports: ['websocket']
    });

    socketConnection.on('connect', () => {
      setIsConnected(true);
      console.log('✅ 채팅 서버에 연결됨:', socketConnection.id, '사용자:', currentUser.name);
    });

    socketConnection.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ 채팅 서버 연결 끊김:', reason, '사용자:', currentUser.name);
    });

    socketConnection.on('connect_error', (error) => {
      console.error('🚨 연결 오류:', error);
      setIsConnected(false);
    });

    // 전역 알림 처리
    socketConnection.on('message', (message) => {
      console.log('🌍 전역 메시지 수신:', message);
      
      if (currentView === 'closed' && 
          message.sender && 
          message.sender.id && 
          currentUser && 
          message.sender.id !== currentUser.id) {
        setUnreadCount(prev => prev + 1);
      }
    });

    setSocket(socketConnection);

    // 정리 함수
    return () => {
      console.log('🔌 WebSocket 연결 정리:', currentUser.name, currentUser.id);
      if (socketConnection.connected) {
        socketConnection.disconnect();
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
    // 소켓 연결 해제
    if (socket?.connected) {
      socket.disconnect();
      setSocket(null);
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
    
    if (socket && selectedRoom && currentUser) {
      socket.emit('leaveRoom', { 
        roomId: selectedRoom.id, 
        user: currentUser 
      });
    }

    // 소켓 연결 해제
    if (socket?.connected) {
      socket.disconnect();
      setSocket(null);
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

      {/* 메인 채팅 창 (친구, 채팅방 목록, 설정) */}
      <ChatMainWindow
        open={currentView === 'main'}
        onClose={handleMainWindowClose}
        onRoomSelect={handleRoomSelect}
        socket={socket}
        currentUser={currentUser}
      />

      {/* 개별 채팅방 창 */}
      <ChatRoomWindow
        open={currentView === 'room'}
        onClose={handleRoomClose}
        onBack={handleBackToMain}
        roomData={selectedRoom}
        socket={socket}
        currentUser={currentUser}
      />
    </>
  );
}

export default RealTimeChat; 