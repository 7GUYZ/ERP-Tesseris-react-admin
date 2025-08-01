import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper, Box, Tabs, Tab, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, IconButton, Typography, Chip,
  Badge, TextField, Button, Divider, Switch, FormControlLabel,
  CircularProgress
} from '@mui/material';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import {
  Close, Minimize, DragIndicator, PersonAdd, Settings,
<<<<<<< HEAD
  MoreVert, Search, Add, Send, Refresh
} from '@mui/icons-material';
import { getChatAdminList, getUserChatRooms, setupInterceptors } from '../../api/auth/DeokkyuAuth';
import { useChatWebSocket } from '../../context/ChatWebSocketContext';
=======
  MoreVert, Search, Add, Send, Home, Folder, Description,
  ExpandMore, ChevronRight, Person
} from '@mui/icons-material';
import { GetAdminList } from '../../api/auth/ChatAuth';
import axios from 'axios';
>>>>>>> dev


function ChatMainWindow({ open, onClose, onRoomSelect }) {
  const { 
    stompClient, 
    currentUser 
  } = useChatWebSocket();
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
  
<<<<<<< HEAD
  // 👥 관리자 목록 상태
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  
  // 💬 채팅방 목록 상태
  const [chatRooms, setChatRooms] = useState([]);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(false);
  
  // 🌍 전체 채팅방 상태
  const [globalMessages, setGlobalMessages] = useState([]);
  const [newGlobalMessage, setNewGlobalMessage] = useState('');
  const messagesEndRef = useRef(null);
=======
  // 🌍 전체 채팅방 상태 (주석 처리 - 전체 채팅방 제거)
  // const [globalMessages, setGlobalMessages] = useState([]);
  // const [newGlobalMessage, setNewGlobalMessage] = useState('');
  // const messagesEndRef = useRef(null);
>>>>>>> dev
  
  // 메시지 중복 처리 방지
  const processedMessagesRef = useRef(new Set());
  const messageCounterRef = useRef(0);
  
  const chatRef = useRef(null);

<<<<<<< HEAD
  // 관리자 목록 가져오기
  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      setupInterceptors();
      const response = await getChatAdminList();
      console.log('👥 관리자 목록 조회 성공:', response.data);
      
      // API 응답 구조에 맞게 데이터 처리
      const adminsData = response.data?.map(admin => ({
        id: admin.adminUserIndex || admin.id || 'unknown',
        name: admin.adminName || '이름없음',
        userIndex: admin.adminUserIndex,
        typeName: admin.adminTypeName || '미지정',
        rankName: admin.adminRankName || '미지정',
        status: '온라인', // 실제로는 온라인 상태 API에서 확인 필요
        avatar: null,
        // 원본 데이터도 유지
        ...admin
      })) || [];
      
      setAdmins(adminsData);
      
    } catch (error) {
      console.error('🚨 관리자 목록 조회 실패:', error);
      // 실패 시 빈 배열로 설정
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  // 채팅방 목록 가져오기
  const fetchChatRooms = async () => {
    try {
      setChatRoomsLoading(true);
      
      // 로컬스토리지에서 user_index 가져오기
      const userInfo = JSON.parse(localStorage.getItem('user-info') || '{}');
      const userId = userInfo.id;
      
      console.log('📋 로컬스토리지 user-info:', userInfo);
      console.log('🔑 추출된 userId:', userId);
      
      if (!userId) {
        console.warn('⚠️ 사용자 정보가 없습니다. 로그인이 필요합니다.');
        console.warn('📋 현재 user-info:', userInfo);
        setChatRooms([]);
        return;
      }

      setupInterceptors();
      const response = await getUserChatRooms(userId);
      console.log('💬 채팅방 목록 조회 성공:', response.data);
      
      // API 응답 구조 처리 - {resultCode, resultMessage, data?} 형태
      const responseData = response.data;
      console.log('🔍 전체 응답 구조:', responseData);
      
      if (responseData.resultCode !== 200) {
        console.warn('⚠️ API 응답 실패:', responseData.resultMessage);
        setChatRooms([]);
        return;
      }
      
      // resultMessage에 에러가 포함되어 있는 경우 처리
      if (responseData.resultMessage && responseData.resultMessage.includes('Error')) {
        console.error('🚨 백엔드 파싱 오류:', responseData.resultMessage);
        setChatRooms([]);
        return;
      }
      
      // data 필드가 있는지 확인
      if (!responseData.data) {
        console.warn('⚠️ 응답에 데이터가 없습니다:', responseData);
        setChatRooms([]);
        return;
      }
      
      const roomsData = responseData.data?.map(room => ({
        id: room.roomId || room.id || Math.random().toString(36),
        name: room.roomName || room.name || '채팅방',
        lastMessage: room.lastMessage || '메시지가 없습니다',
        lastTime: room.lastTime || room.updatedAt || '알 수 없음',
        unreadCount: room.unreadCount || 0,
        participants: room.participants || room.memberNames || [],
        roomType: room.roomType || room.type || 'group',
        room_index: room.roomIndex || room.room_index || room.id, // room_index 추가
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        // 원본 데이터도 유지
        ...room
      })) || [];
      
      console.log('📋 처리된 채팅방 데이터:', roomsData);
      setChatRooms(roomsData);
      
    } catch (error) {
      console.error('🚨 채팅방 목록 조회 실패:', error);
      // 실패 시 빈 배열로 설정
      setChatRooms([]);
    } finally {
      setChatRoomsLoading(false);
=======
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
>>>>>>> dev
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

  // 컴포넌트 마운트 시 관리자 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchAdmins();
    }
  }, [open]);

  // STOMP 이벤트 리스너
  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;

    // 👥 온라인 사용자 업데이트 구독
    const usersSubscription = stompClient.subscribe('/topic/users', (message) => {
      const users = JSON.parse(message.body);
      if (Array.isArray(users)) {
        setOnlineUsers(users);
        console.log('🔗 온라인 사용자 업데이트:', users.length, '명');
      }
    });

