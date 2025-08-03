import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper, Box, TextField, Button, IconButton,
  Typography, Chip, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Close, Send, Minimize, DragIndicator,
  ArrowBack, Call, VideoCall, Info, AttachFile, MoreVert, PersonAdd, ExitToApp
} from '@mui/icons-material';
import { useWebSocket } from './WebSocketConfig';
import { ChatList, LeaveRoom } from '../../api/auth/JihunAuth';

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
  // roomData에서 refreshChatRooms 함수 추출
  const { refreshChatRooms, ...roomDataWithoutRefresh } = roomData || {};
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
  // 부모 컴포넌트에서 전달받은 관리자 목록 사용, 없으면 빈 배열
  const [adminList, setAdminList] = useState(roomDataWithoutRefresh?.adminList || []); // 관리자 정보 저장
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // 더 불러올 메시지가 있는지
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 추가 메시지 로딩 중
  const [moreOptionsAnchor, setMoreOptionsAnchor] = useState(null); // 더보기 메뉴 앵커
  const [moreOptionsList, setMoreOptionsList] = useState([
    { id: 'addUser', label: '초대하기', icon: 'PersonAdd' },
    { id: 'leaveRoom', label: '채팅방 나가기', icon: 'ExitToApp' }
  ]); // 더보기 옵션 리스트

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null); // 무한스크롤용 상단 ref
  const messagesContainerRef = useRef(null); // 메시지 컨테이너 ref
  const inputRef = useRef(null);
  const messagesRef = useRef([]); // 메시지 목록을 ref로 관리
  const subscribeToRoomRef = useRef(subscribeToRoom);
  const unsubscribeFromRoomRef = useRef(unsubscribeFromRoom);
  const addMessageRef = useRef(null);
  const adminListRef = useRef(adminList); // adminList를 ref로 관리

  // 인덱스 기반 비교 함수
  const compareIndex = useCallback((indexA, indexB) => {
    // messageindex가 없는 경우 타임스탬프로 대체
    if (!indexA && !indexB) {
      return 0;
    }
    if (!indexA) return 1;
    if (!indexB) return -1;

    // 숫자로 변환하여 비교
    const numA = parseInt(indexA) || 0;
    const numB = parseInt(indexB) || 0;

    return numA - numB; // 오름차순 정렬 (낮은 인덱스가 먼저)
  }, []);

  // 메시지 추가 함수
  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // 새 메시지를 배열 끝에 추가하고 전체를 인덱스순으로 정렬
      const updatedMessages = [...prev, newMessage].sort((a, b) => {
        return compareIndex(a.messageindex, b.messageindex);
      });

      messagesRef.current = updatedMessages; // ref도 업데이트
      return updatedMessages;
    });
  }, [compareIndex]);

  // 발신자 이름 해결 함수
  const resolveSenderName = useCallback((userId, senderName) => {
    // 백엔드에서 전송한 sender_name 우선 사용
    if (senderName && senderName !== "Unknown") {
      return senderName;
    }

    // adminList가 비어있지 않은 경우에만 매핑 시도 (ref 사용)
    const currentAdminList = adminListRef.current;
    if (currentAdminList && currentAdminList.length > 0) {
      const adminMap = new Map();
      currentAdminList.forEach(admin => {
        adminMap.set(admin.userId, admin.name);
      });
      const foundName = adminMap.get(userId);
      if (foundName) {
        return foundName;
      }
    }
    return userId;
  }, []); // adminList 의존성 제거하여 무한 루프 방지

  // ref 업데이트
  React.useEffect(() => {
    subscribeToRoomRef.current = subscribeToRoom;
    unsubscribeFromRoomRef.current = unsubscribeFromRoom;
    addMessageRef.current = addMessage;
  }, [subscribeToRoom, unsubscribeFromRoom, addMessage]);

  // roomData에서 adminList 업데이트
  React.useEffect(() => {
    if (roomDataWithoutRefresh?.adminList) {
      setAdminList(roomDataWithoutRefresh.adminList);
      adminListRef.current = roomDataWithoutRefresh.adminList; // ref도 업데이트
    }
  }, [roomDataWithoutRefresh?.adminList]);

  // 채팅방이 닫히거나 변경될 때 메뉴 닫기
  useEffect(() => {
    if (!open || !roomDataWithoutRefresh) {
      setMoreOptionsAnchor(null);
    }
  }, [open, roomDataWithoutRefresh]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreOptionsAnchor && !event.target.closest('[data-more-options]')) {
        setMoreOptionsAnchor(null);
      }
    };

    if (moreOptionsAnchor) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreOptionsAnchor]);

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      if (roomId) {
        unsubscribeFromRoomRef.current(roomId);
      }
    };
  }, [roomId]);

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
              messageindex: msg.messageindex || null,
              isLocal: false
            };
          })
          .sort((a, b) => {
            return compareIndex(a.messageindex, b.messageindex);
          });

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
    } finally {
      setIsLoadingMore(false);
    }
  };

  // roomId 변경 시 이전 구독 해제 및 새 구독 설정
  useEffect(() => {
    if (!roomDataWithoutRefresh) return;

    console.log("🔍 ChatRoomWindow useEffect - roomDataWithoutRefresh:", roomDataWithoutRefresh);
    console.log("🔍 roomDataWithoutRefresh 전체 구조:", JSON.stringify(roomDataWithoutRefresh, null, 2));
    
    const hasRoomIndex = roomDataWithoutRefresh.id;
    const existingRoomId = roomDataWithoutRefresh.id; // roomDataWithoutRefresh.id를 직접 사용
    // 기존 방인지 확인 - id나 room_index가 있으면 기존 방으로 판단
    const isExisting = roomDataWithoutRefresh.isExistingRoom || 
                      roomDataWithoutRefresh.isExisting || 
                      !!(roomDataWithoutRefresh.id || roomDataWithoutRefresh.roomData?.room_index);

    console.log("🔍 hasRoomIndex:", hasRoomIndex);
    console.log("🔍 existingRoomId:", existingRoomId);
    console.log("🔍 isExisting:", isExisting);
    console.log("🔍 current roomId:", roomId);

    // 이전 구독 해제 (roomId가 있고 새 방과 다른 경우)
    if (roomId && roomId !== existingRoomId) {
      console.log("🔍 이전 구독 해제:", roomId);
      unsubscribeFromRoomRef.current(roomId);
    }

    if (isExisting && existingRoomId) {
      console.log("🔍 기존 방 입장:", existingRoomId);
      
      // 기존 방 입장
      setRoomId(existingRoomId);

      // 페이지 상태 초기화
      setCurrentPage(0);
      setHasMoreMessages(true);
      setIsLoadingMore(false);

      const userInfo = JSON.parse(localStorage.getItem('user-info'));

      // 기존 메시지 불러오기
      const loadExistingMessages = async () => {
        try {
          console.log("🔍 ChatList 호출:", existingRoomId, userInfo.id);
          const response = await ChatList(existingRoomId, userInfo.id, 0, 25); // 최근 25개 메시지

          console.log("🔍 ChatList 응답:", response);

          if (response.data && response.data.resultCode === 200 && response.data.data) {
            const chatData = response.data.data;
            const existingMessages = chatData.messages || chatData; // 새로운 구조 또는 기존 구조 지원
            const adminData = chatData.adminList || []; // 관리자 정보

            console.log("🔍 기존 메시지 수:", existingMessages.length);
            console.log("🔍 관리자 데이터:", adminData);

            // 관리자 정보를 상태에 저장
            setAdminList(adminData);

            // 관리자 정보를 Map으로 변환하여 빠른 검색 가능하게 함
            const adminMap = new Map();
            adminData.forEach(admin => {
              adminMap.set(admin.userId, admin.name);
            });

            // 기존 메시지를 올바른 형식으로 변환하여 추가
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
                  messageindex: msg.messageindex || null,
                  isLocal: false
                };
              })
              .sort((a, b) => {
                return compareIndex(a.messageindex, b.messageindex);
              });

            console.log("🔍 포맷된 메시지 수:", formattedMessages.length);
            setMessages(formattedMessages);
            messagesRef.current = formattedMessages;

            // 메시지 로드 후 스크롤을 맨 아래로 이동
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
            }, 100);
          } else {
            console.log("🔍 ChatList 응답이 유효하지 않음:", response);
          }
        } catch (error) {
          console.log("🔍 ChatList 오류:", error);
        }
      };

      // 기존 메시지 불러오기 실행
      loadExistingMessages();

      // 기존 방에 대한 구독 (중복 구독 방지)
      const subscribeSuccess = subscribeToRoomRef.current(existingRoomId, (receivedMessage) => {
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

          // 발신자 이름 정보 해결
          const senderName = resolveSenderName(receivedMessage.user_id, receivedMessage.sender_name);

          // 새 메시지 추가
          addMessage({
            id: `server_${Date.now()}_${Math.random()}`,
            text: receivedMessage.message,
            sender: {
              id: receivedMessage.user_id,
              name: senderName
            },
            timestamp: receivedMessage.timestamp || new Date().toISOString(),
            messageindex: receivedMessage.messageindex || null,
            isLocal: false
          });
        }
      });

      if (subscribeSuccess) {
        console.log("🔍 기존 방 구독 성공");
      } else {
        console.log("🔍 기존 방 구독 실패");
      }
    } else {
      console.log("🔍 새로운 방 생성");
      
      // 새로운 방 생성 시 - 기존 구독들 모두 해제
      if (roomId) {
        unsubscribeFromRoomRef.current(roomId);
      }
    }
  }, [open, roomDataWithoutRefresh?.id, roomDataWithoutRefresh?.adminData?.userIndex, roomDataWithoutRefresh?.isExistingRoom, roomDataWithoutRefresh?.isExisting]);

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      if (roomId) {
        unsubscribeFromRoomRef.current(roomId);
      }
    };
  }, [roomId]);

  // ===============================메세지 보내기=======================================
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
      const generateRoomName = (participants) => {
        if (participants.length === 2) {
          // 1:1 채팅 - adminData에서 이름 사용
          if (roomDataWithoutRefresh.adminData) {
            return `${roomDataWithoutRefresh.adminData.name}님과의 채팅`;
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
        const currentRoomIndex = roomId || roomDataWithoutRefresh.id;
        const hasValidRoomIndex = currentRoomIndex && currentRoomIndex !== 'undefined' && currentRoomIndex !== 'null' && currentRoomIndex !== 0;

        if (hasValidRoomIndex) {
          // 기존 방인 경우

          const messageData = {
            room_index: currentRoomIndex,
            room_name: roomDataWithoutRefresh.name,
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
            messageindex: null, // 로컬 메시지는 아직 서버에 저장되지 않음
            isLocal: true
          });

        } else {
          // 새로운 방인 경우 (첫 메시지로 방 생성)

          const messageData = {
            room_index: null,
            room_name: generateRoomName([roomDataWithoutRefresh.adminData.userId, userInfo.id]),
            user_id: userInfo.id,
            message: newMessage,
            participants: [roomDataWithoutRefresh.adminData.userId, userInfo.id],
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
            messageindex: null, // 로컬 메시지는 아직 서버에 저장되지 않음
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
        // 에러 발생 시에도 로컬 메시지는 추가
        addMessage({
          text: newMessage,
          sender: { id: userInfo.id, name: userInfo.name },
          timestamp: new Date().toISOString(),
          messageindex: null, // 에러 메시지는 인덱스 없음
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

  // 더보기 메뉴 핸들러들
  const handleMoreOptionsClick = (event) => {
    event.stopPropagation(); // 이벤트 전파 방지
    // 토글 기능: 이미 열려있으면 닫고, 닫혀있으면 열기
    if (moreOptionsAnchor) {
      setMoreOptionsAnchor(null);
    } else {
      setMoreOptionsAnchor(event.currentTarget);
    }
  };

  const handleMoreOptionsClose = () => {
    setMoreOptionsAnchor(null);
  };

  const handleMoreOptionsItemClick = async (optionId) => {
    handleMoreOptionsClose();

    switch (optionId) {
      case 'addUser':
        // 사용자 추가 기능 구현
        break;
      case 'leaveRoom':
        // 채팅방 나가기 기능 구현
        try {
          // 현재 사용자 ID 가져오기 (localStorage에서)
          const userInfo = JSON.parse(localStorage.getItem('user-info'));
          const userId = userInfo?.id;

          if (!userId) {
            return;
          }

          // 백엔드 API 호출
          if (window.confirm('채팅방을 나가시겠습니까?')) {
            try {
              const response = await LeaveRoom(roomId, userId);

              // 응답 코드가 200이거나 성공적인 경우
              if (response.status === 200 || response.data?.resultCode === 200) {
                // 메뉴 닫기
                setMoreOptionsAnchor(null);

                // 채팅방 목록 새로고침 (강제로 실행)
                if (refreshChatRooms) {
                  await refreshChatRooms();
                }

                // 채팅방 목록으로 돌아가기
                onBack();
              } else {
                alert('채팅방 나가기에 실패했습니다.');
              }
            } catch (error) {
              alert('채팅방 나가기 중 오류가 발생했습니다.');
            }
          } else {
            return;
          }
        } catch (error) {
        }
        break;
      default:
        break;
    }
  };

  // 메뉴 닫기 핸들러
  const handleMenuClose = (event, reason) => {
    // 모든 경우에 메뉴 닫기 (clickaway, escape, backdropClick 등)
    setMoreOptionsAnchor(null);
  };

  // 더보기 옵션 리스트 수정 함수들
  const addMoreOption = (newOption) => {
    setMoreOptionsList(prev => [...prev, newOption]);
  };

  const removeMoreOption = (optionId) => {
    setMoreOptionsList(prev => prev.filter(option => option.id !== optionId));
  };

  const updateMoreOption = (optionId, updatedOption) => {
    setMoreOptionsList(prev => prev.map(option =>
      option.id === optionId ? { ...option, ...updatedOption } : option
    ));
  };

  if (!open || !roomDataWithoutRefresh) return null;

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
              {roomDataWithoutRefresh.adminData ? roomDataWithoutRefresh.adminData.name : (roomDataWithoutRefresh.name || '채팅방')}
            </Typography>
          </Box>
        </Box>

        <Box className="no-drag" sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={handleMoreOptionsClick}
            data-more-options="button"
            sx={{
              color: moreOptionsAnchor ? 'rgba(255, 255, 255, 0.8)' : 'white',
              mr: 0.5,
              backgroundColor: moreOptionsAnchor ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <MoreVert />
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
            onClick={handleClose}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>

      {!isMinimized && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', overflow: 'hidden', minHeight: 0 }}>
          {/* 메시지 목록 */}
          <Box
            ref={messagesContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 1,
              backgroundColor: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              maxHeight: 'calc(100vh - 200px)',
              // 반응형 메시지 목록
              '@media (max-width: 768px)': {
                p: 0.5,
                maxHeight: 'calc(100vh - 180px)',
              },
              '@media (max-width: 480px)': {
                p: 0.25,
                maxHeight: 'calc(100vh - 160px)',
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
              minHeight: '40px',
              maxHeight: '80px',
              flexShrink: 0,
              overflow: 'hidden',
              // 반응형 입력 영역
              '@media (max-width: 768px)': {
                p: 0.25,
                gap: 0.5,
                minHeight: '35px',
                maxHeight: '70px',
              },
              '@media (max-width: 480px)': {
                p: 0.125,
                gap: 0.25,
                minHeight: '32px',
                maxHeight: '60px',
              }
            }}
          >
            <TextField
              ref={inputRef}
              fullWidth
              size="small"
              multiline
              maxRows={5}
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              inputProps={{
                style: {
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                  overflowX: 'auto'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  minHeight: '32px',
                  maxHeight: '80px',
                  overflow: 'hidden',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(33, 150, 243)'
                  }
                },
                '& .MuiInputBase-input': {
                  padding: '2px 6px',
                  lineHeight: '1.2',
                  minHeight: '16px',
                  maxHeight: '60px',
                  overflow: 'auto',
                  resize: 'none',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                  '&::-webkit-scrollbar': {
                    width: '4px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '2px'
                  }
                },
                // 반응형 입력 필드
                '@media (max-width: 768px)': {
                  fontSize: '0.9rem',
                  '& .MuiOutlinedInput-root': {
                    minHeight: '28px',
                    maxHeight: '70px'
                  },
                  '& .MuiInputBase-input': {
                    padding: '1px 5px',
                    minHeight: '14px',
                    maxHeight: '50px',
                    whiteSpace: 'nowrap',
                    wordBreak: 'keep-all'
                  }
                },
                '@media (max-width: 480px)': {
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-root': {
                    minHeight: '24px',
                    maxHeight: '60px'
                  },
                  '& .MuiInputBase-input': {
                    padding: '0px 4px',
                    minHeight: '12px',
                    maxHeight: '40px',
                    whiteSpace: 'nowrap',
                    wordBreak: 'keep-all'
                  }
                }
              }}
            />
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
                  color: '#666666',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 102, 102, 0.1)'
                  }
                }}
              >
                <AttachFile />
              </IconButton>
            </label>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              sx={{
                minWidth: 'auto',
                px: 2,
                borderRadius: 2,
                background: 'rgb(33, 150, 243)',
                flexShrink: 0
              }}
            >
              <Send />
            </Button>
          </Box>
        </Box>
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

      {/* 더보기 메뉴 */}
      <Menu
        anchorEl={moreOptionsAnchor}
        open={Boolean(moreOptionsAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        disableScrollLock={false}
        keepMounted={false}
        data-more-options="menu"
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
            zIndex: 1500,
          },
          zIndex: 1500,
        }}
      >
        {moreOptionsList.map((option) => (
          <MenuItem
            key={option.id}
            onClick={() => handleMoreOptionsItemClick(option.id)}
            sx={{
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {option.icon === 'PersonAdd' && <PersonAdd fontSize="small" />}
              {option.icon === 'ExitToApp' && <ExitToApp fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}

export default ChatRoomWindow; 