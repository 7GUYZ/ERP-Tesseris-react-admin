import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper, Box, Tabs, Tab, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, IconButton, Typography, Chip,
  Badge, TextField, Button, Divider, Switch, FormControlLabel
} from '@mui/material';
import {
  Close, Minimize, DragIndicator, PersonAdd, Settings,
  MoreVert, Search, Add, Send
} from '@mui/icons-material';


function ChatMainWindow({ open, onClose, onRoomSelect, socket, currentUser }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 450, 
    y: 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // 🌍 전체 채팅방 상태
  const [globalMessages, setGlobalMessages] = useState([]);
  const [newGlobalMessage, setNewGlobalMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const chatRef = useRef(null);

  // 모킹 데이터 (실제로는 서버에서 가져와야 함)
  const mockFriends = [
    { id: '1', name: '김철수', status: '온라인', lastSeen: null, avatar: null },
    { id: '2', name: '이영희', status: '자리비움', lastSeen: '5분 전', avatar: null },
    { id: '3', name: '박민수', status: '오프라인', lastSeen: '1시간 전', avatar: null },
    { id: '4', name: '정수진', status: '온라인', lastSeen: null, avatar: null },
  ];

  const mockChatRooms = [
    { 
      id: 'room1', 
      name: '프로젝트 팀', 
      lastMessage: '내일 회의 준비 완료!', 
      lastTime: '2분 전',
      unreadCount: 3,
      participants: ['김철수', '이영희', '박민수']
    },
    { 
      id: 'room2', 
      name: '김철수', 
      lastMessage: '안녕하세요~', 
      lastTime: '10분 전',
      unreadCount: 1,
      participants: ['김철수']
    },
    { 
      id: 'room3', 
      name: '개발팀 회의', 
      lastMessage: '코드 리뷰 부탁드립니다', 
      lastTime: '1시간 전',
      unreadCount: 0,
      participants: ['정수진', '박민수', '이영희']
    },
  ];

  // 드래그 기능
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - (isMinimized ? 60 : 600);
    
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
  }, [globalMessages]);

  // WebSocket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    socket.on('onlineUsers', (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
        console.log('🔗 온라인 사용자 업데이트:', users.length, '명');
      }
    });

    // 🌍 전역 메시지 수신
    socket.on('message', (message) => {
      console.log('🌍 전역 메시지 수신:', message);
      setGlobalMessages(prev => [...prev, message]);
    });

    // 🚀 사용자 입장 알림
    socket.on('userJoined', (user) => {
      console.log('👋 새 사용자 입장:', user);
    });

    // 👋 사용자 퇴장 알림
    socket.on('userLeft', (user) => {
      console.log('🚪 사용자 퇴장:', user);
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('message');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, [socket]);

  // 🌍 전역 메시지 전송
  const handleSendGlobalMessage = () => {
    if (newGlobalMessage.trim() && socket && currentUser) {
      const message = {
        id: `${currentUser.id}_${Date.now()}`,
        text: newGlobalMessage,
        sender: currentUser,
        timestamp: new Date(),
        type: 'user'
      };

      console.log('🌍 전역 메시지 전송:', message);
      socket.emit('sendMessage', message);
      setNewGlobalMessage('');
    }
  };

  const handleGlobalKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendGlobalMessage();
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // 🌍 전체 채팅방 탭(0번)에 진입할 때 서버에 연결 알림
    if (newValue === 0 && socket && currentUser) {
      console.log('🌍 전체 채팅방 입장:', currentUser.name);
      // 서버에 전체 채팅방 입장 알림 (기존 general 룸 사용)
      socket.emit('joinRoom', 'general');
    }
  };

  const handleRoomClick = (room) => {
    onRoomSelect(room);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '온라인': return '#4CAF50';
      case '자리비움': return '#FF9800';
      default: return '#757575';
    }
  };

  if (!open) return null;

  return (
    <Paper
      ref={chatRef}
      elevation={10}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 400,
        height: isMinimized ? 60 : 600,
        zIndex: 1300,
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
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
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
          <DragIndicator />
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            채팅
          </Typography>
          <Chip
            label={`${onlineUsers.length}명 온라인`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.7rem'
            }}
          />
        </Box>
        <Box className="no-drag">
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
          {/* 탭 - 전체 채팅방 탭 추가 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              className="no-drag"
              sx={{ '& .MuiTab-root': { fontSize: '0.8rem', minWidth: 'auto' } }}
            >
              <Tab label="전체 채팅방" />
              <Tab label="친구" />
              <Tab label="채팅방" />
              <Tab label="설정" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <Box sx={{ height: 480, overflow: 'hidden' }}>
            {/* 🌍 전체 채팅방 탭 */}
            {activeTab === 0 && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 온라인 사용자 표시 */}
                <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    🌍 전체 채팅방 ({onlineUsers.length}명 참여중)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {onlineUsers.slice(0, 5).map((user, index) => (
                      <Chip
                        key={user.id || index}
                        avatar={<Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                          {user.name ? user.name[0] : 'U'}
                        </Avatar>}
                        label={user.name || 'Unknown'}
                        size="small"
                        variant={user.id === currentUser?.id ? "filled" : "outlined"}
                        color={user.id === currentUser?.id ? "primary" : "default"}
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    ))}
                    {onlineUsers.length > 5 && (
                      <Chip label={`+${onlineUsers.length - 5}`} size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                    )}
                  </Box>
                </Box>

                {/* 전역 메시지 목록 */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 1,
                    backgroundColor: '#fafafa'
                  }}
                >
                  {globalMessages.map((message) => (
                    <Box key={message.id || Math.random()} sx={{ mb: 1 }}>
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
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem' }}>
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
                                p: 1,
                                maxWidth: 250,
                                backgroundColor: message.sender?.id === currentUser?.id ? '#2196F3' : 'white',
                                color: message.sender?.id === currentUser?.id ? 'white' : 'black',
                                borderRadius: 2,
                                boxShadow: 1
                              }}
                            >
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
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
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                              {message.sender?.name ? message.sender.name[0] : 'U'}
                            </Avatar>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* 전역 메시지 입력 */}
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
                    placeholder="전체 채팅방에 메시지를 입력하세요..."
                    value={newGlobalMessage}
                    onChange={(e) => setNewGlobalMessage(e.target.value)}
                    onKeyPress={handleGlobalKeyPress}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendGlobalMessage}
                    disabled={!newGlobalMessage.trim()}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                    }}
                  >
                    <Send />
                  </Button>
                </Box>
              </Box>
            )}

            {/* 친구 탭 */}
            {activeTab === 1 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 검색 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="친구 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                  <Button
                    startIcon={<PersonAdd />}
                    sx={{ mt: 1, width: '100%' }}
                    variant="outlined"
                    size="small"
                  >
                    친구 추가
                  </Button>
                </Box>

                {/* 친구 목록 */}
                <List sx={{ height: 'calc(100% - 120px)', overflowY: 'auto', py: 0 }}>
                  {mockFriends
                    .filter(friend => 
                      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((friend) => (
                    <ListItem
                      key={friend.id}
                      button
                      onClick={() => handleRoomClick({ id: friend.id, name: friend.name, type: 'direct' })}
                      sx={{
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: getStatusColor(friend.status),
                              color: getStatusColor(friend.status),
                            },
                          }}
                        >
                          <Avatar sx={{ bgcolor: '#2196F3' }}>
                            {friend.name[0]}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.name}
                        secondary={friend.status === '오프라인' ? friend.lastSeen : friend.status}
                        secondaryTypographyProps={{
                          color: getStatusColor(friend.status),
                          fontSize: '0.8rem'
                        }}
                      />
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* 채팅방 탭 */}
            {activeTab === 2 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 새 채팅방 버튼 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                  <Button
                    startIcon={<Add />}
                    sx={{ width: '100%' }}
                    variant="outlined"
                    size="small"
                  >
                    새 채팅방 만들기
                  </Button>
                </Box>

                {/* 채팅방 목록 */}
                <List sx={{ height: 'calc(100% - 80px)', overflowY: 'auto', py: 0 }}>
                  {mockChatRooms.map((room) => (
                    <ListItem
                      key={room.id}
                      button
                      onClick={() => handleRoomClick(room)}
                      sx={{
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={room.unreadCount} color="error">
                          <Avatar sx={{ bgcolor: '#FF9800' }}>
                            {room.name[0]}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" noWrap>
                              {room.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {room.lastTime}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {room.lastMessage}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              참여자: {room.participants.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* 설정 탭 */}
            {activeTab === 3 && (
              <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }} className="no-drag">
                <Typography variant="h6" gutterBottom>
                  채팅 설정
                </Typography>
                
                <List>
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications}
                          onChange={(e) => setNotifications(e.target.checked)}
                        />
                      }
                      label="알림 받기"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                        />
                      }
                      label="다크 모드"
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  내 정보
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#2196F3', width: 56, height: 56 }}>
                    {currentUser?.name ? currentUser.name[0] : 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {currentUser?.name || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      온라인
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  프로필 수정
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                >
                  로그아웃
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default ChatMainWindow; 