<<<<<<< HEAD
    // 🌍 전역 메시지 구독
    const globalSubscription = stompClient.subscribe('/topic/global', (message) => {
      const chatMessage = JSON.parse(message.body);
      console.log('🌍 전역 메시지 수신:', chatMessage);
      setGlobalMessages(prev => [...prev, chatMessage]);
    });
=======
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
>>>>>>> dev

    // 🚀 사용자 입장/퇴장 알림 구독
    const joinSubscription = stompClient.subscribe('/topic/user-join', (message) => {
      const user = JSON.parse(message.body);
      console.log('👋 새 사용자 입장:', user);
    });

    const leaveSubscription = stompClient.subscribe('/topic/user-leave', (message) => {
      const user = JSON.parse(message.body);
      console.log('🚪 사용자 퇴장:', user);
<<<<<<< HEAD
    });

    // 정리 함수
    return () => {
      globalSubscription?.unsubscribe();
      usersSubscription?.unsubscribe();
      joinSubscription?.unsubscribe();
      leaveSubscription?.unsubscribe();
=======
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
>>>>>>> dev
    };
  }, [stompClient]);

<<<<<<< HEAD
  // 🌍 전역 메시지 전송 (비활성화됨)
  const handleSendGlobalMessage = () => {
    console.log('⚠️ 전역 메시지 기능이 비활성화되었습니다.');
    // 전역 메시지 기능이 제거되었습니다.
    setNewGlobalMessage('');
  };
=======
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
>>>>>>> dev

  // const handleGlobalKeyPress = (e) => {
  //   if (e.key === 'Enter' && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSendGlobalMessage();
  //   }
  // };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
