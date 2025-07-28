import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper, Box, Tabs, Tab, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, IconButton, Typography, Chip,
  Badge, TextField, Button, Divider, Switch, FormControlLabel
} from '@mui/material';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import {
  Close, Minimize, DragIndicator, PersonAdd, Settings,
  MoreVert, Search, Add, Send, Home, Folder, Description,
  ExpandMore, ChevronRight, Person
} from '@mui/icons-material';
import { GetAdminList } from '../../api/auth/ChatAuth';
import axios from 'axios';


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
  
  // 🌍 전체 채팅방 상태 (주석 처리 - 전체 채팅방 제거)
  // const [globalMessages, setGlobalMessages] = useState([]);
  // const [newGlobalMessage, setNewGlobalMessage] = useState('');
  // const messagesEndRef = useRef(null);
  
  // 메시지 중복 처리 방지
  const processedMessagesRef = useRef(new Set());
  const messageCounterRef = useRef(0);
  
  const chatRef = useRef(null);

  // 관리자 사용자 목록 상태
  const [adminUsers, setAdminUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 관리자 사용자 목록 조회 (부서별로 그룹화)
  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await GetAdminList();
      console.log("어드민 리스트 불러오기 {}",response);
      const adminOnly = response.data.filter(user => user.userRole === '관리자');
      setAdminUsers(adminOnly);
      
      // 부서별로 그룹화 (실제 부서 필드명에 따라 수정 필요)
      const groupedByDepartment = adminOnly.reduce((acc, user) => {
        // 임시로 부서 정보 생성 (실제 데이터에 부서 필드가 있다면 user.department 사용)
        const department = user.department || '기타 부서';
        if (!acc[department]) acc[department] = [];
        acc[department].push(user);
        return acc;
      }, {});
      
      // 트리 데이터 생성
      const adminTreeData = Object.entries(groupedByDepartment).map(([dept, users], index) => ({
        id: `dept-${index}`,
        name: dept,
        icon: <Folder />,
        children: users.map(user => ({
          id: user.userIndex,
          name: user.name,
          icon: <Person />
        }))
      }));
      
      setTreeData(adminTreeData);
    } catch (error) {
      console.error('관리자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 채팅방 목록 조회 (실제 API가 있다면 여기서 호출)
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      // 실제 채팅방 API 호출
      // const response = await chatRoomApi.getChatRooms();
      // setChatRooms(response.data);
      
      // 임시 데이터
      const mockRooms = [
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
      setChatRooms(mockRooms);
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // 메시지 자동 스크롤 (주석 처리 - 전체 채팅방 제거)
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [globalMessages]);

  // WebSocket 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    // 이벤트 리스너 중복 등록 방지
    const handleOnlineUsers = (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
        console.log('🔗 온라인 사용자 업데이트:', users.length, '명');
      }
    };

    // 🌍 전역 메시지 수신 - 중복 방지 로직 추가 (주석 처리 - 전체 채팅방 제거)
    // const handleMessage = (message) => {
    //   // 고유 메시지 키 생성 (ID + timestamp + sender)
    //   const messageKey = `${message.id || 'no-id'}_${message.timestamp || Date.now()}_${message.sender?.id || 'no-sender'}`;
      
    //   // 이미 처리된 메시지인지 확인
    //   if (processedMessagesRef.current.has(messageKey)) {
    //     console.log('🔄 중복 메시지 무시:', messageKey);
    //     return;
    //   }
      
    //   // 처리된 메시지로 마킹
    //   processedMessagesRef.current.add(messageKey);
      
    //   console.log('🌍 전역 메시지 수신:', message);
    //   setGlobalMessages(prev => [...prev, message]);
    // };

    // 🚀 사용자 입장 알림
    const handleUserJoined = (user) => {
      console.log('👋 새 사용자 입장:', user);
    };

    // 👋 사용자 퇴장 알림
    const handleUserLeft = (user) => {
      console.log('🚪 사용자 퇴장:', user);
    };

    // 이벤트 리스너 등록
    socket.on('onlineUsers', handleOnlineUsers);
    // socket.on('message', handleMessage); // 전체 채팅방 제거로 주석 처리
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    // 정리 함수
    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      // socket.off('message', handleMessage); // 전체 채팅방 제거로 주석 처리
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket]);

  // 🌍 전역 메시지 전송 (주석 처리 - 전체 채팅방 제거)
  // const handleSendGlobalMessage = () => {
  //   if (newGlobalMessage.trim() && socket && currentUser) {
  //     // 고유 ID 생성 (중복 방지를 위해 더 정확한 ID 생성)
  //     messageCounterRef.current += 1;
  //     const uniqueId = `${currentUser.id}_${Date.now()}_${messageCounterRef.current}`;
      
  //     const message = {
  //       id: uniqueId,
  //       text: newGlobalMessage,
  //       sender: currentUser,
  //       timestamp: new Date().toISOString(),
  //       type: 'user'
  //     };

  //     console.log('🌍 전역 메시지 전송:', message);
  //     socket.emit('sendMessage', message);
  //     setNewGlobalMessage('');
  //   }
  // };

  // const handleGlobalKeyPress = (e) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSendGlobalMessage();
  //   }
  // };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // 탭 변경 시 해당 탭의 데이터 업데이트
    if (newValue === 0) {
      // 홈 탭 - 관리자 목록 조회
      fetchAdminUsers();
    } else if (newValue === 1) {
      // 채팅방 탭 - 채팅방 목록 조회
      fetchChatRooms();
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

  // 채팅방 생성 함수
  const createChatRoom = async (participants) => {
    if (!socket || !currentUser) {
      console.error('소켓 또는 현재 사용자 정보가 없습니다.');
      return;
    }

    try {
      // 채팅방 데이터 생성
      const roomData = {
        name: participants.length === 1 ? participants[0].name : `${participants.map(p => p.name).join(', ')}`,
        participants: [currentUser, ...participants],
        createdBy: currentUser.id,
        type: participants.length === 1 ? 'private' : 'group'
      };

      console.log('🏠 새 채팅방 생성 시도:', roomData);

      // 소켓으로 채팅방 생성 요청
      socket.emit('createRoom', roomData);

      // 백엔드 API로 채팅방 생성 요청
      try {
        const response = await axios.post('http://localhost:19091/api/adminchat/roomcreate', roomData);
        console.log('🏠 채팅방 생성 응답:', response.data);
        
        // 생성된 채팅방으로 이동
        if (response.data) {
          onRoomSelect(response.data);
        }
      } catch (error) {
        console.error('채팅방 생성 API 오류:', error);
        // API 실패해도 소켓으로 생성된 방 사용
        const tempRoom = {
          id: `temp_${Date.now()}`,
          ...roomData
        };
        onRoomSelect(tempRoom);
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
    }
  };

  // 관리자 사용자 클릭 핸들러
  const handleAdminUserClick = (user) => {
    console.log('👤 관리자 클릭:', user);
    createChatRoom([user]);
  };

  // 새 채팅방 만들기 버튼 클릭 핸들러
  const handleCreateNewRoom = () => {
    // 현재는 첫 번째 관리자를 선택 (실제로는 사용자가 선택할 수 있도록 모달 등을 구현)
    if (adminUsers.length > 0) {
      createChatRoom([adminUsers[0]]);
    } else {
      console.log('선택할 수 있는 관리자가 없습니다.');
    }
  };

  // 트리 아이템 렌더링 함수
  const renderTreeItem = (item) => (
    <TreeItem
      key={item.id}
      nodeId={item.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {item.icon}
          <Typography variant="body2">{item.name}</Typography>
        </Box>
      }
      onClick={() => {
        // 부서가 아닌 사용자 아이템인 경우에만 채팅방 생성
        if (!item.children && item.id !== item.name) {
          const user = adminUsers.find(u => u.userIndex === item.id);
          if (user) {
            handleAdminUserClick(user);
          }
        }
      }}
    >
      {item.children && item.children.map(child => renderTreeItem(child))}
    </TreeItem>
  );

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
          {/* 탭 - 전체 채팅방 탭 제거, 친구를 홈으로 변경 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              className="no-drag"
              sx={{ '& .MuiTab-root': { fontSize: '0.8rem', minWidth: 'auto' } }}
            >
              <Tab label="홈" />
              <Tab label="채팅방" />
              <Tab label="설정" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <Box sx={{ height: 480, overflow: 'hidden' }}>
            {/* 🏠 홈 탭 (기존 친구 탭을 홈으로 변경) */}
            {activeTab === 0 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 검색 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="부서 또는 직원 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
                </Box>

                {/* 트리 구조 */}
                <Box sx={{ height: 'calc(100% - 80px)', overflowY: 'auto', py: 1 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography>로딩 중...</Typography>
                    </Box>
                  ) : (
                    <TreeView
                      defaultCollapseIcon={<ExpandMore />}
                      defaultExpandIcon={<ChevronRight />}
                      defaultExpanded={treeData.map(item => item.id)}
                      sx={{ 
                        height: '100%',
                        flexGrow: 1,
                        maxWidth: '100%',
                        overflowY: 'auto'
                      }}
                    >
                      {treeData.map(item => renderTreeItem(item))}
                    </TreeView>
                  )}
                </Box>
              </Box>
            )}

            {/* 채팅방 탭 */}
            {activeTab === 1 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 새 채팅방 버튼 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                  <Button
                    startIcon={<Add />}
                    sx={{ width: '100%' }}
                    variant="outlined"
                    size="small"
                    onClick={handleCreateNewRoom}
                  >
                    새 채팅방 만들기
                  </Button>
                </Box>

                {/* 채팅방 목록 */}
                <List sx={{ height: 'calc(100% - 80px)', overflowY: 'auto', py: 0 }}>
                  {chatRooms.map((room) => (
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
            {activeTab === 2 && (
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