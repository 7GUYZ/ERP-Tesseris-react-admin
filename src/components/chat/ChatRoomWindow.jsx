import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper, Box, TextField, Button, IconButton,
  Typography, Chip
} from '@mui/material';
import {
  Close, Send, Minimize, DragIndicator,
  ArrowBack, Call, VideoCall, Info, AttachFile
} from '@mui/icons-material';
import { useWebSocket } from './WebSocketConfig';
import { SaveSendMessage } from '../../api/auth/JihunAuth';

function ChatRoomWindow({
  open,
  onClose,
  onBack,
  roomData,
  onSizeChange,
  onPositionChange,
  currentSize,
  currentPosition
}) {
  const [roomId, setRoomId] = useState(null);  // 생성된 방 ID 저장
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [position, setPosition] = useState(currentPosition || {
    x: Math.max(0, window.innerWidth - Math.min(450, window.innerWidth * 0.9)),
    y: Math.max(0, window.innerHeight * 0.1)
  });
  const { sendMessage, subscribeToRoom, isConnected } = useWebSocket();
  const [size, setSize] = useState(currentSize || { 
    width: Math.min(400, window.innerWidth * 0.9), 
    height: Math.min(600, window.innerHeight * 0.8) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ===============================메세지 보내기=======================================
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      const generateRoomName = (participants) => {
        if (participants.length === 2) {
          // 1:1 채팅
          const otherUser = participants.find(p => p !== userInfo.id);
          return `${otherUser}님과의 채팅`;
        } else if (participants.length > 2) {
          // 단체 채팅
          const otherUsers = participants.filter(p => p !== userInfo.id);
          return `${otherUsers.join(', ')}님과의 채팅`;
        }
        return '채팅방';
      };

      try {
        // 메시지 전송 로직...
        const messageData = {
          room_index: roomId || null,
          room_name: generateRoomName([roomData.adminData.userId, userInfo.id]),
          user_id: userInfo.id,
          message: newMessage,
          participants: [roomData.adminData.userId, userInfo.id], // 관리자의 userId와 사용자의 id
          timestamp: null,
        };

        // 1. 메세지 DB 저장
        const response = await SaveSendMessage(messageData);
        console.log("API 응답 전체:", response);
        
        // 2. 방이 생성된 경우 roomId 업데이트 및 구독 요청
        if (response && response?.data?.data) {
          const newRoomId = response.data.data;
          console.log("방인덱스", newRoomId);
          setRoomId(newRoomId);
          
          // 3. 첫 메세지인 경우 방 구독 요청 (roomId가 null이거나 변경된 경우)
          if (!roomId || roomId !== newRoomId) {
            console.log("첫 메시지 또는 방 변경 - 구독 요청, 방 ID:", newRoomId);
            const subscribeSuccess = subscribeToRoom(newRoomId, (receivedMessage) => {
              console.log('새 메시지 수신:', receivedMessage);

              // 내가 보낸 메시지가 아닌 경우에만 추가
              if (receivedMessage.user_id !== userInfo.id) {
                setMessages(prev => [...prev, {
                  text: receivedMessage.message,
                  sender: { id: receivedMessage.user_id, name: receivedMessage.user_id },
                  timestamp: receivedMessage.timestamp || new Date().toISOString()
                }]);
              }
            });

            if (subscribeSuccess) {
              console.log(`채팅방 ${newRoomId} 구독 완료`);
            }
          }
          
          // 4. WebSocket으로 메시지 전송 (업데이트된 roomId 사용)
          console.log("WebSocket 메시지 전송 - 방 ID:", newRoomId);
          sendMessage(newRoomId, messageData);
        } else {
          console.log("방인덱스 없음 - 기존 방 사용");
          // 기존 방이 있는 경우 기존 roomId 사용
          if (roomId) {
            sendMessage(roomId, messageData);
          }
        }
        
        // 5. 로컬 메시지 추가
        setMessages(prev => [...prev, {
          text: newMessage,
          sender: { id: userInfo.id, name: userInfo.name },
          timestamp: new Date().toISOString()
        }]);
        setNewMessage('');
        setIsTyping(false);
        
        // 6. 입력 필드에 포커스 유지
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        
      } catch (error) {
        console.error("메시지 전송 실패:", error);
        // 에러 발생 시에도 로컬 메시지는 추가
        setMessages(prev => [...prev, {
          text: newMessage,
          sender: { id: userInfo.id, name: userInfo.name },
          timestamp: new Date().toISOString(),
          error: true // 에러 표시용
        }]);
        setNewMessage('');
        setIsTyping(false);
        
        // 에러 발생 시에도 포커스 유지
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };
// ============================================================================
// 드래그 기능
const handleMouseMove = useCallback((e) => {
  if (!isDragging) return;

  const newX = e.clientX - dragStart.x;
  const newY = e.clientY - dragStart.y;

  const maxX = window.innerWidth - size.width;
  const maxY = window.innerHeight - (isMinimized ? 60 : size.height);

  const newPosition = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  };
  setPosition(newPosition);

  // 최상위 컴포넌트에 위치 변경 알림
  if (onPositionChange) {
    onPositionChange(newPosition);
  }
}, [isDragging, dragStart.x, dragStart.y, isMinimized, size.width, size.height, onPositionChange]);

// 리사이즈 기능
const handleResizeMove = useCallback((e) => {
  if (!isResizing) return;

  const deltaX = e.clientX - resizeStart.x;
  const deltaY = e.clientY - resizeStart.y;

  let newWidth = resizeStart.width;
  let newHeight = resizeStart.height;
  let newX = resizeStart.positionX;
  let newY = resizeStart.positionY;

  // 오른쪽 하단에서 리사이즈
  if (resizeStart.direction === 'bottom-right') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width + deltaX));
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
  }
  // 왼쪽 하단에서 리사이즈
  else if (resizeStart.direction === 'bottom-left') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width - deltaX));
    newX = resizeStart.positionX + (resizeStart.width - newWidth);
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
  }
  // 오른쪽 상단에서 리사이즈
  else if (resizeStart.direction === 'top-right') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width + deltaX));
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height - deltaY));
    newY = resizeStart.positionY + (resizeStart.height - newHeight);
  }
  // 왼쪽 상단에서 리사이즈
  else if (resizeStart.direction === 'top-left') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width - deltaX));
    newX = resizeStart.positionX + (resizeStart.width - newWidth);
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height - deltaY));
    newY = resizeStart.positionY + (resizeStart.height - newHeight);
  }
  // 오른쪽에서 리사이즈
  else if (resizeStart.direction === 'right') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width + deltaX));
  }
  // 왼쪽에서 리사이즈
  else if (resizeStart.direction === 'left') {
    newWidth = Math.max(300, Math.min(window.innerWidth - 50, resizeStart.width - deltaX));
    newX = resizeStart.positionX + (resizeStart.width - newWidth);
  }
  // 아래쪽에서 리사이즈
  else if (resizeStart.direction === 'bottom') {
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
  }
  // 위쪽에서 리사이즈
  else if (resizeStart.direction === 'top') {
    newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height - deltaY));
    newY = resizeStart.positionY + (resizeStart.height - newHeight);
  }

  const maxX = window.innerWidth - newWidth;
  const maxY = window.innerHeight - newHeight;

  const newSize = { width: newWidth, height: newHeight };
  const newPosition = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  };
  setSize(newSize);
  setPosition(newPosition);

  // 최상위 컴포넌트에 사이즈 변경 알림
  if (onSizeChange) {
    onSizeChange(newSize);
  }

  // 최상위 컴포넌트에 위치 변경 알림
  if (onPositionChange) {
    onPositionChange(newPosition);
  }
}, [isResizing, resizeStart, onSizeChange, onPositionChange]);
const handleMouseUp = useCallback(() => {
  setIsDragging(false);
  setIsResizing(false);
}, []);

