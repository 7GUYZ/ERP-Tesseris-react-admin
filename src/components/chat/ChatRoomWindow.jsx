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
import { ChatList } from '../../api/auth/JihunAuth';

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
  const { sendMessage, subscribeToRoom, unsubscribeFromRoom, isConnected } = useWebSocket();
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
  const [adminList, setAdminList] = useState([]); // 관리자 정보 저장
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // 더 불러올 메시지가 있는지
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 추가 메시지 로딩 중

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null); // 무한스크롤용 상단 ref
  const messagesContainerRef = useRef(null); // 메시지 컨테이너 ref
  const inputRef = useRef(null);
  const messagesRef = useRef([]); // 메시지 목록을 ref로 관리
  const subscribeToRoomRef = useRef(subscribeToRoom);
  const unsubscribeFromRoomRef = useRef(unsubscribeFromRoom);
  const addMessageRef = useRef(null);

  // 메시지 추가 함수
  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // 새 메시지를 시간순으로 정렬하여 삽입
      const newTimestamp = new Date(newMessage.timestamp).getTime();
      
      // 기존 메시지들 중에서 새 메시지보다 늦은 시간의 메시지를 찾아서 그 앞에 삽입
      let insertIndex = prev.length;
      for (let i = 0; i < prev.length; i++) {
        const currentTimestamp = new Date(prev[i].timestamp).getTime();
        if (newTimestamp <= currentTimestamp) {
          insertIndex = i;
          break;
        }
      }
      
      const updatedMessages = [
        ...prev.slice(0, insertIndex),
        newMessage,
        ...prev.slice(insertIndex)
      ];
      
      messagesRef.current = updatedMessages; // ref도 업데이트
      return updatedMessages;
    });
  }, []);

  // ref 업데이트
  React.useEffect(() => {
    subscribeToRoomRef.current = subscribeToRoom;
    unsubscribeFromRoomRef.current = unsubscribeFromRoom;
    addMessageRef.current = addMessage;
  }, [subscribeToRoom, unsubscribeFromRoom, addMessage]);

  // 이전 메시지 불러오기 함수
  const loadPreviousMessages = async () => {
    if (!roomId || isLoadingMore || !hasMoreMessages) {
      return;
    }
    
    setIsLoadingMore(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      const nextPage = currentPage + 1;
      
      const response = await ChatList(roomId, userInfo.id, nextPage, 25);
      
      if (response.data && response.data.resultCode === 200 && response.data.data) {
        const chatData = response.data.data;
        const previousMessages = chatData.messages || chatData;
        
        if (previousMessages.length === 0) {
          setHasMoreMessages(false);
          setIsLoadingMore(false);
          return;
        }
        
        // 관리자 정보를 Map으로 변환하여 빠른 검색 가능하게 함
        const adminMap = new Map();
        adminList.forEach(admin => {
          adminMap.set(admin.userId, admin.name);
        });
        
        // 이전 메시지를 올바른 형식으로 변환
        const formattedPreviousMessages = previousMessages
          .map(msg => {
            const userId = msg.userid || msg.user_id;
            const adminName = adminMap.get(userId);
            
            return {
              id: `previous_${msg.messageindex || msg.messageid || msg.id || Date.now()}_${Math.random()}`,
              text: msg.message,
              sender: { 
                id: userId, 
                name: adminName || userId
              },
              timestamp: msg.sentat || msg.timestamp || new Date().toISOString(),
              isLocal: false
            };
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // 현재 스크롤 위치 저장
        const messagesContainer = messagesContainerRef.current;
        const scrollHeight = messagesContainer?.scrollHeight || 0;
        const scrollTop = messagesContainer?.scrollTop || 0;
        
        // 이전 메시지를 기존 메시지 앞에 추가
        setMessages(prev => {
          const updatedMessages = [...formattedPreviousMessages, ...prev];
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
        
        // 페이지 업데이트
        setCurrentPage(nextPage);
        
        // 스크롤 위치 복원 (새 메시지가 추가된 만큼)
        setTimeout(() => {
          if (messagesContainer) {
            const newScrollHeight = messagesContainer.scrollHeight;
            const heightDifference = newScrollHeight - scrollHeight;
            messagesContainer.scrollTop = scrollTop + heightDifference;
          }
        }, 100);
      }
    } catch (error) {
      console.error('이전 메시지 불러오기 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

     // 방 타입 체크 및 초기화 (첫 입장 시에만 실행)
       React.useEffect(() => {
      if (open && roomData) {
       
       // 기존 방인지 새로운 방인지 확인
       const hasRoomIndex = roomData.roomData?.room_index || roomData.id;
       const isExisting = !!(hasRoomIndex && hasRoomIndex !== 'undefined' && hasRoomIndex !== 'null' && hasRoomIndex !== 0);
       
               // 기존 방인 경우 즉시 구독 및 메시지 불러오기
        if (isExisting) {
          const existingRoomId = hasRoomIndex;
          setRoomId(existingRoomId);
          
          // 페이지 상태 초기화
          setCurrentPage(0);
          setHasMoreMessages(true);
          setIsLoadingMore(false);
         
         const userInfo = JSON.parse(localStorage.getItem('user-info'));
         
                   // 기존 메시지 불러오기
          const loadExistingMessages = async () => {
            try {
              const response = await ChatList(existingRoomId, userInfo.id, 0, 25); // 최근 25개 메시지
               
               if (response.data && response.data.resultCode === 200 && response.data.data) {
                 const chatData = response.data.data;
                 const existingMessages = chatData.messages || chatData; // 새로운 구조 또는 기존 구조 지원
                 const adminData = chatData.adminList || []; // 관리자 정보
                 
                 // 관리자 정보를 상태에 저장
                 setAdminList(adminData);
                
                 // 관리자 정보를 Map으로 변환하여 빠른 검색 가능하게 함
                 const adminMap = new Map();
                 adminData.forEach(admin => {
                   adminMap.set(admin.userId, admin.name);
                 });
                 
                 // 기존 메시지를 올바른 형식으로 변환하여 추가 (백엔드에서 최신순 정렬됨)
                 const formattedMessages = existingMessages
                   .map(msg => {
                     const userId = msg.userid || msg.user_id;
                     const adminName = adminMap.get(userId);
                     
                     return {
                       id: `existing_${msg.messageindex || msg.messageid || msg.id || Date.now()}_${Math.random()}`,
                       text: msg.message,
                       sender: { 
                         id: userId, 
                         name: adminName || userId // 관리자 이름이 있으면 사용, 없으면 ID 사용
                       },
                       timestamp: msg.sentat || msg.timestamp || new Date().toISOString(),
                       isLocal: false
                     };
                   })
                   .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // 시간순 정렬 (오래된 순)
               
                                 setMessages(formattedMessages);
                 messagesRef.current = formattedMessages;
                 
                 // 메시지 로드 후 스크롤을 맨 아래로 이동
                 setTimeout(() => {
                   messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                 }, 100);
             }
           } catch (error) {
             console.error('기존 메시지 불러오기 실패:', error);
           }
         };
         
         // 기존 메시지 불러오기 실행
         loadExistingMessages();
         
         const subscribeSuccess = subscribeToRoomRef.current(existingRoomId, (receivedMessage) => {
           console.log('기존 방에서 새 메시지 수신:', receivedMessage);
           
           // 내가 보낸 메시지가 아닌 경우에만 추가
           if (receivedMessage.user_id !== userInfo.id) {
             const currentMessages = messagesRef.current;
             // 이미 같은 내용의 로컬 메시지가 있는지 확인
             const hasLocalMessage = currentMessages.some(msg => 
               msg.isLocal && 
               msg.text === receivedMessage.message && 
               msg.sender.id === userInfo.id
             );
             
             // 로컬 메시지가 있으면 제거하고 서버 메시지로 교체
             if (hasLocalMessage) {
               setMessages(prev => prev.filter(msg => !(msg.isLocal && msg.text === receivedMessage.message)));
             }
             
             // 관리자 정보에서 이름 찾기
             const adminMap = new Map();
             adminList.forEach(admin => {
               adminMap.set(admin.userId, admin.name);
             });
             const adminName = adminMap.get(receivedMessage.user_id);
             
             // 새 메시지 추가
             addMessage({
               id: `server_${Date.now()}_${Math.random()}`,
               text: receivedMessage.message,
               sender: { 
                 id: receivedMessage.user_id, 
                 name: adminName || receivedMessage.user_id 
               },
               timestamp: receivedMessage.timestamp || new Date().toISOString(),
               isLocal: false
             });
           }
         });

         if (subscribeSuccess) {
           console.log(`기존 방 ${existingRoomId} 구독 완료`);
         }
       } else {
         
         // 새로운 방 생성 시 메시지 수신을 위한 구독
         const subscribeSuccess = subscribeToRoom("admin", (receivedMessage) => {
           console.log('새 방 생성 후 메시지 수신:', receivedMessage);
           
                       // 방이 생성된 경우 room_index 업데이트
            if (receivedMessage.room_index && !roomId) {
              setRoomId(receivedMessage.room_index);
              
              // 페이지 상태 초기화
              setCurrentPage(0);
              setHasMoreMessages(true);
              setIsLoadingMore(false);
              
              // 새로운 방으로 구독 변경 및 메시지 불러오기
              unsubscribeFromRoom("admin");
             
                           // 새로 생성된 방의 기존 메시지 불러오기
              const loadNewRoomMessages = async () => {
                try {
                  const response = await ChatList(receivedMessage.room_index, userInfo.id, 0, 25);
                   
                   if (response.data && response.data.resultCode === 200 && response.data.data) {
                     const chatData = response.data.data;
                     const existingMessages = chatData.messages || chatData; // 새로운 구조 또는 기존 구조 지원
                     const adminData = chatData.adminList || []; // 관리자 정보
                     
                     // 관리자 정보를 상태에 저장
                     setAdminList(adminData);
                     
                     // 관리자 정보를 Map으로 변환하여 빠른 검색 가능하게 함
                     const adminMap = new Map();
                     adminData.forEach(admin => {
                       adminMap.set(admin.userId, admin.name);
                     });
                     
                     // 기존 메시지를 올바른 형식으로 변환하여 추가 (백엔드에서 최신순 정렬됨)
                     const formattedMessages = existingMessages
                       .map(msg => {
                         const userId = msg.userid || msg.user_id;
                         const adminName = adminMap.get(userId);
                         
                         return {
                           id: `existing_${msg.messageindex || msg.messageid || msg.id || Date.now()}_${Math.random()}`,
                           text: msg.message,
                           sender: { 
                             id: userId, 
                             name: adminName || userId // 관리자 이름이 있으면 사용, 없으면 ID 사용
                           },
                           timestamp: msg.sentat || msg.timestamp || new Date().toISOString(),
                           isLocal: false
                         };
                       })
                       .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // 시간순 정렬 (오래된 순)
                   
                                         setMessages(formattedMessages);
                     messagesRef.current = formattedMessages;
                     
                     // 메시지 로드 후 스크롤을 맨 아래로 이동
                     setTimeout(() => {
                       messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                     }, 100);
                 }
               } catch (error) {
                 console.error('새 방 메시지 불러오기 실패:', error);
               }
             };
             
             // 새 방 메시지 불러오기 실행
             loadNewRoomMessages();
             
             subscribeToRoom(receivedMessage.room_index, (roomMessage) => {
               console.log('새 방에서 메시지 수신:', roomMessage);
               
               const userInfo = JSON.parse(localStorage.getItem('user-info'));
               if (roomMessage.user_id !== userInfo.id) {
                 // 관리자 정보에서 이름 찾기
                 const adminMap = new Map();
                 adminList.forEach(admin => {
                   adminMap.set(admin.userId, admin.name);
                 });
                 const adminName = adminMap.get(roomMessage.user_id);
                 
                 addMessage({
                   id: `server_${Date.now()}_${Math.random()}`,
                   text: roomMessage.message,
                   sender: { 
                     id: roomMessage.user_id, 
                     name: adminName || roomMessage.user_id 
                   },
                   timestamp: roomMessage.timestamp || new Date().toISOString(),
                   isLocal: false
                 });
               }
             });
           }
           
           // 내가 보낸 메시지가 아닌 경우에만 추가
           const userInfo = JSON.parse(localStorage.getItem('user-info'));
           if (receivedMessage.user_id !== userInfo.id) {
             const currentMessages = messagesRef.current;
             // 이미 같은 내용의 로컬 메시지가 있는지 확인
             const hasLocalMessage = currentMessages.some(msg => 
               msg.isLocal && 
               msg.text === receivedMessage.message && 
               msg.sender.id === userInfo.id
             );
             
             // 로컬 메시지가 있으면 제거하고 서버 메시지로 교체
             if (hasLocalMessage) {
               setMessages(prev => prev.filter(msg => !(msg.isLocal && msg.text === receivedMessage.message)));
             }
             
             // 관리자 정보에서 이름 찾기
             const adminMap = new Map();
             adminList.forEach(admin => {
               adminMap.set(admin.userId, admin.name);
             });
             const adminName = adminMap.get(receivedMessage.user_id);
             
             // 새 메시지 추가
             addMessage({
               id: `server_${Date.now()}_${Math.random()}`,
               text: receivedMessage.message,
               sender: { 
                 id: receivedMessage.user_id, 
                 name: adminName || receivedMessage.user_id 
               },
               timestamp: receivedMessage.timestamp || new Date().toISOString(),
               isLocal: false
             });
           }
         });
         
         if (subscribeSuccess) {
           console.log('새 방 생성 구독 완료');
         }
       }
     }
       }, [open, roomData]);



    // ===============================메세지 보내기=======================================
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      const generateRoomName = (participants) => {
        if (participants.length === 2) {
          // 1:1 채팅 - adminData에서 이름 사용
          if (roomData.adminData) {
            return `${roomData.adminData.name}님과의 채팅`;
          }
          // 기존 방의 경우 UUID 사용 (임시)
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
        // 현재 room_index 확인 (roomId state 우선 사용)
        const currentRoomIndex = roomId || roomData.roomData?.room_index || roomData.id;
        const hasValidRoomIndex = currentRoomIndex && currentRoomIndex !== 'undefined' && currentRoomIndex !== 'null' && currentRoomIndex !== 0;
        
        if (hasValidRoomIndex) {
          // 기존 방인 경우
          
          const messageData = {
            room_index: currentRoomIndex,
            room_name: roomData.name || roomData.roomData?.room_name,
            user_id: userInfo.id,
            message: newMessage,
            participants: [], // 기존 방의 경우 참가자 정보는 서버에서 처리
            timestamp: null,
          };
          
          // WebSocket으로 메시지 전송 (DB 저장 포함)
          sendMessage(currentRoomIndex, messageData);
          
          // 로컬 메시지 추가
          const localMessageId = `local_${Date.now()}_${Math.random()}`;
          addMessage({
            id: localMessageId,
            text: newMessage,
            sender: { id: userInfo.id, name: userInfo.name },
            timestamp: new Date().toISOString(),
            isLocal: true
          });
          
        } else {
          // 새로운 방인 경우 (첫 메시지로 방 생성)
          
          const messageData = {
            room_index: null,
            room_name: generateRoomName([roomData.adminData.userId, userInfo.id]),
            user_id: userInfo.id,
            message: newMessage,
            participants: [roomData.adminData.userId, userInfo.id],
            timestamp: null,
          };

          // WebSocket으로 메시지 전송 (방 생성 및 DB 저장 포함)
          sendMessage("admin", messageData);
          
          // 로컬 메시지 추가
          const localMessageId = `local_${Date.now()}_${Math.random()}`;
          addMessage({
            id: localMessageId,
            text: newMessage,
            sender: { id: userInfo.id, name: userInfo.name },
            timestamp: new Date().toISOString(),
            isLocal: true
          });
        }
        
        // 입력 필드 초기화
        setNewMessage('');
        setIsTyping(false);
        
        // 입력 필드에 포커스 유지
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        
      } catch (error) {
        console.error("메시지 전송 실패:", error);
        // 에러 발생 시에도 로컬 메시지는 추가
        addMessage({
          text: newMessage,
          sender: { id: userInfo.id, name: userInfo.name },
          timestamp: new Date().toISOString(),
          error: true // 에러 표시용
        });
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

       // 메시지 자동 스크롤 (새 메시지 추가 시에만)
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 스크롤 이벤트 핸들러 (무한스크롤)
    const handleScroll = useCallback((e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      
      // 스크롤이 상단에 가까워지면 이전 메시지 불러오기
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMore && roomId) {
        loadPreviousMessages();
      }
    }, [hasMoreMessages, isLoadingMore, loadPreviousMessages, roomId]);

    // 스크롤 이벤트 리스너 등록
    React.useEffect(() => {
      const messagesContainer = messagesContainerRef.current;
      
      if (messagesContainer) {
        messagesContainer.addEventListener('scroll', handleScroll);
        
        return () => {
          messagesContainer.removeEventListener('scroll', handleScroll);
        };
      }
    }, [handleScroll]);
  
    React.useEffect(() => {
      // 메시지가 있고, 마지막 메시지가 로컬 메시지이거나 새로 추가된 메시지인 경우에만 스크롤
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.isLocal || lastMessage.id.startsWith('server_')) {
          scrollToBottom();
        }
      }
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

  // 채팅방 나가기 시 구독 해제
  const handleBack = () => {
    if (roomId) {
      unsubscribeFromRoom(roomId);
    }
    
    setMessages([]);
    setRoomId(null);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setIsLoadingMore(false);
    
    onBack();
  };

  // 채팅방 닫기 시에도 구독 해제
  const handleClose = () => {
    if (roomId) {
      unsubscribeFromRoom(roomId);
    }
    
    setMessages([]);
    setRoomId(null);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setIsLoadingMore(false);
    
    onClose();
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
            onClick={handleBack}
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
              {roomData.adminData ? roomData.adminData.name : (roomData.name || '채팅방')}
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
            onClick={handleClose}
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
              ref={messagesContainerRef}
              sx={{
                height: size.height - 120,
                overflowY: 'auto',
                p: 1,
                backgroundColor: '#fafafa',
                                display: 'flex',
                 flexDirection: 'column',
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
              {/* 무한스크롤 로딩 인디케이터 */}
              {isLoadingMore && (
                <Box sx={{ textAlign: 'center', py: 1, backgroundColor: '#f0f0f0', borderRadius: 1, mx: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    이전 메시지를 불러오는 중...
                  </Typography>
                </Box>
              )}
              
              {/* 더 이상 불러올 메시지가 없을 때 */}
              {!hasMoreMessages && messages.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 1, backgroundColor: '#e8f5e8', borderRadius: 1, mx: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    모든 메시지를 불러왔습니다
                  </Typography>
                </Box>
              )}
              
              
                         {messages.map((message, index) => {
                               const safeKey = message.id || `room_msg_${index}_${message.timestamp || Date.now()}`;
                const userInfo = JSON.parse(localStorage.getItem('user-info'));
                // 메시지 발신자 ID와 현재 사용자 ID를 정확히 비교
                const messageSenderId = String(message.sender?.id || '');
                const currentUserId = String(userInfo?.id || '');
                const isMyMessage = messageSenderId === currentUserId && messageSenderId !== '';

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
                         gap: 1,
                         width: '100%'
                       }}
                     >
                       {!isMyMessage && (
                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                           <Typography variant="caption" sx={{ color: '#666', ml: 1, mb: 0.5 }}>
                             {message.sender?.name && message.sender.name !== message.sender.id ? message.sender.name : 'Unknown'}
                           </Typography>
                           <Paper
                             sx={{
                               p: 1.5,
                               maxWidth: 280,
                               backgroundColor: '#F8FAFC',
                               color: 'black',
                               borderRadius: '18px 18px 18px 4px',
                               boxShadow: 1,
                               border: '1px solid #e0e0e0',
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
                                 textAlign: 'left'
                               }}
                             >
                               {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                                 hour: '2-digit', 
                                 minute: '2-digit',
                                 hour12: true 
                               }) : ''}
                             </Typography>
                           </Paper>
                         </Box>
                       )}
                       {isMyMessage && (
                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0, flex: 1 }}>
                           <Paper
                             sx={{
                               p: 1.5,
                               maxWidth: 280,
                               backgroundColor: '#1976d2',
                               color: 'white',
                               borderRadius: '18px 18px 4px 18px',
                               boxShadow: 1,
                               border: 'none',
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
                                 textAlign: 'right'
                               }}
                             >
                               {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                                 hour: '2-digit', 
                                 minute: '2-digit',
                                 hour12: true 
                               }) : ''}
                             </Typography>
                           </Paper>
                         </Box>
                       )}
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