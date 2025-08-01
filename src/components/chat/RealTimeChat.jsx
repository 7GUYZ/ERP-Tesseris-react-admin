import React, { useState, useEffect } from 'react';

import RealTimeChatButton from './RealTimeChatButton';
import ChatMainWindow from './ChatMainWindow';
import ChatRoomWindow from './ChatRoomWindow';
import { useChatWebSocket } from '../../context/ChatWebSocketContext';

function RealTimeChat() {
  // ChatWebSocket Context 사용
  const { 
    stompClient, 
    isConnected, 
    currentUser: contextCurrentUser,
    connectWebSocket,
    disconnectWebSocket
  } = useChatWebSocket();
  
  // 채팅 시스템 상태
  const [currentView, setCurrentView] = useState('closed'); // 'closed', 'main', 'room'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // localStorage에서 사용자 정보 가져오기 및 WebSocket 연결
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
        
        // Context의 WebSocket 연결 사용
        if (currentView !== 'closed') {
          connectWebSocket(user);
        }
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        // 파싱 실패 시 기본값 사용
        const guestUser = {
          id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: `게스트${Math.floor(Math.random() * 1000)}`,
          avatar: null
        };
        setCurrentUser(guestUser);
        
        if (currentView !== 'closed') {
          connectWebSocket(guestUser);
        }
      }
    } else {
      console.warn('로그인 정보 없음, 기본 사용자 생성');
      // 로그인 정보 없으면 기본값 사용
      const guestUser = {
        id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: `게스트${Math.floor(Math.random() * 1000)}`,
        avatar: null
      };
      setCurrentUser(guestUser);
      
      if (currentView !== 'closed') {
        connectWebSocket(guestUser);
      }
    }
  }, [currentView, connectWebSocket]);



  // 버튼 클릭 핸들러 - ChatMainWindow 열기
  const handleChatButtonClick = () => {
    setCurrentView('main');
    setUnreadCount(0); // 메인 창 열면 읽지 않은 메시지 카운트 리셋
  };

  // 메인 창 닫기
  const handleMainWindowClose = () => {
    setCurrentView('closed');
    // Context의 WebSocket 연결 해제 사용
    disconnectWebSocket();
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
    
    // 채팅방 퇴장 메시지 전송 (TODO: Context에 퇴장 메서드 추가 후 사용)
    if (stompClient && stompClient.connected && selectedRoom && currentUser) {
      stompClient.send('/app/chat/leave', {}, JSON.stringify({
        roomId: selectedRoom.id,
        user: currentUser
      }));
    }
    
    setSelectedRoom(null);
    // Context의 WebSocket 연결 해제 사용
    disconnectWebSocket();
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