const handleMouseDown = (e) => {
  if (e.target.closest('.no-drag')) return;

  setIsDragging(true);
  const rect = chatRef.current.getBoundingClientRect();
  setDragStart({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });
};

const handleResizeStart = (e, direction) => {
  e.stopPropagation();
  setIsResizing(true);
  setResizeStart({
    x: e.clientX,
    y: e.clientY,
    width: size.width,
    height: size.height,
    positionX: position.x,
    positionY: position.y,
    direction: direction
  });
};
React.useEffect(() => {
  if (isDragging || isResizing) {
    document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, isResizing, handleMouseMove, handleResizeMove, handleMouseUp]);

  // 화면 크기 변경 시 창 위치 자동 조정
  React.useEffect(() => {
    const handleResize = () => {
      // 모바일에서는 전체 화면으로 조정
      if (window.innerWidth <= 768) {
        setSize({
          width: window.innerWidth <= 480 ? window.innerWidth : window.innerWidth * 0.95,
          height: window.innerHeight * (window.innerWidth <= 480 ? 0.9 : 0.8)
        });
        setPosition({
          x: window.innerWidth <= 480 ? 0 : window.innerWidth * 0.025,
          y: window.innerHeight * (window.innerWidth <= 480 ? 0.05 : 0.1)
        });
      } else {
        // 데스크톱에서는 기존 로직 유지
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - (isMinimized ? 60 : size.height);

        setPosition(prev => ({
          x: Math.max(0, Math.min(prev.x, maxX)),
          y: Math.max(0, Math.min(prev.y, maxY))
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized, size.width, size.height]);

// 메시지 자동 스크롤
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

React.useEffect(() => {
  scrollToBottom();
}, [messages]);


const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};

// 최상위에서 전달받은 값이 변경될 때 로컬 상태 업데이트
React.useEffect(() => {
  if (currentSize) {
    setSize(currentSize);
  }
}, [currentSize]);

React.useEffect(() => {
  if (currentPosition) {
    setPosition(currentPosition);
  }
}, [currentPosition]);

const handleInputChange = (e) => {
  setNewMessage(e.target.value);
  if (!isTyping && e.target.value.trim()) {
    setIsTyping(true);
  }
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    // 파일 업로드 로직을 여기에 구현
    console.log('파일 업로드:', file.name);
  }
};

if (!open || !roomData) return null;

  return (
    <Paper
      ref={chatRef}
      elevation={10}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 60 : size.height,
        zIndex: 1400,
        borderRadius: 2,
        overflow: 'hidden',
        transition: isDragging || isResizing ? 'none' : 'height 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging || isResizing ? 'none' : 'auto',
        // 반응형 스타일
        '@media (max-width: 768px)': {
          width: '95vw',
          height: isMinimized ? 60 : '80vh',
          left: '2.5vw',
          top: '10vh',
          borderRadius: 1,
        },
        '@media (max-width: 480px)': {
          width: '100vw',
          height: isMinimized ? 60 : '90vh',
          left: 0,
          top: '5vh',
          borderRadius: 0,
        }
      }}
    >
    {/* 헤더 */}
          <Box
        onMouseDown={handleMouseDown}
        sx={{
          background: 'linear-gradient(45deg, rgb(33, 150, 243) 30%, rgb(33, 203, 243) 90%)',
          color: 'white',
          p: 1.5,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          // 반응형 헤더
          '@media (max-width: 768px)': {
            p: 1,
          },
          '@media (max-width: 480px)': {
            p: 0.5,
          }
        }}
      >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={onBack}
          sx={{ color: 'white' }}
          className="no-drag"
        >
          <ArrowBack />
        </IconButton>
        <DragIndicator />
                 <Box>
           <Typography variant="subtitle1" sx={{ 
             fontSize: '1rem', 
             lineHeight: 1.2,
             // 반응형 채팅방 이름
             '@media (max-width: 768px)': {
               fontSize: '0.9rem',
               lineHeight: 1.1,
             },
             '@media (max-width: 480px)': {
               fontSize: '0.8rem',
               lineHeight: 1.0,
               maxWidth: '120px',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
             }
           }}>
             {roomData.name || '채팅방'}
           </Typography>
         </Box>
      </Box>

      <Box className="no-drag" sx={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="file"
          id="file-upload"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload">
          <IconButton
            component="span"
            size="small"
            sx={{
              color: 'white',
              mr: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <AttachFile />
          </IconButton>
        </label>
        <IconButton
          size="small"
          onClick={() => setIsMinimized(!isMinimized)}
          sx={{ color: 'white', mr: 0.5 }}
        >
          <Minimize />
        </IconButton>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </Box>
    </Box>

    {!isMinimized && (
      <>
        {/* 메시지 목록 */}
        <Box
          sx={{
            height: size.height - 120,
            overflowY: 'auto',
            p: 1,
            backgroundColor: '#fafafa',
            // 반응형 메시지 목록
            '@media (max-width: 768px)': {
              height: 'calc(80vh - 120px)',
              p: 0.5,
            },
            '@media (max-width: 480px)': {
              height: 'calc(90vh - 120px)',
              p: 0.25,
            }
          }}
        >
          {messages.map((message, index) => {
            const safeKey = message.id || `room_msg_${index}_${message.timestamp || Date.now()}`;
            const userInfo = JSON.parse(localStorage.getItem('user-info'));
            const isMyMessage = message.sender?.id === userInfo?.id;

            return (
              <Box key={safeKey} sx={{ mb: 1 }}>
                {message.type === 'system' ? (
                  <Box sx={{ textAlign: 'center', my: 1 }}>
                    <Chip
                      label={message.text}
                      size="small"
                      sx={{ fontSize: '0.7rem', backgroundColor: '#e3f2fd' }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start',
                      gap: 1
                    }}
                  >
                    <Box>
                      {!isMyMessage && (
                        <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                          {message.sender?.name || 'Unknown'}
                        </Typography>
                      )}
                                             <Paper
                         sx={{
                           p: 1.5,
                           maxWidth: 280,
                           backgroundColor: isMyMessage ? '#1976d2' : '#F8FAFC',
                           color: isMyMessage ? 'white' : 'black',
                           borderRadius: isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                           boxShadow: 1,
                           border: isMyMessage ? 'none' : '1px solid #e0e0e0',
                           // 반응형 메시지 버블
                           '@media (max-width: 768px)': {
                             maxWidth: '85%',
                             p: 1,
                           },
                           '@media (max-width: 480px)': {
                             maxWidth: '90%',
                             p: 0.75,
                           }
                         }}
                       >
                        <Typography variant="body2">
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: '0.6rem',
                            textAlign: isMyMessage ? 'right' : 'left'
                          }}
                        >
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* 타이핑 인디케이터 */}
          {typingUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name}님이 입력중...`
                  : `${typingUsers.length}명이 입력중...`
                }
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* 메시지 입력 */}
                 <Box
           className="no-drag"
           sx={{
             display: 'flex',
             gap: 1,
             p: 0.5,
             borderTop: '1px solid #e0e0e0',
             backgroundColor: 'white',
             alignItems: 'center',
             // 반응형 입력 영역
             '@media (max-width: 768px)': {
               p: 0.25,
               gap: 0.5,
             },
             '@media (max-width: 480px)': {
               p: 0.25,
               gap: 0.25,
             }
           }}
         >
                     <TextField
             ref={inputRef}
             fullWidth
             size="small"
             multiline
             maxRows={2}
             placeholder="메시지를 입력하세요..."
             value={newMessage}
             onChange={handleInputChange}
             onKeyPress={handleKeyPress}
             sx={{
               '& .MuiOutlinedInput-root': {
                 borderRadius: 2
               },
               // 반응형 입력 필드
               '@media (max-width: 768px)': {
                 fontSize: '0.9rem',
               },
               '@media (max-width: 480px)': {
                 fontSize: '0.85rem',
               }
             }}
           />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              minWidth: 'auto',
              px: 2,
              borderRadius: 2,
              background: 'rgb(33, 150, 243)'
            }}
          >
            <Send />
          </Button>
        </Box>
      </>
    )}

    {/* 리사이즈 핸들 */}
    {!isMinimized && (
      <>
        {/* 상단 왼쪽 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 8,
            height: 8,
            cursor: 'nw-resize',
            zIndex: 3
          }}
        />
        {/* 상단 중앙 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'top')}
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            cursor: 'n-resize',
            zIndex: 3
          }}
        />
        {/* 상단 오른쪽 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 8,
            height: 8,
            cursor: 'ne-resize',
            zIndex: 3
          }}
        />
        {/* 오른쪽 중앙 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 4,
            height: '100%',
            cursor: 'e-resize',
            zIndex: 3
          }}
        />
        {/* 하단 오른쪽 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            cursor: 'se-resize',
            zIndex: 3
          }}
        />
        {/* 하단 중앙 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            cursor: 's-resize',
            zIndex: 3
          }}
        />
        {/* 하단 왼쪽 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 8,
            height: 8,
            cursor: 'sw-resize',
            zIndex: 3
          }}
        />
        {/* 왼쪽 중앙 리사이즈 핸들 */}
        <Box
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            cursor: 'w-resize',
            zIndex: 3
          }}
        />
      </>
    )}

  </Paper>
);
}

export default ChatRoomWindow; 