<<<<<<< HEAD
    // 🌍 전체 채팅방 탭(0번)에 진입할 때 서버에 알림
    if (newValue === 0 && stompClient && stompClient.connected && currentUser) {
      console.log('🌍 전체 채팅방 입장:', currentUser.name);
      // STOMP로 전체 채팅방 입장 알림
      stompClient.send('/app/chat/join-global', {}, JSON.stringify({
        user: currentUser
      }));
    }
    
    // 💬 채팅방 탭(2번)에 진입할 때 채팅방 목록 조회
    if (newValue === 2) {
      console.log('💬 채팅방 탭 진입 - 채팅방 목록 조회');
=======
    // 탭 변경 시 해당 탭의 데이터 업데이트
    if (newValue === 0) {
      // 홈 탭 - 관리자 목록 조회
      fetchAdminUsers();
    } else if (newValue === 1) {
      // 채팅방 탭 - 채팅방 목록 조회
>>>>>>> dev
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

<<<<<<< HEAD
  const getAdminTypeColor = (typeName) => {
    switch (typeName) {
      case '슈퍼관리자': return '#f44336';
      case '일반관리자': return '#2196f3';
      case '운영자': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getAdminRankColor = (rankName) => {
    switch (rankName) {
      case '최고관리자': return '#d32f2f';
      case '부관리자': return '#1976d2';
      case '일반관리자': return '#388e3c';
      case '운영자': return '#f57c00';
      default: return '#757575';
    }
  };

=======
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
>>>>>>> dev

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
<<<<<<< HEAD
              <Tab label="전체 채팅방" />
              <Tab label="관리자" />
=======
              <Tab label="홈" />
>>>>>>> dev
              <Tab label="채팅방" />
              <Tab label="설정" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <Box sx={{ height: 480, overflow: 'hidden' }}>
            {/* 🏠 홈 탭 (기존 친구 탭을 홈으로 변경) */}
            {activeTab === 0 && (
<<<<<<< HEAD
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 온라인 사용자 표시 */}
                <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    🌍 전체 채팅방 ({onlineUsers.length}명 참여중)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {onlineUsers.slice(0, 5).map((user, index) => (
                      <Chip
                        key={user.id || `user_${index}`}
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
                  {globalMessages.map((message, index) => {
                    // 안전한 key 생성 (message.id가 있으면 사용, 없으면 index와 timestamp 조합)
                    const safeKey = message.id || `msg_${index}_${message.timestamp || Date.now()}`;
                    
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
                    );
                  })}
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

            {/* 관리자 탭 */}
            {activeTab === 1 && (
=======
>>>>>>> dev
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 검색 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                  <TextField
                    fullWidth
                    size="small"
<<<<<<< HEAD
                    placeholder="관리자 검색..."
=======
                    placeholder="부서 또는 직원 검색..."
>>>>>>> dev
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: '#666' }} />
                    }}
                  />
<<<<<<< HEAD
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      startIcon={<PersonAdd />}
                      sx={{ flex: 1 }}
                      variant="outlined"
                      size="small"
                    >
                      관리자 추가
                    </Button>
                    <Button
                      startIcon={<Refresh />}
                      onClick={fetchAdmins}
                      disabled={adminsLoading}
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 'auto' }}
                    >
                      새로고침
                    </Button>
                  </Box>
                </Box>

                {/* 관리자 목록 */}
                <List sx={{ height: 'calc(100% - 140px)', overflowY: 'auto', py: 0 }}>
                  {adminsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        관리자 목록을 불러오는 중...
                      </Typography>
                    </Box>
                  ) : admins.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        관리자가 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    admins
                      .filter(admin => 
                        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        admin.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        admin.rankName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((admin) => (
                      <ListItem
                        key={admin.id}
                        button
                        onClick={() => handleRoomClick({ 
                          id: admin.id, 
                          name: admin.name, 
                          type: 'direct',
                          room_index: null, // 새로운 1:1 채팅방
                          participants: [currentUser?.id, admin.userIndex] // 나와 상대방
                        })}
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
                                backgroundColor: getStatusColor(admin.status),
                                color: getStatusColor(admin.status),
                              },
                            }}
                          >
                            <Avatar sx={{ 
                              bgcolor: getAdminTypeColor(admin.typeName),
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {admin.name[0]}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {admin.name}
                              </Typography>
                              <Chip
                                label={admin.rankName}
                                size="small"
                                sx={{
                                  backgroundColor: getAdminRankColor(admin.rankName),
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  height: 16
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="caption" sx={{ 
                                color: getAdminTypeColor(admin.typeName),
                                fontWeight: 'bold'
                              }}>
                                {admin.typeName}
                              </Typography>
                              <Typography component="span" variant="caption" sx={{ 
                                display: 'block', 
                                color: 'text.secondary',
                                fontSize: '0.7rem'
                              }}>
                                ID: {admin.userIndex}
                              </Typography>
                            </>
                          }
                        />
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </ListItem>
                    ))
                  )}
                </List>
=======
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
>>>>>>> dev
              </Box>
            )}

            {/* 채팅방 탭 */}
            {activeTab === 1 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* 새 채팅방 버튼 */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
<<<<<<< HEAD
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Add />}
                      sx={{ flex: 1 }}
                      variant="outlined"
                      size="small"
                    >
                      새 채팅방 만들기
                    </Button>
                    <Button
                      startIcon={<Refresh />}
                      onClick={fetchChatRooms}
                      disabled={chatRoomsLoading}
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 'auto' }}
                    >
                      새로고침
                    </Button>
                  </Box>
                </Box>

                {/* 채팅방 목록 */}
                <List sx={{ height: 'calc(100% - 100px)', overflowY: 'auto', py: 0 }}>
                  {chatRoomsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        채팅방 목록을 불러오는 중...
                      </Typography>
                    </Box>
                  ) : chatRooms.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography variant="body2" color="text.secondary">
                        참여 중인 채팅방이 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    chatRooms.map((room) => (
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
                          <Badge 
                            badgeContent={room.unreadCount > 0 ? room.unreadCount : null} 
                            color="error"
                          >
                            <Avatar sx={{ 
                              bgcolor: room.roomType === 'direct' ? '#4CAF50' : '#FF9800' 
                            }}>
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
                              {room.participants && room.participants.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  참여자: {room.participants.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
=======
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
>>>>>>> dev
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