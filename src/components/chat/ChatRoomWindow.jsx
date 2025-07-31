import React, { useState, useRef, useCallback } from 'react';
import {
  Paper, Box, TextField, Button, IconButton,
  Typography, Chip
} from '@mui/material';
import {
  Close, Send, Minimize, DragIndicator, 
  ArrowBack, Call, VideoCall, Info, AttachFile
} from '@mui/icons-material';

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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [position, setPosition] = useState(currentPosition || { 
    x: window.innerWidth - 450, 
    y: 150 
  });
  const [size, setSize] = useState(currentSize || { width: 400, height: 600 });
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
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - (isMinimized ? 60 : size.height);
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: `msg_${Date.now()}`,
        text: newMessage,
        sender: { id: 'user', name: '사용자' },
        timestamp: new Date().toISOString(),
        type: 'user'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setIsTyping(false);
    }
  };

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
        userSelect: isDragging || isResizing ? 'none' : 'auto'
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
          userSelect: 'none'
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
             <Typography variant="subtitle1" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>
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
               backgroundColor: '#fafafa'
             }}
           >
            {messages.map((message, index) => {
              const safeKey = message.id || `room_msg_${index}_${message.timestamp || Date.now()}`;
              
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
                        justifyContent: message.sender?.id === 'user' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-start',
                        gap: 1
                      }}
                    >
                      <Box>
                        {message.sender?.id !== 'user' && (
                          <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                            {message.sender?.name || 'Unknown'}
                          </Typography>
                        )}
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: 280,
                            backgroundColor: message.sender?.id === 'user' ? 'rgb(33, 150, 243)' : '#F8FAFC',
                            color: message.sender?.id === 'user' ? 'white' : 'black',
                            borderRadius: 2,
                            boxShadow: 1
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
                              fontSize: '0.6rem'
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
                alignItems: 'center'
              }}
            >
                             <TextField
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