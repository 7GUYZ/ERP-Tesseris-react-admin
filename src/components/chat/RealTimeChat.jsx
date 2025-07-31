import React, { useState } from 'react';

import RealTimeChatButton from './RealTimeChatButton';
import ChatMainWindow from './ChatMainWindow';
import ChatRoomWindow from './ChatRoomWindow';

function RealTimeChat() {
  const [currentView, setCurrentView] = useState('closed');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 400, height: 600 });
  const [windowPosition, setWindowPosition] = useState({ x: window.innerWidth - 450, y: 100 });

  // 실시간 사이즈 추적
  const handleSizeChange = (newSize) => {
    setWindowSize(newSize);
  };

  // 실시간 위치 추적
  const handlePositionChange = (newPosition) => {
    setWindowPosition(newPosition);
  };

  const handleChatButtonClick = () => {
    if (currentView === 'closed') {
      setCurrentView('main');
    } else {
      setCurrentView('closed');
    }
  };

  const handleMainWindowClose = () => {
    setCurrentView('closed');
  };

  const handleRoomSelect = (roomData) => {
    setSelectedRoom(roomData);
    setCurrentView('room');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedRoom(null);
  };

  const handleRoomClose = () => {
    setCurrentView('closed');
    setSelectedRoom(null);
  };

  return (
    <>
      <RealTimeChatButton
        onClick={handleChatButtonClick}
        unreadCount={0}
        isOnline={false}
      />

      <ChatMainWindow
        open={currentView === 'main'}
        onClose={handleMainWindowClose}
        onRoomSelect={handleRoomSelect}
        onSizeChange={handleSizeChange}
        onPositionChange={handlePositionChange}
        currentSize={windowSize}
        currentPosition={windowPosition}
      />

      <ChatRoomWindow
        open={currentView === 'room'}
        onClose={handleRoomClose}
        onBack={handleBackToMain}
        roomData={selectedRoom}
        onSizeChange={handleSizeChange}
        onPositionChange={handlePositionChange}
        currentSize={windowSize}
        currentPosition={windowPosition}
      />
    </>
  );
}

export default RealTimeChat; 