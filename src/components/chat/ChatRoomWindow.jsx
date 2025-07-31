import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper, Box, TextField, Button, IconButton,
  Typography, Avatar, Chip
} from '@mui/material';
import {
  Close, Send, Minimize, DragIndicator, 
  ArrowBack, Call, VideoCall, Info
} from '@mui/icons-material';
import { saveChatMessage, setupInterceptors } from '../../api/auth/DeokkyuAuth';
import { useChatWebSocket } from '../../context/ChatWebSocketContext';


function ChatRoomWindow({ 
  open, 
  onClose, 
  onBack, 
  roomData
}) {
  const { 
    stompClient, 
    currentUser, 
    subscribeToRoom, 
    unsubscribeFromRoom, 
    sendMessageToRoom 
  } = useChatWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 450, 
    y: 150 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  // 메시지 중복 처리 방지
  const processedMessagesRef = useRef(new Set());
  const messageCounterRef = useRef(0);
  
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 드래그 기능
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - 450;
    const maxY = window.innerHeight - (isMinimized ? 60 : 500);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragStart.x, dragStart.y, isMinimized]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅방 입장 시 초기화
  useEffect(() => {
    if (open && roomData && stompClient && stompClient.connected) {
      // 메시지 중복 처리 초기화
      processedMessagesRef.current.clear();
      
      // 채팅방 구독
      subscribeToRoom(roomData.id, (messageData) => {
        // 고유 메시지 키 생성
        const messageKey = `${messageData.id || 'no-id'}_${messageData.timestamp || Date.now()}_${messageData.sender?.id || 'no-sender'}`;
        
        // 이미 처리된 메시지인지 확인
        if (processedMessagesRef.current.has(messageKey)) {
          console.log('🔄 중복 룸 메시지 무시:', messageKey);
          return;
        }
        
        // 처리된 메시지로 마킹
        processedMessagesRef.current.add(messageKey);
        
        console.log('룸 메시지 수신:', messageData);
        setMessages(prev => [...prev, messageData]);
      });
      
      // 채팅방 입장 알림
      stompClient.send('/app/chat/join-room', {}, JSON.stringify({
        roomId: roomData.id,
        user: currentUser
      }));

      // 기존 메시지 불러오기 요청
      stompClient.send('/app/chat/get-messages', {}, JSON.stringify({
        roomId: roomData.id
      }));
    }
    
    // 채팅방 나갈 때 구독 해제
    return () => {
      if (roomData) {
        unsubscribeFromRoom(roomData.id);
      }
    };
  }, [open, roomData, stompClient, currentUser, subscribeToRoom, unsubscribeFromRoom]);

  // 기존 메시지 목록 수신 구독
  useEffect(() => {
    if (!stompClient || !stompClient.connected || !roomData) return;

    const roomMessagesSubscription = stompClient.subscribe(`/topic/room/${roomData.id}/messages`, (message) => {
      const messageList = JSON.parse(message.body);
      if (Array.isArray(messageList)) {
        // 기존 메시지들도 중복 처리 마킹
        messageList.forEach(messageData => {
          const messageKey = `${messageData.id || 'no-id'}_${messageData.timestamp || Date.now()}_${messageData.sender?.id || 'no-sender'}`;
          processedMessagesRef.current.add(messageKey);
        });
        setMessages(messageList);
      }
    });

    // 참여자 목록 수신 구독
    const participantsSubscription = stompClient.subscribe(`/topic/room/${roomData.id}/participants`, (message) => {
      const participants = JSON.parse(message.body);
      if (Array.isArray(participants)) {
        setRoomParticipants(participants);
      }
    });

    // 타이핑 상태 수신 구독
    const typingSubscription = stompClient.subscribe(`/topic/room/${roomData.id}/typing`, (message) => {
      const typingData = JSON.parse(message.body);
      const { userId, userName, isTyping: typing } = typingData;
      
      if (userId !== currentUser?.id) {
        setTypingUsers(prev => {
          if (typing) {
            return [...prev.filter(u => u.id !== userId), { id: userId, name: userName }];
          } else {
            return prev.filter(u => u.id !== userId);
          }
        });
      }
    });

    // 정리 함수
    return () => {
      roomMessagesSubscription?.unsubscribe();
      participantsSubscription?.unsubscribe();
      typingSubscription?.unsubscribe();
    };
  }, [stompClient, roomData, currentUser]);

  // 타이핑 인디케이터
  useEffect(() => {
    if (isTyping && stompClient && stompClient.connected) {
      stompClient.send(`/app/chat/typing`, {}, JSON.stringify({
        roomId: roomData?.id,
        userId: currentUser?.id,
        userName: currentUser?.name,
        isTyping: true
      }));
      
      const timer = setTimeout(() => {
        stompClient.send(`/app/chat/typing`, {}, JSON.stringify({
          roomId: roomData?.id,
          userId: currentUser?.id,
          userName: currentUser?.name,
          isTyping: false
        }));
        setIsTyping(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isTyping, stompClient, roomData, currentUser]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentUser && roomData) {
      try {
        // 1. DB에 메시지 저장
        const userInfo = JSON.parse(localStorage.getItem('user-info') || '{}');
        const userId = userInfo.id;
        
        if (userId) {
          const messageData = {
            user_id: userId,
            sent_at: new Date().toISOString(),
            message: newMessage.trim(),
            room_index: roomData.room_index || roomData.roomIndex || null,
            room_name: roomData.name || roomData.roomName || '채팅방',
            participants: roomData.participants || []
          };

          console.log('💾 채팅 메시지 DB 저장:', messageData);
          setupInterceptors();
          await saveChatMessage(messageData);
          console.log('✅ 메시지 DB 저장 성공');
        }

        // 2. WebSocket으로 실시간 전송
        const success = sendMessageToRoom(roomData.id, newMessage.trim());
        if (success) {
          console.log('✅ 메시지 전송 성공');
        } else {
          console.error('❌ 메시지 전송 실패');
        }

        setNewMessage('');
        setIsTyping(false);

      } catch (error) {
        console.error('🚨 메시지 저장 실패:', error);
        
        // DB 저장 실패해도 WebSocket 전송은 계속
        const success = sendMessageToRoom(roomData.id, newMessage.trim());
        if (success) {
          console.log('✅ 메시지 전송 성공 (DB 저장 실패 후)');
        } else {
          console.error('❌ 메시지 전송 실패 (DB 저장 실패 후)');
        }
        
        setNewMessage('');
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
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
        width: 450,
        height: isMinimized ? 60 : 500,
        zIndex: 1400,
        borderRadius: 2,
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'height 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 헤더 */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
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
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
            {roomData.name[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontSize: '1rem', lineHeight: 1.2 }}>
              {roomData.name}
            </Typography>
            {roomData.participants && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {roomData.participants.length > 1 
                  ? `${roomData.participants.length}명 참여중`
                  : '1:1 채팅'
                }
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box className="no-drag" sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" sx={{ color: 'white', mr: 0.5 }}>
            <Call />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white', mr: 0.5 }}>
            <VideoCall />
          </IconButton>
          <IconButton size="small" sx={{ color: 'white', mr: 0.5 }}>
            <Info />
          </IconButton>
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
          {/* 참여자 정보 (그룹채팅일 때만) */}
          {roomData.participants && roomData.participants.length > 2 && (
            <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {roomParticipants.map((participant, index) => (
                  <Chip
                    key={participant.id || `participant_${index}`}
                    avatar={<Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                      {participant.name ? participant.name[0] : 'U'}
                    </Avatar>}
                    label={participant.name || 'Unknown'}
                    size="small"
                    variant={participant.id === currentUser?.id ? "filled" : "outlined"}
                    color={participant.id === currentUser?.id ? "primary" : "default"}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 메시지 목록 */}
          <Box
            sx={{
              height: 320,
              overflowY: 'auto',
              p: 1,
              backgroundColor: '#fafafa'
            }}
          >
            {messages.map((message, index) => {
              // 안전한 key 생성 (message.id가 있으면 사용, 없으면 index와 timestamp 조합)
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
                        justifyContent: message.sender?.id === currentUser?.id ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-start',
                        gap: 1
                      }}
                    >
                      {message.sender?.id !== currentUser?.id && (
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                          {message.sender?.name ? message.sender.name[0] : 'U'}
                        </Avatar>
                      )}
                      <Box>
                        {message.sender?.id !== currentUser?.id && (
                          <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                            {message.sender?.name || 'Unknown'}
                          </Typography>
                        )}
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: 280,
                            backgroundColor: message.sender?.id === currentUser?.id ? '#4CAF50' : 'white',
                            color: message.sender?.id === currentUser?.id ? 'white' : 'black',
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
                      {message.sender?.id === currentUser?.id && (
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                          {message.sender?.name ? message.sender.name[0] : 'U'}
                        </Avatar>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}

            {/* 타이핑 인디케이터 */}
            {typingUsers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, mb: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  {typingUsers[0].name[0]}
                </Avatar>
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
              p: 1.5,
              borderTop: '1px solid #e0e0e0',
              backgroundColor: 'white'
            }}
          >
            <TextField
              fullWidth
              size="small"
              multiline
              maxRows={3}
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
                background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
              }}
            >
              <Send />
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default ChatRoomWindow; 