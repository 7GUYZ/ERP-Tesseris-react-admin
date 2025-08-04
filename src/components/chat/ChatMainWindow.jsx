import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper, Box, Tabs, Tab, List, ListItem,
  ListItemText, IconButton, Typography, Chip,
  Badge, TextField, Button, Divider, Switch, FormControlLabel, Checkbox
} from '@mui/material';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import {
  Close, Minimize, DragIndicator, PersonAdd, Settings,
  MoreVert, Search, Add, Send, Home, Folder, Description,
  ExpandMore, ChevronRight, Person, ArrowBack
} from '@mui/icons-material';
import { adminlist } from './ChatService';
import { SearchRoom, CheckRoom } from '../../api/auth/JihunAuth';
import { useWebSocket } from './WebSocketConfig';
import { generateRoomName } from '../../utils/roomNameUtils';


function ChatMainWindow({ open, onClose, onRoomSelect, onSizeChange, onPositionChange, currentSize, currentPosition }) {
  const { subscribeToRoom, connectWebSocket } = useWebSocket();
  
  // WebSocket 연결 설정
  useEffect(() => {
    if (open) {
      const token = localStorage.getItem('access-token');
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));

      if (token && userInfo) {
        connectWebSocket(token, userInfo.user_index);
      }
    }
  }, [open, connectWebSocket]); // connectWebSocket 의존성 다시 추가
  // ============================================================================
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [position, setPosition] = useState(currentPosition || {
    x: window.innerWidth - 450,
    y: 100
  });
  const [size, setSize] = useState(currentSize || { width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const chatRef = useRef(null);
  const [loading, setLoading] = useState(false);
  // ============================================================================
  const [adminList, setAdminList] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // 새 채팅방 만들기 관련 상태 추가
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState(new Set());
  
  // 채팅방 목록 새로고침 함수
  const refreshChatRooms = async () => {
    setLoading(true);
    const userInfo = JSON.parse(localStorage.getItem('admin-info'));
    if (userInfo?.id) {
      try {
        const response = await SearchRoom(userInfo.id);
        
        if (response?.data?.data) {
          setChatRooms(response.data.data);
        } else {
          setChatRooms([]);
        }
      } catch (error) {
        setChatRooms([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // 관리자 목록 조회
  React.useEffect(() => {
    if (open && activeTab === 0) {  // 홈 탭일 때만 호출
      setLoading(true);
      adminlist().then((data) => {
        
        // 데이터가 유효한지 확인
        if (!data || !Array.isArray(data)) {
          setAdminList([]);
          setLoading(false);
          return;
        }
        
        // 본인 제외하기
        const userInfo = JSON.parse(localStorage.getItem('admin-info'));
        console.log("관리자 목록 원본 데이터:", data);
        const filteredData = data.filter(admin => {
          // 본인 제외
          if (admin.userId === userInfo?.id) {
            return false;
          }
          
          // userIndex가 있는 경우에도 확인
          if (admin.userIndex === userInfo?.user_index) {
            return false;
          }
          
          return true;
        });
        setAdminList(filteredData);
        setLoading(false);
      }).catch(error => {
        setAdminList([]);
        setLoading(false);
      });
    }
  }, [open, activeTab === 0]); // activeTab === 0으로 변경하여 불필요한 재실행 방지

  // 채팅방 목록 조회
  React.useEffect(() => {
    if (open && activeTab === 1) {  // 채팅방 설정 탭일 때만 호출
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      if (userInfo?.id) {
        SearchRoom(userInfo.id).then((response) => {
          if (response?.data?.data) {
            setChatRooms(response.data.data);
          }
          setLoading(false);
        }).catch(error => {
          setLoading(false);
        });
      }
    }
  }, [open, activeTab === 1]); // activeTab === 1로 변경하여 불필요한 재실행 방지
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

    // 부모 컴포넌트에 위치 변경 알림
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
    setSize(newSize);
    const newPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
    setPosition(newPosition);

    // 부모 컴포넌트에 사이즈 변경 알림
    if (onSizeChange) {
      onSizeChange(newSize);
    }

    // 부모 컴포넌트에 위치 변경 알림
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [isResizing, resizeStart]);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // 채팅방 탭으로 이동할 때 자동으로 새로고침
    if (newValue === 1) {
      refreshChatRooms();
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

  const handleRoomClick = (room) => {
    // 기존 채팅방 클릭 시
    const roomData = {
      id: room.room_index,
      name: room.room_name || room.name,
      roomData: room,
      adminList: adminList,
      refreshChatRooms: refreshChatRooms,
      isExistingRoom: true,
      isExisting: true,
      participants: room.participants || [],
      isGroupChat: room.participants && room.participants.length > 2  // 그룹 채팅 여부 추가
    };
    
    onRoomSelect(roomData);
  };

  // 관리자 클릭 시 채팅방 생성 또는 기존 채팅방 입장
  const handleAdminClick = async (admin) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      
      // 1:1 채팅방 존재 여부 확인
      const checkRoomData = {
        room_index: null,
        room_name: `${admin.name}님과의 채팅`,
        user_id: userInfo.id,
        message: "",
        participants: [admin.userId, userInfo.id],
        timestamp: null,
      };
      
      try {
        const checkResponse = await CheckRoom(checkRoomData);
        
        // 성공 응답이고 data가 존재하는 경우 (기존 방 발견)
        if (checkResponse?.data?.resultCode === 200 && 
            checkResponse?.data?.data && typeof checkResponse.data.data === 'object' && 
            Object.keys(checkResponse.data.data).length > 0) {
          // 기존 1:1 채팅방이 존재하는 경우
          const existingRoom = checkResponse.data.data;
          
          // 백엔드에서 반환하는 Map의 키들을 확인하고 안전하게 접근
          const roomId = existingRoom.id || existingRoom.room_index || existingRoom.roomindex;
          const roomName = existingRoom.name || existingRoom.roomname || `${admin.name}와의 채팅방`;
          
          const roomData = {
            id: roomId,
            name: roomName,
            adminData: admin,
            adminList: adminList,
            subscribeToRoom: subscribeToRoom,
            refreshChatRooms: refreshChatRooms,
            isExistingRoom: true,
            isExisting: true,  // 추가: ChatRoomWindow에서 사용하는 속성
            participants: [admin.userId, userInfo.id]  // participants 정보 추가
          };
          
          // 기존 채팅방에 입장
          onRoomSelect(roomData);
        } else {
          // 새로운 1:1 채팅방 생성
           const roomData = {
             name: `${admin.name}와의 채팅방`,
             adminData: admin,
             adminList: adminList,
             subscribeToRoom: subscribeToRoom,
             refreshChatRooms: refreshChatRooms,
             isExistingRoom: false,
             isExisting: false,  // 추가: ChatRoomWindow에서 사용하는 속성
             participants: [admin.userId, userInfo.id]  // participants 정보 추가
           };
          
          onRoomSelect(roomData);
        }
      } catch (checkError) {
        // 확인 실패 시 새로운 채팅방 생성으로 진행
         const roomData = {
           name: `${admin.name}와의 채팅방`,
           adminData: admin,
           adminList: adminList,
           subscribeToRoom: subscribeToRoom,
           refreshChatRooms: refreshChatRooms,
           isExistingRoom: false,
           isExisting: false,  // 추가: ChatRoomWindow에서 사용하는 속성
           participants: [admin.userId, userInfo.id]  // participants 정보 추가
         };
        
        onRoomSelect(roomData);
      }
    } catch (error) {
      // 에러 처리
    }
  };

  const handleGroupToggle = (typeName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeName)) {
        newSet.delete(typeName);
      } else {
        newSet.add(typeName);
      }
      return newSet;
    });
  };

  // 새 채팅방 만들기 관련 핸들러들
  const handleCreateNewChatClick = () => {
    setShowAdminSelection(true);
    setSelectedAdmins(new Set());
  };

  const handleAdminCheckboxChange = (adminId, checked) => {
    setSelectedAdmins(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(adminId);
      } else {
        newSet.delete(adminId);
      }
      return newSet;
    });
  };

  const handleSelectAllAdmins = (checked) => {
    if (checked) {
      const allAdminIds = adminList.map(admin => admin.userIndex);
      setSelectedAdmins(new Set(allAdminIds));
    } else {
      setSelectedAdmins(new Set());
    }
  };

  const handleSelectAllInDepartment = (typeName, checked) => {
    const adminsInDepartment = adminList.filter(admin => admin.adminTypeName === typeName);
    const adminIdsInDepartment = adminsInDepartment.map(admin => admin.userIndex);
    
    setSelectedAdmins(prev => {
      const newSet = new Set(prev);
      if (checked) {
        adminIdsInDepartment.forEach(id => newSet.add(id));
      } else {
        adminIdsInDepartment.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handleCreateGroupChat = async () => {
    if (selectedAdmins.size === 0) {
      return;
    }

    const selectedAdminList = adminList.filter(admin => selectedAdmins.has(admin.userIndex));
    const userInfo = JSON.parse(localStorage.getItem('admin-info'));
    
    // 선택된 관리자들의 userId를 participants 배열에 담기
    const participants = selectedAdminList.map(admin => admin.userId);
    
    // 현재 사용자도 participants에 추가
    if (!participants.includes(userInfo.id)) {
      participants.push(userInfo.id);
    }
    
    // 그룹 채팅인 경우
    const roomName = generateRoomName(participants, null, adminList, userInfo.id, true);

    try {
      // 1:1 채팅과 동일한 방식으로 그룹 채팅방 생성
      const roomData = {
        name: roomName,
        adminData: selectedAdminList,
        adminList: adminList,
        participants: participants, // 참가자 목록 추가
        subscribeToRoom: subscribeToRoom,
        refreshChatRooms: refreshChatRooms,
        isExistingRoom: false,
        isExisting: false,
        isGroupChat: true
      };

      onRoomSelect(roomData);
      setShowAdminSelection(false);
      setSelectedAdmins(new Set());
    } catch (error) {
      // 에러 처리
    }
  };

  const handleBackToChatRooms = () => {
    setShowAdminSelection(false);
    setSelectedAdmins(new Set());
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
        width: size.width,
        height: isMinimized ? 60 : size.height,
        zIndex: 1300,
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
          <DragIndicator />
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            관리자 채팅
          </Typography>
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
          {/* 탭 */}
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
          <Box sx={{ height: size.height - 120, overflow: 'hidden' }}>
            {/* 홈 탭 */}
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

                {/* 관리자 목록 */}
                <Box sx={{ height: 'calc(100% - 80px)', overflowY: 'auto' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography>로딩 중...</Typography>
                    </Box>
                  ) : (
                    <List sx={{ padding: 0 }}>
                      {(() => {
                        // adminTypeName으로 그룹화
                        const groupedAdmins = adminList.reduce((groups, admin) => {
                          const typeName = admin.adminTypeName || '기타';
                          if (!groups[typeName]) {
                            groups[typeName] = [];
                          }
                          groups[typeName].push(admin);
                          return groups;
                        }, {});

                        // 관리자 타입별 우선순위 정의 (높은 직급에서 낮은 직급 순)
                        const typePriority = {
                          '대표': 1,
                          '임원': 2,
                          '전산간부': 3,
                          '전산개발': 4,
                          '기타': 999
                        };

                        // 커스텀 정렬 로직
                        const sortedTypes = Object.keys(groupedAdmins).sort((a, b) => {
                          const priorityA = typePriority[a] || typePriority['기타'];
                          const priorityB = typePriority[b] || typePriority['기타'];
                          
                          // 우선순위가 같으면 adminTypeOrder로 정렬
                          if (priorityA === priorityB) {
                            const adminA = groupedAdmins[a][0];
                            const adminB = groupedAdmins[b][0];
                            return (adminA.adminTypeOrder || 999) - (adminB.adminTypeOrder || 999);
                          }
                          
                          return priorityA - priorityB;
                        });

                        return sortedTypes.map(typeName => {
                          const adminsInType = groupedAdmins[typeName]
                            .filter(admin =>
                              admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (admin.adminTypeName && admin.adminTypeName.toLowerCase().includes(searchTerm.toLowerCase()))
                            );

                          if (adminsInType.length === 0) return null;

                          const isExpanded = expandedGroups.has(typeName);

                          return (
                            <React.Fragment key={typeName}>
                              {/* 그룹 헤더 */}
                              <ListItem
                                onClick={() => handleGroupToggle(typeName)}
                                sx={{
                                  backgroundColor: '#f8f9fa',
                                  borderBottom: '1px solid #e0e0e0',
                                  py: 1,
                                  cursor: 'pointer',
                                  '&:hover': { backgroundColor: '#e3f2fd' }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', ml: 1 }}>
                                      {typeName}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={adminsInType.length}
                                    size="small"
                                    sx={{ height: 20, fontSize: '0.75rem' }}
                                  />
                                </Box>
                              </ListItem>

                              {/* 그룹 내 관리자들 */}
                              {isExpanded && adminsInType.map((admin) => (
                                <ListItem
                                  key={admin.userIndex || `admin-${admin.userIndex}`}
                                  onClick={() => handleAdminClick(admin)}
                                  sx={{
                                    pl: 3,
                                    '&:hover': { backgroundColor: '#f5f5f5' },
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <ListItemText
                                    primary={admin.name}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </List>
                  )}
                </Box>
              </Box>
            )}

            {/* 채팅방 탭 */}
            {activeTab === 1 && (
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {showAdminSelection ? (
                  // 관리자 선택 화면
                  <Box sx={{ height: '100%', overflow: 'hidden' }}>
                    {/* 헤더 */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="no-drag">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={handleBackToChatRooms}>
                          <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          새 채팅방 만들기
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={selectedAdmins.size === 0}
                        onClick={handleCreateGroupChat}
                      >
                        채팅방 생성 ({selectedAdmins.size}명)
                      </Button>
                    </Box>

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

                    {/* 관리자 목록 */}
                    <Box sx={{ height: 'calc(100% - 120px)', overflowY: 'auto' }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography>로딩 중...</Typography>
                        </Box>
                      ) : (
                                                 <List sx={{ padding: 0 }}>

                          {(() => {
                            // adminTypeName으로 그룹화
                            const groupedAdmins = adminList.reduce((groups, admin) => {
                              const typeName = admin.adminTypeName || '기타';
                              if (!groups[typeName]) {
                                groups[typeName] = [];
                              }
                              groups[typeName].push(admin);
                              return groups;
                            }, {});

                            // 관리자 타입별 우선순위 정의 (높은 직급에서 낮은 직급 순)
                            const typePriority = {
                              '대표': 1,
                              '임원': 2,
                              '전산간부': 3,
                              '전산개발': 4,
                              '기타': 999
                            };

                            // 커스텀 정렬 로직
                            const sortedTypes = Object.keys(groupedAdmins).sort((a, b) => {
                              const priorityA = typePriority[a] || typePriority['기타'];
                              const priorityB = typePriority[b] || typePriority['기타'];
                              
                              // 우선순위가 같으면 adminTypeOrder로 정렬
                              if (priorityA === priorityB) {
                                const adminA = groupedAdmins[a][0];
                                const adminB = groupedAdmins[b][0];
                                return (adminA.adminTypeOrder || 999) - (adminB.adminTypeOrder || 999);
                              }
                              
                              return priorityA - priorityB;
                            });

                            return sortedTypes.map(typeName => {
                              const adminsInType = groupedAdmins[typeName]
                                .filter(admin =>
                                  admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (admin.adminTypeName && admin.adminTypeName.toLowerCase().includes(searchTerm.toLowerCase()))
                                );

                              if (adminsInType.length === 0) return null;

                              const isExpanded = expandedGroups.has(typeName);

                              return (
                                <React.Fragment key={typeName}>
                                  {/* 그룹 헤더 */}
                                  <ListItem
                                    sx={{
                                      backgroundColor: '#f8f9fa',
                                      borderBottom: '1px solid #e0e0e0',
                                      py: 1,
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#e3f2fd' }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Checkbox
                                          checked={adminsInType.length > 0 && adminsInType.every(admin => selectedAdmins.has(admin.userIndex))}
                                          indeterminate={adminsInType.some(admin => selectedAdmins.has(admin.userIndex)) && !adminsInType.every(admin => selectedAdmins.has(admin.userIndex))}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllInDepartment(typeName, e.target.checked);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() => handleGroupToggle(typeName)}
                                          sx={{ p: 0.5 }}
                                        >
                                          {isExpanded ? <ExpandMore /> : <ChevronRight />}
                                        </IconButton>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', ml: 1 }}>
                                          {typeName}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        label={adminsInType.length}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.75rem' }}
                                      />
                                    </Box>
                                  </ListItem>

                                  {/* 그룹 내 관리자들 */}
                                  {isExpanded && adminsInType.map((admin) => (
                                    <ListItem
                                      key={admin.userIndex || `admin-${admin.userIndex}`}
                                      sx={{
                                        pl: 3,
                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleAdminCheckboxChange(admin.userIndex, !selectedAdmins.has(admin.userIndex))}
                                    >
                                      <Checkbox
                                        checked={selectedAdmins.has(admin.userIndex)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleAdminCheckboxChange(admin.userIndex, e.target.checked);
                                        }}
                                      />
                                      <ListItemText
                                        primary={admin.name}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                      />
                                    </ListItem>
                                  ))}
                                </React.Fragment>
                              );
                            });
                          })()}
                        </List>
                      )}
                    </Box>
                  </Box>
                ) : (
                  // 기존 채팅방 목록 화면
                  <>
                    {/* 검색 */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="채팅방 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <Search sx={{ mr: 1, color: '#666' }} />
                        }}
                      />
                    </Box>

                    {/* 새 채팅방 버튼 */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }} className="no-drag">
                      <Button
                        startIcon={<Add />}
                        sx={{ width: '100%' }}
                        variant="outlined"
                        size="small"
                        onClick={handleCreateNewChatClick}
                      >
                        새 채팅방 만들기
                      </Button>
                    </Box>

                    {/* 채팅방 목록 */}
                    <Box sx={{ height: 'calc(100% - 140px)', overflowY: 'auto' }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography>로딩 중...</Typography>
                        </Box>
                      ) : chatRooms.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            참여 중인 채팅방이 없습니다.
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            홈 탭에서 관리자를 선택하여 채팅을 시작하세요.
                          </Typography>
                        </Box>
                      ) : (
                        <List sx={{ py: 0 }}>
                          {chatRooms
                            .filter(room => {
                              // 채팅방 이름 생성 함수
                              const generateDisplayName = (room) => {
                                const userInfo = JSON.parse(localStorage.getItem('admin-info'));
                                return generateRoomName(room.participants, null, adminList, userInfo.id, room.participants && room.participants.length > 2);
                              };
                              
                              const displayName = generateDisplayName(room);
                              return displayName.toLowerCase().includes(searchTerm.toLowerCase());
                            })
                            .map((room, index) => {
                              // 채팅방 이름 생성 함수
                              const generateDisplayName = (room) => {
                                const userInfo = JSON.parse(localStorage.getItem('admin-info'));
                                return generateRoomName(room.participants, null, adminList, userInfo.id, room.participants && room.participants.length > 2);
                              };
                              
                              const displayName = generateDisplayName(room);
                              
                              return (
                                <ListItem
                                  key={room.room_index || index}
                                  button="true"
                                  onClick={() => handleRoomClick({
                                    name: displayName,
                                    id: room.room_index,
                                    roomData: room
                                  })}
                                  sx={{
                                    '&:hover': { backgroundColor: '#f5f5f5' },
                                    borderBottom: '1px solid #f0f0f0'
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle2" noWrap>
                                          {displayName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {room.joined_at ? new Date(room.joined_at).toLocaleDateString() : ''}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Box component="span">
                                        <Typography component="span" variant="body2" color="text.secondary" noWrap>
                                          방 ID: {room.room_index}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="caption" color="text.secondary">
                                          {room.notifications_enabled === 'true' ? '알림 켜짐' : '알림 꺼짐'}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                        </List>
                      )}
                    </Box>
                  </>
                )}
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
                </List>
              </Box>
            )}
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

export default ChatMainWindow; 