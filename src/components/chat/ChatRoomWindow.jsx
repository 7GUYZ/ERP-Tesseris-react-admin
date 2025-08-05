import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, Avatar,
  List, ListItem, ListItemText, ListItemAvatar, Divider,
  Chip, Badge, Menu, MenuItem, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Checkbox,
  CircularProgress, Tooltip, Popover, ListItemIcon
} from '@mui/material';
import {
  Send, AttachFile, Close, Minimize, DragIndicator,
  MoreVert, ArrowBack, PersonAdd, Settings, Delete,
  ExpandMore, ChevronRight, Person, ArrowUpward,
  ExitToApp
} from '@mui/icons-material';
import { ChatList, LeaveRoom, UserInvitation, DeleteMessage, UploadFiles } from '../../api/auth/JihunAuth';
import { useToast } from '../../context/jungeun/ToastContext';
import { useChatWebSocket } from '../../context/ChatWebSocketContext';
import { generateRoomName } from '../../utils/roomNameUtils';


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
  const { showToast } = useToast();
  // roomData에서 refreshChatRooms 함수 추출
  const { refreshChatRooms, ...roomDataWithoutRefresh } = roomData || {};
  const [roomId, setRoomId] = useState(null);  // 생성된 방 ID 저장
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [position, setPosition] = useState(currentPosition || {
    x: Math.max(0, window.innerWidth - Math.min(450, window.innerWidth * 0.9)),
    y: Math.max(0, window.innerHeight * 0.1)
  });
  const { sendMessage, subscribeToRoom, unsubscribeFromRoom, isConnected, deleteMessage, stompClient, connectWebSocket } = useChatWebSocket();
  
  // stompClient 상태를 직접 추적 (useRef로 최신 상태 참조)
  const [localStompClient, setLocalStompClient] = useState(null);
  const localStompClientRef = useRef(null);
  
  // stompClient 상태 동기화
  useEffect(() => {
    if (stompClient) {
      setLocalStompClient(stompClient);
      localStompClientRef.current = stompClient;
      console.log('🔄 localStompClient 업데이트:', !!stompClient, stompClient?.connected);
    }
  }, [stompClient]);

  // roomId 추출 유틸리티 함수 (강화된 버전)
  const extractNumericRoomId = useCallback((roomIdValue) => {
    if (!roomIdValue) return null;

    let extracted = roomIdValue;

    // 1. JSON 문자열인 경우 파싱
    if (typeof extracted === 'string' && extracted.includes('{') && extracted.includes('}')) {
      try {
        const parsed = JSON.parse(extracted);
        // 우선순위: room_index > id > roomId > roomid
        extracted = parsed.room_index || parsed.id || parsed.roomId || parsed.roomid;
        console.log('🔍 JSON 파싱 결과:', { original: roomIdValue, parsed, extracted });
      } catch (e) {
        console.warn('⚠️ JSON 파싱 실패:', extracted, e);
      }
    }

    // 2. 객체인 경우 필드 추출
    if (typeof extracted === 'object' && extracted !== null) {
      extracted = extracted.room_index || extracted.id || extracted.roomId || extracted.roomid;
    }

    // 3. 'admin' 특별 처리
    if (String(extracted).toLowerCase() === 'admin') {
      return 'admin';
    }
    
    // 4. 숫자만 추출
    const numericOnly = String(extracted || '').replace(/[^0-9]/g, '');
    console.log('🔍 최종 추출 결과:', { original: roomIdValue, extracted, numericOnly });
    
    return numericOnly || null;
  }, []);
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

  // 초대하기 관련 상태
  const [showInviteSelection, setShowInviteSelection] = useState(false);
  const [selectedInviteAdmins, setSelectedInviteAdmins] = useState(new Set());
  const [expandedInviteGroups, setExpandedInviteGroups] = useState(new Set());

  // 파일 업로드 관련 상태
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 메시지 삭제 관련 상태
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null); // 무한스크롤용 상단 ref
  const messagesContainerRef = useRef(null); // 메시지 컨테이너 ref
  const inputRef = useRef(null);
  const messagesRef = useRef([]); // 메시지 목록을 ref로 관리
  const subscribeToRoomRef = useRef(subscribeToRoom);
  const unsubscribeFromRoomRef = useRef(unsubscribeFromRoom);
  const sendMessageRef = useRef(sendMessage);
  const deleteMessageRef = useRef(deleteMessage);
  const addMessageRef = useRef(null);
  const adminListRef = useRef(adminList); // adminList를 ref로 관리

  // 함수 참조 업데이트
  useEffect(() => {
    sendMessageRef.current = sendMessage;
    subscribeToRoomRef.current = subscribeToRoom;
    unsubscribeFromRoomRef.current = unsubscribeFromRoom;
    deleteMessageRef.current = deleteMessage;
  }, [sendMessage, subscribeToRoom, unsubscribeFromRoom, deleteMessage]);

  // 발신자 이름 해결 함수
  const resolveSenderName = useCallback((userId, senderName) => {
    if (senderName) return senderName;

    const admin = adminListRef.current.find(admin => admin.userId === userId);
    return admin ? admin.name : userId;
  }, []);

  // 인덱스 기반 비교 함수
  const compareIndex = useCallback((indexA, indexB) => {
    // messageindex가 없는 경우 타임스탬프로 대체
    if (!indexA && !indexB) {
      return 0;
    }
    if (!indexA) return 1;
    if (!indexB) return -1;

    // 문자열이나 숫자 모두 처리
    const strA = String(indexA);
    const strB = String(indexB);
    
    // 숫자로 변환하여 비교
    const numA = parseInt(strA) || 0;
    const numB = parseInt(strB) || 0;
    
    return numA - numB; // 오름차순 정렬 (낮은 인덱스가 먼저)
  }, []);

  // 메시지 중복 체크 함수
  const isDuplicateMessage = useCallback((newMessage, existingMessages) => {
    return existingMessages.some(existing => {
      // ID가 같으면 중복
      if (existing.id === newMessage.id) return true;

      // messageindex가 있고 같으면 중복 (서버에서 온 메시지)
      if (existing.messageindex && newMessage.messageindex && 
          existing.messageindex === newMessage.messageindex) {
        return true;
      }

      // 로컬 메시지와 서버 메시지의 중복 체크 (임시 messageindex 사용)
      if (existing.messageindex && newMessage.messageindex && 
          existing.messageindex === newMessage.messageindex &&
          existing.isLocal !== newMessage.isLocal) {
        console.log('🔄 로컬/서버 메시지 중복 감지 - 교체 예정');
        return false; // 교체를 위해 중복으로 처리하지 않음
      }

      // 같은 내용, 같은 발신자, 같은 시간대면 중복 (1초 이내)
      if (existing.text === newMessage.text &&
        existing.sender?.id === newMessage.sender?.id &&
        Math.abs(new Date(existing.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000) {
        console.log('🔍 중복 메시지 감지:', {
          existing: { text: existing.text, sender: existing.sender?.id, timestamp: existing.timestamp, isLocal: existing.isLocal },
          new: { text: newMessage.text, sender: newMessage.sender?.id, timestamp: newMessage.timestamp, isLocal: newMessage.isLocal }
        });
        return true;
      }

      return false;
    });
  }, []);

  // 메시지 정렬 함수 (messageindex 우선, 없으면 timestamp 사용)
  const sortMessages = useCallback((messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return messages;
    }

    return [...messages].sort((a, b) => {
      // 유효하지 않은 메시지 객체 처리
      if (!a || !b) {
        return 0;
      }

      // messageindex가 있으면 그것을 우선 사용
      if (a.messageindex && b.messageindex) {
        const result = compareIndex(a.messageindex, b.messageindex);
        if (result !== 0) return result;
      }

      // messageindex가 하나만 있는 경우, 있는 쪽이 뒤로 (서버 메시지가 우선)
      if (a.messageindex && !b.messageindex) return 1;
      if (!a.messageindex && b.messageindex) return -1;

      // messageindex가 둘 다 없는 경우 timestamp 사용
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // timestamp도 같은 경우 ID로 정렬 (안정성 보장)
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [compareIndex]);

  // 메시지 상태 업데이트 함수 (정렬 포함, 중복 제거)
  const updateMessages = useCallback((newMessages) => {
    // 중복 메시지 제거
    const uniqueMessages = newMessages.filter((message, index, self) => {
      return index === self.findIndex(m =>
        m.id === message.id ||
        (m.text === message.text &&
          m.sender?.id === message.sender?.id &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
      );
    });

    const sortedMessages = sortMessages(uniqueMessages);
    setMessages(sortedMessages);
    messagesRef.current = sortedMessages;
    return sortedMessages;
  }, [sortMessages]);

  // 메시지 추가 함수 (정렬 포함, 중복 체크)
  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      console.log('📝 메시지 추가 시도:', {
        newMessage: { text: newMessage.text, sender: newMessage.sender?.id, timestamp: newMessage.timestamp },
        existingCount: prev.length
      });
      
      // 중복 메시지 체크
      if (isDuplicateMessage(newMessage, prev)) {
        console.log('❌ 중복 메시지로 인해 추가 취소');
        return prev;
      }

      console.log('✅ 새 메시지 추가됨');
      // 새 메시지를 올바른 위치에 삽입 (timestamp 기준 정렬)
      const updatedMessages = [...prev];
      
      // 새 메시지의 timestamp
      const newMessageTime = new Date(newMessage.timestamp).getTime();
      
      // 올바른 삽입 위치 찾기 (timestamp 기준 오름차순)
      let insertIndex = updatedMessages.length;
      for (let i = 0; i < updatedMessages.length; i++) {
        const currentTime = new Date(updatedMessages[i].timestamp).getTime();
        if (newMessageTime < currentTime) {
          insertIndex = i;
          break;
        }
      }
      
      // 해당 위치에 메시지 삽입
      updatedMessages.splice(insertIndex, 0, newMessage);
      
      console.log('📊 메시지 삽입 위치:', {
        insertIndex,
        newMessageTime,
        totalMessages: updatedMessages.length
      });
      
      messagesRef.current = updatedMessages;
      
      // 메시지 추가 후 자동 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return updatedMessages;
    });
  }, [isDuplicateMessage]);

  // 수신된 메시지 처리 함수
  const handleIncomingMessage = useCallback((receivedMessage) => {
    console.log('🚀 handleIncomingMessage 함수 시작');
    const userInfo = JSON.parse(localStorage.getItem('admin-info'));

    console.log('📨 수신된 메시지 전체:', receivedMessage);
    console.log('📁 파일 정보 확인:', {
      hasFiles: !!receivedMessage.files,
      filesType: typeof receivedMessage.files,
      filesLength: receivedMessage.files ? receivedMessage.files.length : 0,
      filesContent: receivedMessage.files,
      filesKeys: receivedMessage.files ? Object.keys(receivedMessage.files[0] || {}) : [],
      messageKeys: Object.keys(receivedMessage)
    });
    console.log('🔍 사용자 정보:', { 
      userInfoId: userInfo.id, 
      userInfoIdType: typeof userInfo.id,
      receivedUserId: receivedMessage.user_id,
      receivedUserIdType: typeof receivedMessage.user_id
    });

    // 새 방 생성 응답 처리 (보낸 사람만 구독 변경)
    console.log('🔍 새 방 생성 응답 조건 확인:', {
      messageType: receivedMessage.type,
      messageTypeField: receivedMessage.message_type,
      hasRoomIndex: !!receivedMessage.room_index,
      roomIndexValue: receivedMessage.room_index,
      currentRoomId: roomId,
      isMyMessage: receivedMessage.user_id === userInfo.id,
      conditionResult: (receivedMessage.type === 'chat' || receivedMessage.message_type === 'chat') && 
                      receivedMessage.room_index && 
                      !roomId && 
                      receivedMessage.user_id === userInfo.id // 내가 보낸 메시지인 경우만
    });
    
    // 보낸 사람만 구독 변경 (받는 사람은 이미 room_index로 구독 중)
    if ((receivedMessage.type === 'chat' || receivedMessage.message_type === 'chat') && 
        receivedMessage.room_index && 
        !roomId && 
        receivedMessage.user_id === userInfo.id) { // 내가 보낸 메시지인 경우만
      console.log('🆕 새 방 생성 응답 감지:', receivedMessage.room_index);
      console.log('📋 전체 응답 구조:', JSON.stringify(receivedMessage, null, 2));
      console.log('🔍 응답 타입:', typeof receivedMessage.room_index);
      console.log('🔍 room_index 값:', receivedMessage.room_index);
      
      // room_index를 안전하게 추출
      let extractedRoomIndex = receivedMessage.room_index;
      
      // 객체나 JSON 형태인 경우 처리
      if (typeof extractedRoomIndex === 'object') {
        console.log('📦 room_index가 객체입니다:', extractedRoomIndex);
        extractedRoomIndex = extractedRoomIndex.room_index || extractedRoomIndex.id || extractedRoomIndex.roomId;
        console.log('📦 추출된 room_index:', extractedRoomIndex);
      }
      
      // 문자열로 변환
      extractedRoomIndex = String(extractedRoomIndex || '');
      console.log('📝 최종 room_index:', extractedRoomIndex);
      
      if (!extractedRoomIndex || extractedRoomIndex === 'null' || extractedRoomIndex === 'undefined') {
        console.error('❌ 유효하지 않은 room_index:', receivedMessage.room_index);
        return;
      }
      
      setRoomId(extractedRoomIndex);
      
      // 새 방 생성 시 구독을 room_index로 변경
      console.log('🔄 구독 상태 변화 시작: admin → room_index로 변경');
      console.log('📊 현재 구독 상태: admin에서 room_index로 전환 중');
      
      // 기존 "admin" 구독 해제
      console.log('🔌 기존 admin 구독 해제 시도');
      unsubscribeFromRoom("admin");
      console.log('✅ admin 구독 해제 완료');
      
      // WebSocket 연결 상태 확인 및 재연결
      if (!isConnected || !localStompClient || !localStompClient.connected) {
        console.log('🔌 WebSocket 연결 상태 확인:', { 
          isConnected, 
          hasStompClient: !!stompClient, 
          hasLocalStompClient: !!localStompClient,
          stompConnected: stompClient?.connected,
          localStompConnected: localStompClient?.connected
        });
        console.log('🔄 WebSocket 재연결 시도');
        const userInfo = JSON.parse(localStorage.getItem('admin-info'));
        if (userInfo) {
          connectWebSocket(userInfo);
          // 간단하고 확실한 방법: 직접 구독 시도
          console.log('🔄 간단한 구독 시도 방법으로 변경');
          
          // 0.5초 후에 직접 구독 시도 (빠른 구독 변환)
          setTimeout(() => {
            console.log('📡 직접 구독 시도:', extractedRoomIndex);
            console.log('🔍 구독 시도 전 상태 확인:', {
              hasStompClient: !!stompClient,
              stompConnected: stompClient?.connected,
              hasLocalStompClient: !!localStompClient,
              localStompConnected: localStompClient?.connected,
              hasLocalStompClientRef: !!localStompClientRef.current,
              localStompClientRefConnected: localStompClientRef.current?.connected
            });
            
            const directSubscribeSuccess = subscribeToRoom(extractedRoomIndex, (newRoomMessage) => {
              console.log('📨 새 방 메시지 수신:', newRoomMessage);
              // 무한 재귀 방지: 이미 처리된 메시지는 다시 처리하지 않음
              if ((newRoomMessage.type === 'chat' || newRoomMessage.message_type === 'chat') && 
                  newRoomMessage.room_index && 
                  !roomId && 
                  newRoomMessage.user_id === userInfo.id) {
                console.log('⚠️ 이미 처리된 새 방 생성 응답이므로 무시');
                return;
              }
              handleIncomingMessage(newRoomMessage);
            });
            
            if (directSubscribeSuccess) {
              console.log('✅ 직접 구독 성공:', extractedRoomIndex);
              console.log('🔄 구독 상태 변화 완료: admin → room_index로 변경됨');
              console.log('📊 최종 구독 상태: room_index', extractedRoomIndex, '로 구독 중');
            } else {
              console.error('❌ 직접 구독 실패:', extractedRoomIndex);
              console.log('⚠️ 구독 상태 변화 실패: admin에서 room_index로 변경 실패');
              
              // 실패 시 한 번 더 시도
              setTimeout(() => {
                console.log('🔄 재시도 구독 시도:', extractedRoomIndex);
                const retrySubscribeSuccess = subscribeToRoom(extractedRoomIndex, (newRoomMessage) => {
                  console.log('📨 새 방 메시지 수신:', newRoomMessage);
                  if ((newRoomMessage.type === 'chat' || newRoomMessage.message_type === 'chat') && 
                      newRoomMessage.room_index && 
                      !roomId && 
                      newRoomMessage.user_id === userInfo.id) {
                    console.log('⚠️ 이미 처리된 새 방 생성 응답이므로 무시');
                    return;
                  }
                  handleIncomingMessage(newRoomMessage);
                });
                
                if (retrySubscribeSuccess) {
                  console.log('✅ 재시도 구독 성공:', extractedRoomIndex);
                  console.log('🔄 구독 상태 변화 완료: admin → room_index로 변경됨');
                  console.log('📊 최종 구독 상태: room_index', extractedRoomIndex, '로 구독 중');
                } else {
                  console.error('❌ 재시도 구독도 실패:', extractedRoomIndex);
                }
              }, 500); // 0.5초 대기
            }
          }, 500); // 0.5초 대기
          return;
        }
      }
      
      // 새로운 room_index로 구독
      console.log('📡 새로운 room_index로 구독 시도:', extractedRoomIndex);
      const subscribeSuccess = subscribeToRoom(extractedRoomIndex, (newRoomMessage) => {
        console.log('📨 새 방 메시지 수신:', newRoomMessage);
        // 무한 재귀 방지: 이미 처리된 메시지는 다시 처리하지 않음
        if ((newRoomMessage.type === 'chat' || newRoomMessage.message_type === 'chat') && 
            newRoomMessage.room_index && 
            !roomId && 
            newRoomMessage.user_id === userInfo.id) {
          console.log('⚠️ 이미 처리된 새 방 생성 응답이므로 무시');
          return;
        }
        handleIncomingMessage(newRoomMessage);
      });
      
      if (subscribeSuccess) {
        console.log('✅ 새 방 구독 성공:', extractedRoomIndex);
        console.log('🔄 구독 상태 변화 완료: admin → room_index로 변경됨');
        console.log('📊 최종 구독 상태: room_index', extractedRoomIndex, '로 구독 중');
      } else {
        console.error('❌ 새 방 구독 실패:', extractedRoomIndex);
        console.log('⚠️ 구독 상태 변화 실패: admin에서 room_index로 변경 실패');
      }
      
      console.log('✅ 새 방 room_index 저장 및 구독 변경 완료:', extractedRoomIndex);
    } else {
      console.log('⚠️ 새 방 생성 응답 조건 불일치 - 구독 변경 건너뜀');
    }

    // 메시지 삭제 이벤트 처리
    if (receivedMessage.type === 'DELETE_MESSAGE') {
      const messageIndex = receivedMessage.messageIndex;
      console.log('삭제 이벤트 수신:', { messageIndex, receivedMessage });
      
      setMessages(prev => prev.map(msg => 
        msg.messageindex === messageIndex 
          ? { ...msg, active: false }
          : msg
      ));
      return;
    }

    // 메시지 삭제 에러 이벤트 처리
    if (receivedMessage.type === 'DELETE_MESSAGE_ERROR') {
      console.error('삭제 에러 이벤트 수신:', receivedMessage);
      showToast("error", `메시지 삭제 실패: ${receivedMessage.error || '알 수 없는 오류'}`);
      return;
    }

    // 시스템 메시지 처리 (입퇴장 알림)
    if (receivedMessage.type === 'system') {
      console.log('📢 시스템 메시지 수신:', receivedMessage);
      const systemMessage = {
        id: `system_${Date.now()}_${Math.random()}`,
        text: receivedMessage.message,
        type: 'system',
        timestamp: receivedMessage.timestamp || new Date().toISOString(),
        sender: {
          id: receivedMessage.userId || 'system',
          name: 'System'
        },
        active: true, // 시스템 메시지는 항상 active
        isLocal: false
      };
      console.log('📢 시스템 메시지 추가:', systemMessage);
      addMessage(systemMessage);
      return;
    }



    // 내가 보낸 메시지인 경우 로컬 메시지를 서버 메시지로 교체
    // user_id 비교를 문자열로 통일
    const isMyMessage = String(receivedMessage.user_id) === String(userInfo.id);
    console.log('🔍 내 메시지 여부 확인:', { 
      isMyMessage, 
      receivedUserId: receivedMessage.user_id, 
      userInfoId: userInfo.id 
    });

    // 내가 보낸 메시지인 경우 로컬 메시지를 서버 메시지로 교체
    if (isMyMessage) {
      console.log('🔄 내 메시지 서버 응답 - 로컬 메시지 교체');
      
      // 임시 messageindex로 로컬 메시지 찾기
      const tempMessageIndex = receivedMessage.tempMessageIndex;
      if (tempMessageIndex) {
        setMessages(prev => prev.map(msg => {
          if (msg.messageindex === tempMessageIndex && msg.isLocal) {
            console.log('✅ 로컬 메시지를 서버 메시지로 교체:', msg.id);
            return {
              ...msg,
              id: `server_${Date.now()}_${Math.random()}`,
              messageindex: receivedMessage.messageindex || null,
              isLocal: false,
              files: receivedMessage.files && Array.isArray(receivedMessage.files) ? receivedMessage.files : null
            };
          }
          return msg;
        }));
      } else {
        // 임시 messageindex가 없으면 새로 추가
        const senderName = resolveSenderName(receivedMessage.user_id, receivedMessage.sender_name);
        const newServerMessage = {
          id: `server_${Date.now()}_${Math.random()}`,
          text: receivedMessage.message,
          sender: {
            id: receivedMessage.user_id,
            name: senderName
          },
          timestamp: receivedMessage.timestamp || new Date().toISOString(),
          messageindex: receivedMessage.messageindex || null,
          active: receivedMessage.active !== undefined ? receivedMessage.active : true,
          isLocal: false,
          files: receivedMessage.files || null
        };
        console.log('📨 새 서버 메시지 추가:', newServerMessage);
        addMessage(newServerMessage);
      }
    } else {
      // 다른 사용자의 메시지인 경우 새로 추가
      const senderName = resolveSenderName(receivedMessage.user_id, receivedMessage.sender_name);
      const newServerMessage = {
        id: `server_${Date.now()}_${Math.random()}`,
        text: receivedMessage.message,
        sender: {
          id: receivedMessage.user_id,
          name: senderName
        },
        timestamp: receivedMessage.timestamp || new Date().toISOString(),
        messageindex: receivedMessage.messageindex || null,
        active: receivedMessage.active !== undefined ? receivedMessage.active : true,
        isLocal: false,
        files: receivedMessage.files && Array.isArray(receivedMessage.files) ? receivedMessage.files : null
      };
      console.log('📨 다른 사용자 메시지 추가:', newServerMessage);
      addMessage(newServerMessage);
    }
  }, [resolveSenderName, addMessage, showToast]);

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

  // 방 입장 시 join 메시지 전송 함수 제거 (유령 메시지 방지)
  // const sendJoinMessage = () => {
  //   if (stompClient && stompClient.connected && roomId) {
  //     const userInfo = JSON.parse(localStorage.getItem('admin-info'));
  //     if (userInfo) {
  //       // room_index를 안전하게 추출
  //       let roomIndex = roomId;
  //       
  //       // room_index가 객체인 경우 처리
  //       if (roomIndex && typeof roomIndex === 'object') {
  //         roomIndex = roomIndex.room_index || roomIndex.id || roomIndex.roomId;
  //       }
  //       
  //       // 문자열로 변환하고 숫자만 추출
  //       roomIndex = String(roomIndex || '').replace(/[^0-9]/g, '');
  //       
  //       if (!roomIndex) {
  //         console.error('❌ 유효하지 않은 room_index:', roomId);
  //         return;
  //       }
  //       
  //       // 기존 방 입장 시에는 입장 알림 없이 조용히 입장
  //       stompClient.publish({
  //         destination: `/app/adminchat.joinRoom/${roomIndex}`,
  //         body: JSON.stringify({
  //           type: 'JOIN',
  //           user_id: userInfo.id,
  //           room_index: roomIndex,
  //           timestamp: new Date().toISOString()
  //         })
  //       });
  //       console.log('🚪 채팅방 조용히 입장 (알림 없음):', roomIndex);
  //     }
  //   }
  // };

  // 명시적 입장 알림 전송 (초대된 사용자가 방에 입장할 때)
  const sendEnterMessage = () => {
    if (stompClient && stompClient.connected && roomId) {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      if (userInfo) {
        // room_index를 안전하게 추출
        let roomIndex = roomId;
        
        // room_index가 객체인 경우 처리
        if (roomIndex && typeof roomIndex === 'object') {
          roomIndex = roomIndex.room_index || roomIndex.id || roomIndex.roomId;
        }
        
        // 문자열로 변환하고 숫자만 추출
        roomIndex = String(roomIndex || '').replace(/[^0-9]/g, '');
        
        if (!roomIndex) {
          console.error('❌ 유효하지 않은 room_index:', roomId);
          return;
        }
        
        // 명시적 입장 알림 전송
        stompClient.publish({
          destination: `/app/adminchat.enterRoom/${roomIndex}`,
          body: JSON.stringify({
            type: 'ENTER',
            user_id: userInfo.id,
            room_index: roomIndex,
            timestamp: new Date().toISOString()
          })
        });
        console.log('🚪 채팅방 명시적 입장 알림 전송:', roomIndex);
      }
    }
  };

  // 명시적 퇴장 알림 전송 (사용자가 방에서 나가기 요청할 때)
  const sendLeaveMessage = () => {
    if (stompClient && stompClient.connected && roomId) {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      if (userInfo) {
        // room_index를 안전하게 추출
        let roomIndex = roomId;
        
        // room_index가 객체인 경우 처리
        if (roomIndex && typeof roomIndex === 'object') {
          roomIndex = roomIndex.room_index || roomIndex.id || roomIndex.roomId;
        }
        
        // 문자열로 변환하고 숫자만 추출
        roomIndex = String(roomIndex || '').replace(/[^0-9]/g, '');
        
        if (!roomIndex) {
          console.error('❌ 유효하지 않은 room_index:', roomId);
          return;
        }
        
        // 명시적 퇴장 알림 전송
        stompClient.publish({
          destination: `/app/adminchat.leaveRoom/${roomIndex}`,
          body: JSON.stringify({
            type: 'LEAVE',
            user_id: userInfo.id,
            room_index: roomIndex,
            timestamp: new Date().toISOString()
          })
        });
        console.log('🚪 채팅방 명시적 퇴장 알림 전송:', roomIndex);
      }
    }
  };

  // 채팅방이 열릴 때 join 메시지 전송 제거 (유령 메시지 방지)
  // useEffect(() => {
  //   if (open && roomDataWithoutRefresh && roomDataWithoutRefresh.room_index && sendMessageRef.current) {
  //     const userInfo = JSON.parse(localStorage.getItem('admin-info'));
  //     if (userInfo) {
  //       // 연결 대기 후 전송
  //       setTimeout(sendJoinMessage, 1000);
  //     }
  //   }
  // }, [open, roomDataWithoutRefresh]);

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
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
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
        const formattedPreviousMessages = previousMessages.map(msg => {
            const userId = msg.userid || msg.user_id;
            const adminName = adminMap.get(userId);

          const formattedMessage = {
              id: `previous_${msg.messageindex || msg.messageid || msg.id || Date.now()}_${Math.random()}`,
              text: msg.message,
              sender: {
                id: userId,
                name: adminName || userId
              },
              timestamp: msg.sentat || msg.timestamp || new Date().toISOString(),
              messageindex: msg.messageindex || null,
              isLocal: false,
              files: msg.files || null
            };
          
          console.log('📝 이전 메시지 파일 정보:', {
            messageIndex: msg.messageindex,
            hasFiles: !!msg.files,
            filesCount: msg.files ? msg.files.length : 0,
            files: msg.files
          });
          
          return formattedMessage;
          });

        // 현재 스크롤 위치 저장
        const messagesContainer = messagesContainerRef.current;
        const scrollHeight = messagesContainer?.scrollHeight || 0;
        const scrollTop = messagesContainer?.scrollTop || 0;

        // 이전 메시지를 기존 메시지 앞에 추가 (정렬하지 않음)
        setMessages(prev => {
          const allMessages = [...formattedPreviousMessages, ...prev];
          messagesRef.current = allMessages;
          return allMessages;
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

    // 중첩된 구조에서 id 필드에 안전하게 접근
    const hasRoomIndex = roomDataWithoutRefresh.id || roomDataWithoutRefresh.roomData?.id || roomDataWithoutRefresh.room_index || roomDataWithoutRefresh.roomindex;
    
    // roomId를 문자열로 추출 (객체인 경우 처리)
    let existingRoomId = roomDataWithoutRefresh.id || roomDataWithoutRefresh.roomData?.id;
    
    // roomId가 객체인 경우 room_index 필드 추출
    if (existingRoomId && typeof existingRoomId === 'object') {
      existingRoomId = existingRoomId.room_index || existingRoomId.id;
    }
    
    // 문자열로 변환
    existingRoomId = String(existingRoomId || '');
    // 기존 방인지 확인 - id나 room_index가 있으면 기존 방으로 판단
    const isExisting = roomDataWithoutRefresh.isExistingRoom ||
      roomDataWithoutRefresh.isExisting ||
      !!(roomDataWithoutRefresh.id || roomDataWithoutRefresh.roomData?.id || roomDataWithoutRefresh.roomData?.room_index);

    console.log('🔄 방 변경 감지:', { 
      currentRoomId: roomId, 
      newRoomId: existingRoomId, 
      isExisting, 
      roomData: roomDataWithoutRefresh 
    });

    // 이전 구독 해제 (roomId가 있고 새 방과 다른 경우)
    if (roomId && roomId !== existingRoomId) {
      console.log(`🔌 이전 방 구독 해제: ${roomId}`);
      unsubscribeFromRoom(roomId);
    }

    if (isExisting && existingRoomId) {
      // 기존 방 입장
      console.log(`🚪 기존 방 입장: ${existingRoomId}`);
      
      // roomId를 숫자로 추출하여 설정
      let numericRoomId = existingRoomId;
      if (typeof numericRoomId === 'object') {
        numericRoomId = numericRoomId.room_index || numericRoomId.id;
      }
      numericRoomId = String(numericRoomId || '').replace(/[^0-9]/g, '');
      
      if (numericRoomId) {
        setRoomId(numericRoomId);
        console.log(`✅ 숫자 roomId 설정: ${numericRoomId}`);
      } else {
        console.error('❌ 유효하지 않은 roomId:', existingRoomId);
        return;
      }

        // 페이지 상태 초기화
        setCurrentPage(0);
        setHasMoreMessages(true);
        setIsLoadingMore(false);

      const userInfo = JSON.parse(localStorage.getItem('admin-info'));

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

            // 참가자 정보 설정 (기존 방의 경우)
            if (chatData.participants) {
              setRoomParticipants(chatData.participants);
            } else if (chatData.roomParticipants) {
              setRoomParticipants(chatData.roomParticipants);
            } else {
              // 1:1 채팅방인 경우 상대방과 본인을 참가자로 설정
              const userInfo = JSON.parse(localStorage.getItem('admin-info'));
              const participants = [];
              
              // 본인 추가
              participants.push({ userId: userInfo.id, name: userInfo.name || userInfo.id });
              
              // 상대방 찾기 (adminData에서 본인이 아닌 사람)
              const otherUser = adminData.find(admin => admin.userId !== userInfo.id);
              if (otherUser) {
                participants.push({ userId: otherUser.userId, name: otherUser.name });
              }
              
              setRoomParticipants(participants);
            }

              // 관리자 정보를 Map으로 변환하여 빠른 검색 가능하게 함
              const adminMap = new Map();
              adminData.forEach(admin => {
                adminMap.set(admin.userId, admin.name);
              });

            // 기존 메시지를 올바른 형식으로 변환
            const formattedMessages = existingMessages.map(msg => {
                      const userId = msg.userid || msg.user_id;
                      const adminName = adminMap.get(userId);

              const formattedMessage = {
                        id: `existing_${msg.messageindex || msg.messageid || msg.id || Date.now()}_${Math.random()}`,
                        text: msg.message,
                        sender: {
                          id: userId,
                          name: adminName || userId // 관리자 이름이 있으면 사용, 없으면 ID 사용
                        },
                        timestamp: msg.sentat || msg.timestamp || new Date().toISOString(),
                        messageindex: msg.messageindex || null,
                        active: msg.active !== undefined ? msg.active : true, // active 상태 포함
                isLocal: false,
                files: msg.files || null
              };
              
              console.log('📝 기존 메시지 파일 정보:', {
                messageIndex: msg.messageindex,
                hasFiles: !!msg.files,
                filesCount: msg.files ? msg.files.length : 0,
                files: msg.files
              });
              
              return formattedMessage;
            });

            // 메시지를 올바른 순서로 정렬 (messageindex 기준 오름차순)
            const sortedMessages = formattedMessages.sort((a, b) => {
              const aIndex = a.messageindex || 0;
              const bIndex = b.messageindex || 0;
              return aIndex - bIndex; // 오름차순 정렬
            });

            console.log('📊 메시지 정렬 완료:', {
              beforeSort: formattedMessages.map(m => m.messageindex),
              afterSort: sortedMessages.map(m => m.messageindex)
            });

            setMessages(sortedMessages);
            console.log('✅ 기존 메시지 로드 완료:', formattedMessages.length);
            }
          } catch (error) {
          console.error('❌ 기존 메시지 로드 실패:', error);
          showToast('기존 메시지를 불러오는데 실패했습니다.', 'error');
          }
        };

        loadExistingMessages();

          // 기존 방인 경우 - 백엔드에서 방 입장 처리
          console.log('🔍 기존 방 입장 처리');
          
          // existingRoomId를 숫자로 추출 (최적화된 함수 사용)
          const numericExistingRoomId = extractNumericRoomId(existingRoomId);
          if (!numericExistingRoomId) {
            console.error('❌ 유효하지 않은 existingRoomId:', existingRoomId);
            return;
          }
          
          // 백엔드에 방 입장 요청 제거 (유령 메시지 방지)
          // if (userInfo && stompClient && stompClient.connected) {
          //   stompClient.publish({
          //     destination: `/app/adminchat.joinRoom/${numericExistingRoomId}`,
          //     body: JSON.stringify({
          //       type: 'JOIN',
          //       user_id: userInfo.id,
          //       timestamp: new Date().toISOString()
          //     })
          //   });
          //   console.log('🚪 기존 방 입장 요청 전송:', numericExistingRoomId);
          // }
          
          // 해당 방에 구독 설정 (백엔드 응답을 받기 위해)
          const subscribeSuccess = subscribeToRoom(numericExistingRoomId, (receivedMessage) => {
            console.log('📨 기존 방 응답 수신:', receivedMessage);
            
            // roomid를 안전하게 추출 (강화된 함수 사용)
            const extractedRoomId = extractNumericRoomId(
              receivedMessage.roomid || receivedMessage.room_index || receivedMessage.roomId || receivedMessage.roomld || receivedMessage.message
            );
            
            console.log('🔍 roomid 추출 결과:', {
              original: receivedMessage.roomid,
              extracted: extractedRoomId,
              messageKeys: Object.keys(receivedMessage || {})
            });
            
            // 입장 성공 응답 처리
            if (receivedMessage.type === 'join_success') {
              console.log('✅ 방 입장 성공');
              
              // 추출된 roomId로 방 ID 설정 (이미 숫자로 추출됨)
              if (extractedRoomId) {
                setRoomId(extractedRoomId);
                console.log(`✅ 방 ID 설정: ${extractedRoomId}`);
              } else {
                console.error('❌ roomId를 찾을 수 없음 (추출 실패)');
              }
              
              // 기존 메시지 로드
              if (receivedMessage.existingMessages && Array.isArray(receivedMessage.existingMessages)) {
                console.log('📚 기존 메시지 로드:', receivedMessage.existingMessages.length + '개');
                
                // 기존 메시지를 UI에 추가
                receivedMessage.existingMessages.forEach(msg => {
                  handleIncomingMessage(msg);
                });
              }
              
              // 입장 알림 메시지 처리
              if (receivedMessage.message) {
                const systemMessage = {
                  type: 'system',
                  message: receivedMessage.message,
                  timestamp: receivedMessage.timestamp
                };
                handleIncomingMessage(systemMessage);
              }
              } else if (receivedMessage.type === 'error') {
    console.error('❌ 방 입장 실패:', receivedMessage.message);
    
    // 오류 메시지에서 roomid 추출 시도 (이미 숫자로 추출됨)
    if (extractedRoomId) {
      setRoomId(extractedRoomId);
      console.log(`✅ 오류 응답에서 방 ID 설정: ${extractedRoomId}`);
      } else {
      // 오류가 발생해도 기본값으로 설정
      setRoomId("1");
      console.log(`✅ 오류 발생으로 기본 방 ID 설정: 1`);
    }
    
    // 오류 토스트 메시지 제거 (사용자 경험 개선)
    // showToast("error", receivedMessage.message);
  } else {
              // 일반 메시지 처리
              handleIncomingMessage(receivedMessage);
            }
          });
          
          console.log('🔍 기존 방 구독 결과:', subscribeSuccess);
          
        } else {
          // 새로운 방 생성 시 - 첫 메시지 전송 시 백엔드에서 방 생성
          console.log('🆕 새 방 생성 대기 중...');
          
                      // 새 방 생성 시 "admin"으로 구독하여 응답을 받음
            console.log('📡 admin으로 구독하여 새 방 생성 응답 대기');
            const adminSubscribeSuccess = subscribeToRoom("admin", (receivedMessage) => {
              console.log('📨 admin 응답 수신:', receivedMessage);
              console.log('🔄 구독 상태 변화: admin → room_index로 변경 예정');
              handleIncomingMessage(receivedMessage);
            });
            
            if (adminSubscribeSuccess) {
              console.log('✅ admin 구독 성공 - 새 방 생성 응답 대기 중');
            } else {
              console.error('❌ admin 구독 실패');
            }
        }
  }, [open, roomDataWithoutRefresh?.id, roomDataWithoutRefresh?.adminData?.userIndex, roomDataWithoutRefresh?.isExistingRoom, roomDataWithoutRefresh?.isExisting]);

  // 컴포넌트 언마운트 시 구독 해제만 (WebSocket 연결은 유지)
  useEffect(() => {
    return () => {
      if (roomId) {
        console.log(`🔌 컴포넌트 언마운트 시 구독 해제만: ${roomId}`);
        unsubscribeFromRoom(roomId);
        // WebSocket 연결은 유지 - 구독만 해제
        // 자동 leave 메시지 전송 제거 - 사용자가 명시적으로 나가기 버튼을 눌렀을 때만 전송
      }
    };
  }, [roomId]);

  // ===============================메세지 보내기=======================================
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      
      // WebSocket 연결 상태 확인
      if (!isConnected || !stompClient || !stompClient.connected) {
        console.log('🔌 WebSocket 연결 상태:', { isConnected, hasStompClient: !!stompClient, stompConnected: stompClient?.connected });
        
        // 연결 재시도
        const userInfo = JSON.parse(localStorage.getItem('admin-info'));
        if (userInfo) {
          console.log('🔄 WebSocket 재연결 시도');
          connectWebSocket(userInfo);
          showToast("info", "채팅 연결을 재시도합니다. 잠시 후 다시 시도해주세요.");
        } else {
          showToast("error", "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        }
        return;
      }
      
      // 임시 messageindex 생성 (음수로 구분)
      const tempMessageIndex = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 메시지 즉시 UI에 추가 (사용자 경험 향상)
      const messageId = `local_${Date.now()}_${Math.random()}`;
      const localMessage = {
        id: messageId,
        text: newMessage,
        sender: { id: userInfo.id, name: userInfo.name },
        timestamp: new Date().toISOString(),
        messageindex: tempMessageIndex,
        isLocal: true,
        active: true
      };
      
      // 즉시 UI에 추가
      addMessage(localMessage);
      
      // 입력 필드 초기화
      const messageText = newMessage;
      setNewMessage('');
      setIsTyping(false);

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
        // 현재 room_index 확인 (roomId state 우선 사용) - 최적화된 함수 사용
        const currentRoomIndex = extractNumericRoomId(roomId || roomDataWithoutRefresh.id || roomDataWithoutRefresh.roomData?.id || roomDataWithoutRefresh.room_index || roomDataWithoutRefresh.roomindex);
        const hasValidRoomIndex = currentRoomIndex && currentRoomIndex !== '0';

        if (hasValidRoomIndex) {
          // 기존 방인 경우
          const messageData = {
            room_index: currentRoomIndex,
            room_name: roomDataWithoutRefresh.name,
            user_id: userInfo.id,
            message: messageText,
            participants: [], // 기존 방의 경우 참가자 정보는 서버에서 처리
            timestamp: null,
            tempMessageIndex: tempMessageIndex // 임시 messageindex 전송
          };
          
          console.log('📤 기존 방 메시지 전송:', messageData);
          
          // WebSocket으로 메시지 전송 (DB 저장 포함) - 숫자 roomId 사용
          const sendResult = sendMessage(currentRoomIndex, messageData);
          if (!sendResult) {
            // 전송 실패 시 로컬 메시지 제거
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            showToast("error", "메시지 전송에 실패했습니다. 연결을 확인해주세요.");
          } else {
            console.log('✅ 기존 방 메시지 전송 요청 완료');
          }
        } else {
          // 새로운 방인 경우 (첫 메시지로 방 생성)
          console.log('🆕 새로운 채팅방 생성 시도...');

          // 현재 roomId 상태 확인 (첫 메시지 이후 받은 room_index가 있는지)
          const currentRoomId = roomId;
          
          if (currentRoomId) {
            // 첫 메시지 이후 - 받은 room_index 사용
            console.log('✅ 받은 room_index 사용:', currentRoomId);
            
            const participants = roomDataWithoutRefresh.roomData?.participants || roomDataWithoutRefresh.participants || [];
            const otherUserId = participants.find(id => id !== userInfo.id);
            
            if (!otherUserId) {
              return;
            }
            
            const otherUser = adminList.find(admin => admin.userId === otherUserId);
            const roomName = otherUser ? `${otherUser.name}와의 채팅방` : generateRoomName([otherUserId, userInfo.id], null, adminList, userInfo.id, false);
            
            const messageData = {
              room_index: currentRoomId, // 받은 room_index 사용
              room_name: roomName,
              user_id: userInfo.id,
              message: messageText,
              participants: [otherUserId, userInfo.id],
              timestamp: null,
              tempMessageIndex: tempMessageIndex
            };
            
            console.log('📤 기존 방 메시지 전송 (받은 room_index 사용):', messageData);
            
            // 받은 room_index로 메시지 전송
            const sendResult = sendMessage(currentRoomId, messageData);
            if (!sendResult) {
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
              showToast("error", "메시지 전송에 실패했습니다. 연결을 확인해주세요.");
            } else {
              console.log('✅ 기존 방 메시지 전송 요청 완료 (받은 room_index 사용)');
            }
          } else {
            // 첫 메시지 - null로 보내서 백엔드에서 방 생성
            console.log('🆕 첫 메시지 - room_index null로 전송');
            
            // 그룹 채팅인지 1:1 채팅인지 확인
            const participants = roomDataWithoutRefresh.roomData?.participants || roomDataWithoutRefresh.participants || [];
            const isGroupChat = roomDataWithoutRefresh.isGroupChat || participants.length > 2;

            let messageData;

            if (isGroupChat) {
              // 그룹 채팅인 경우
              messageData = {
                room_index: null, // null로 설정하여 백엔드에서 새 방 생성
                room_name: generateRoomName(participants, null, adminList, userInfo.id, true),
                user_id: userInfo.id,
                message: messageText,
                participants: participants, // 참가자 목록 사용
                timestamp: null,
                tempMessageIndex: tempMessageIndex // 임시 messageindex 전송
              };
            } else {
              // 1:1 채팅인 경우
              // participants에서 상대방 ID 찾기
              const participants = roomDataWithoutRefresh.roomData?.participants || roomDataWithoutRefresh.participants || [];
              const otherUserId = participants.find(id => id !== userInfo.id);

              if (!otherUserId) {
                return;
              }

              // 상대방 이름 찾기
              const otherUser = adminList.find(admin => admin.userId === otherUserId);
              const roomName = otherUser ? `${otherUser.name}와의 채팅방` : generateRoomName([otherUserId, userInfo.id], null, adminList, userInfo.id, false);

              messageData = {
                room_index: null, // null로 설정하여 백엔드에서 새 방 생성
                room_name: roomName,
                user_id: userInfo.id,
                message: messageText,
                participants: [otherUserId, userInfo.id],
                timestamp: null,
                tempMessageIndex: tempMessageIndex // 임시 messageindex 전송
              };
            }

            console.log('📤 새 방 생성 메시지 전송 (첫 메시지):', messageData);

            // 새로운 방 생성 시 - room_index가 null이므로 백엔드에서 자동 생성
            const sendResult = sendMessage("admin", messageData);
            if (!sendResult) {
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
              showToast("error", "메시지 전송에 실패했습니다. 연결을 확인해주세요.");
            } else {
              console.log('✅ 첫 메시지 전송 요청 완료');
              
              // 백엔드에서 방 생성 후 해당 room_index로 응답을 보낼 예정
              // 프론트에서는 단순히 응답을 기다리면 됨
            }
          }
        }

        // 입력 필드에 포커스 유지
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);

      } catch (error) {
        console.error('❌ 메시지 전송 중 오류:', error);
        // 에러 발생 시 로컬 메시지 제거
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        showToast("error", "메시지 전송에 실패했습니다.");
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
    // 메시지가 추가될 때마다 자동 스크롤
    if (messages.length > 0) {
      console.log('📜 메시지 추가됨, 자동 스크롤 실행');
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // 파일 크기 제한 (500KB - base64 인코딩 고려)
      const maxFileSize = 500 * 1024; // 500KB (base64 인코딩 후 약 667KB)
      const validFiles = files.filter(file => {
        if (file.size > maxFileSize) {
          showToast("error", `${file.name} 파일이 너무 큽니다. (최대 500KB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        showToast("success", `${validFiles.length}개 파일이 선택되었습니다.`);
      }
      
      // input 초기화 (같은 파일을 다시 선택할 수 있도록)
      e.target.value = '';
    }
  };

  // 선택된 파일 제거
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 업로드 처리
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      showToast("warning", "업로드할 파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      
      // 현재 방 정보 확인
      const currentRoomIndex = roomDataWithoutRefresh?.roomData?.room_index || 
                              roomDataWithoutRefresh?.room_index || 
                              roomDataWithoutRefresh?.id || 
                              roomId;

      // FormData 생성
      const formData = new FormData();
      formData.append('room_index', currentRoomIndex);
      formData.append('user_id', userInfo.id);
      formData.append('message', '');
      
      // 파일들 추가
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // HTTP 파일 업로드 (JihunAuth 사용)
      const result = await UploadFiles(formData);
      
      // 성공 시 메시지 추가
      const messageId = `msg_${Date.now()}_${Math.random()}`;
      const message = {
        id: messageId,
        text: '',
        sender: { id: userInfo.id, name: userInfo.name },
        timestamp: new Date().toISOString(),
        messageindex: result.messageIndex,
        isLocal: false, // 로컬 플래그 제거
        files: result.files || []
      };
      
      addMessage(message);
      showToast("success", `${selectedFiles.length}개 파일이 업로드되었습니다.`);
      
      // 선택된 파일 초기화
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      showToast("error", "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 채팅방 나가기 시 구독 해제만 (WebSocket 연결 유지)
  const handleBack = () => {
    if (roomId) {
      // roomId를 안전하게 추출
      let extractedRoomId = roomId;
      
      // roomId가 객체인 경우 처리
      if (extractedRoomId && typeof extractedRoomId === 'object') {
        extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
      }
      
      // 문자열로 변환하고 숫자만 추출
      extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
      
      if (extractedRoomId) {
        // 퇴장 알림 없이 구독만 해제 (WebSocket 연결은 유지)
        unsubscribeFromRoom(extractedRoomId);
        console.log('🚪 채팅방 구독 해제만 (WebSocket 연결 유지):', extractedRoomId);
      }
    }

    setMessages([]);
    setRoomId(null);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setIsLoadingMore(false);

    onBack();
  };

  // 채팅방 닫기 시에도 구독 해제만 (WebSocket 연결 유지)
  const handleClose = () => {
    if (roomId) {
      // roomId를 안전하게 추출
      let extractedRoomId = roomId;
      
      // roomId가 객체인 경우 처리
      if (extractedRoomId && typeof extractedRoomId === 'object') {
        extractedRoomId = extractedRoomId.room_index || extractedRoomId.id || extractedRoomId.roomId;
      }
      
      // 문자열로 변환하고 숫자만 추출
      extractedRoomId = String(extractedRoomId || '').replace(/[^0-9]/g, '');
      
      if (extractedRoomId) {
        // 퇴장 알림 없이 구독만 해제 (WebSocket 연결은 유지)
        unsubscribeFromRoom(extractedRoomId);
        console.log('🚪 채팅방 구독 해제만 (WebSocket 연결 유지):', extractedRoomId);
      }
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

  // 초대하기 관련 핸들러들
  const handleInviteGroupToggle = (typeName) => {
    setExpandedInviteGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeName)) {
        newSet.delete(typeName);
      } else {
        newSet.add(typeName);
      }
      return newSet;
    });
  };

  const handleInviteAdminCheckboxChange = (adminId, checked) => {
    setSelectedInviteAdmins(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(adminId);
      } else {
        newSet.delete(adminId);
      }
      return newSet;
    });
  };

  const handleInviteSelectAllInDepartment = (typeName, checked) => {
    const adminsInDepartment = adminList.filter(admin => admin.adminTypeName === typeName);

    setSelectedInviteAdmins(prev => {
      const newSet = new Set(prev);
      adminsInDepartment.forEach(admin => {
        if (checked) {
          newSet.add(admin.userIndex);
        } else {
          newSet.delete(admin.userIndex);
        }
      });
      return newSet;
    });
  };

  const handleInviteUsers = async () => {
    if (selectedInviteAdmins.size === 0) {
      showToast("warning", '초대할 사용자를 선택해주세요.');
      return;
    }

    const selectedAdminList = adminList.filter(admin => selectedInviteAdmins.has(admin.userIndex));
    const userInfo = JSON.parse(localStorage.getItem('admin-info'));

    try {
      // 백엔드 API 호출 - UserInvitation 사용
      const response = await UserInvitation(roomId, {
        userid: selectedAdminList.map(admin => admin.userId),
        inviter: userInfo.id
      });

      // 응답 상태 코드 확인 (200이면 성공)
      if (response.status === 200) {
        showToast("success", '사용자 초대가 완료되었습니다.');
        setShowInviteSelection(false);
        setSelectedInviteAdmins(new Set());

        // 초대된 사용자들에게 명시적 입장 알림 전송
        selectedAdminList.forEach(admin => {
          console.log('📨 초대된 사용자에게 입장 알림 전송:', admin.name);
          // 사용자 초대 시 입장 알림 전송
          sendEnterMessage();
        });

        // 채팅방 목록 새로고침
        if (refreshChatRooms) {
          await refreshChatRooms();
        }
      } else {
        showToast("error", '사용자 초대에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 초대 오류:', error);
      showToast("error", '사용자 초대 중 오류가 발생했습니다.');
    }
  };

  const handleBackToChat = () => {
    setShowInviteSelection(false);
    setSelectedInviteAdmins(new Set());
  };

  const handleMoreOptionsClose = () => {
    setMoreOptionsAnchor(null);
  };

  const handleMoreOptionsItemClick = async (optionId) => {
    handleMoreOptionsClose();

    switch (optionId) {
      case 'addUser':
        // 초대하기 UI 표시
        setShowInviteSelection(true);
        break;
      case 'leaveRoom':
        // 채팅방 나가기 기능 구현
        try {
          // 현재 사용자 ID 가져오기 (localStorage에서)
          const userInfo = JSON.parse(localStorage.getItem('admin-info'));
          const userId = userInfo?.id;

          if (!userId) {
            return;
          }

          // 백엔드 API 호출
          if (window.confirm('채팅방을 나가시겠습니까?')) {
            try {
              // 명시적 퇴장 알림 전송
              sendLeaveMessage();
              
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
                showToast("error", '채팅방 나가기에 실패했습니다.');
              }
            } catch (error) {
              showToast("error", '채팅방 나가기 중 오류가 발생했습니다.');
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

  // 메시지 우클릭 메뉴 핸들러
  const handleMessageContextMenu = (event, message) => {
    event.preventDefault();
    setSelectedMessage(message);
    setMessageMenuAnchor(event.currentTarget);
  };

  // 메시지 삭제 핸들러
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('admin-info'));
      
      if (!userInfo) {
        showToast("error", "로그인이 필요합니다.");
        return;
      }

      // 본인 메시지만 삭제 가능
      if (selectedMessage.sender.id !== userInfo.id) {
        showToast("error", "자신의 메시지만 삭제할 수 있습니다.");
        return;
      }

      console.log('삭제 시도 메시지:', {
        messageId: selectedMessage.id,
        messageIndex: selectedMessage.messageindex,
        active: selectedMessage.active,
        isLocal: selectedMessage.isLocal
      });

      // 삭제 확인
      if (!window.confirm("이 메시지를 삭제하시겠습니까?")) {
        return;
      }

      // 모든 메시지는 서버 삭제 시도

      // 실제 messageindex가 있는 경우 서버 삭제 시도
      if (!selectedMessage.messageindex || 
          selectedMessage.messageindex === 'undefined' || 
          selectedMessage.messageindex === 'null' ||
          selectedMessage.messageindex === undefined ||
          selectedMessage.messageindex === null) {
        console.error('messageindex 없음:', selectedMessage.messageindex);
        showToast("error", "메시지 인덱스를 찾을 수 없습니다.");
        return;
      }

      // 먼저 로컬에서 메시지를 삭제된 상태로 표시
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, active: false }
          : msg
      ));

      // WebSocket을 통해 메시지 삭제 요청
      const currentRoomId = roomId || roomDataWithoutRefresh?.id || roomDataWithoutRefresh?.roomData?.id;
      console.log('메시지 삭제 요청:', { currentRoomId, messageIndex: selectedMessage.messageindex, selectedMessage });
      
      // messageindex를 숫자로 변환하여 전달
      const messageIndex = parseInt(selectedMessage.messageindex);
      if (isNaN(messageIndex)) {
        console.error('유효하지 않은 messageindex:', selectedMessage.messageindex);
        showToast("error", "메시지 인덱스가 유효하지 않습니다.");
        return;
      }
      
      const deleteSuccess = await deleteMessage(currentRoomId, messageIndex);
      
      if (deleteSuccess) {
        showToast("success", "메시지가 삭제되었습니다.");
      } else {
        // 삭제 실패 시 원래 상태로 복원
        setMessages(prev => prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { ...msg, active: true }
            : msg
        ));
        showToast("error", "메시지 삭제에 실패했습니다. WebSocket 연결을 확인해주세요.");
      }
    } catch (error) {
      console.error('메시지 삭제 오류:', error);
      // 에러 발생 시 원래 상태로 복원
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, active: true }
          : msg
      ));
      showToast("error", "메시지 삭제 중 오류가 발생했습니다.");
    } finally {
      setMessageMenuAnchor(null);
      setSelectedMessage(null);
    }
  };

  // 메시지 메뉴 닫기
  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessage(null);
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
              {(() => {
                const userInfo = JSON.parse(localStorage.getItem('admin-info'));
                const participants = roomDataWithoutRefresh.roomData?.participants || roomDataWithoutRefresh.participants || [];

                // 1:1 채팅인 경우
                if (participants.length === 2) {
                  const otherUserId = participants.find(id => id !== userInfo.id);
                  const otherUser = adminList.find(admin => admin.userId === otherUserId);
                  return otherUser ? `${otherUser.name}와의 채팅방` : (roomDataWithoutRefresh.name || '채팅방');
                }
                // 그룹 채팅인 경우
                else if (participants.length > 2) {
                  const otherParticipants = participants.filter(id => id !== userInfo.id);
                  const participantNames = otherParticipants
                    .map(userId => {
                      const admin = adminList.find(admin => admin.userId === userId);
                      return admin ? admin.name : userId;
                    })
                    .filter(name => name);

                  if (participantNames.length > 0) {
                    return `${participantNames.join(', ')} 그룹채팅`;
                  }
                }

                // 기본값
                return roomDataWithoutRefresh.adminData ? roomDataWithoutRefresh.adminData.name : (roomDataWithoutRefresh.name || '채팅방');
              })()}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
          {/* 초대하기 모달 오버레이 */}
          {showInviteSelection && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}
            >
              <Paper
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  maxHeight: '80%',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{
                  p: 2,
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="h6">사용자 초대</Typography>
                  <IconButton onClick={handleBackToChat} size="small">
                    <Close />
                  </IconButton>
                </Box>

                <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    초대할 사용자를 선택하세요
                  </Typography>

                  <List sx={{ py: 0 }}>
                                         {(() => {
                       const userInfo = JSON.parse(localStorage.getItem('admin-info'));
                       // 현재 방의 참가자 목록 가져오기 - 더 안정적인 로직
                       let currentParticipants = [];
                       
                       if (roomId) {
                         // 기존 방인 경우 - 여러 소스에서 참가자 정보 확인
                         if (roomParticipants && roomParticipants.length > 0) {
                           currentParticipants = roomParticipants.map(p => p.userId || p.id || p.userid);
                         } else if (roomDataWithoutRefresh.roomData?.participants) {
                           currentParticipants = roomDataWithoutRefresh.roomData.participants.map(p => p.userId || p.id || p.userid);
                         } else if (roomDataWithoutRefresh.participants) {
                           currentParticipants = roomDataWithoutRefresh.participants.map(p => p.userId || p.id || p.userid);
                         } else if (roomDataWithoutRefresh.adminData?.userId) {
                           // 1:1 채팅방인 경우 상대방과 본인을 참가자로 설정
                           currentParticipants = [userInfo.id, roomDataWithoutRefresh.adminData.userId];
                           console.log("🔍 1:1 채팅방 참가자 설정:", currentParticipants);
                         } else if (roomDataWithoutRefresh.adminData?.userIndex) {
                           // userIndex로도 상대방 찾기
                           const otherUser = adminList.find(admin => admin.userIndex === roomDataWithoutRefresh.adminData.userIndex);
                           if (otherUser) {
                             currentParticipants = [userInfo.id, otherUser.userId];
                             console.log("🔍 userIndex로 찾은 1:1 채팅방 참가자:", currentParticipants);
                           }
                         } else if (adminList && adminList.length > 0) {
                           // adminList에서 상대방 찾기 (1:1 채팅방)
                           const otherUser = adminList.find(admin => admin.userId !== userInfo.id);
                           if (otherUser) {
                             currentParticipants = [userInfo.id, otherUser.userId];
                           }
                         }
                       } else {
                         // 새 방인 경우
                         currentParticipants = roomDataWithoutRefresh.roomData?.participants || roomDataWithoutRefresh.participants || [];
                       }
                       
                       console.log("🔍 초대하기 - 현재 방 ID:", roomId);
                       console.log("🔍 초대하기 - roomParticipants 상태:", roomParticipants);
                       console.log("🔍 초대하기 - 현재 참가자 목록:", currentParticipants);
                       console.log("🔍 초대하기 - 전체 관리자 목록:", adminList.map(a => ({ name: a.name, userId: a.userId })));
                       
                       // 본인과 이미 방에 있는 사람들을 제외한 관리자 목록
                       const filteredAdminList = adminList.filter(admin => {
                         // 본인 제외
                         if (admin.userId === userInfo.id) {
                           return false;
                         }
                         
                         // 현재 방에 있는 참가자들 제외
                         if (currentParticipants && currentParticipants.includes(admin.userId)) {
                           return false;
                         }
                         
                         // roomParticipants 상태에도 있는지 확인
                         if (roomParticipants && roomParticipants.includes(admin.userId)) {
                           return false;
                         }
                         
                         // 1:1 채팅방인 경우 상대방 제외
                         if (roomDataWithoutRefresh.adminData && roomDataWithoutRefresh.adminData.userId === admin.userId) {
                           return false;
                         }
                         
                         // 1:1 채팅방인 경우 상대방의 userIndex도 확인
                         if (roomDataWithoutRefresh.adminData && roomDataWithoutRefresh.adminData.userIndex === admin.userIndex) {
                           return false;
                         }
                         
                         // 1:1 채팅방인 경우 상대방의 이름도 확인
                         if (roomDataWithoutRefresh.adminData && roomDataWithoutRefresh.adminData.name === admin.name) {
                           return false;
                         }
                         
                         // 채팅방 이름에서 상대방 이름 추출하여 필터링
                         if (roomDataWithoutRefresh.name) {
                           const roomName = roomDataWithoutRefresh.name;
                           // "김수고와의 채팅방" 형태에서 "김수고" 추출
                           const nameMatch = roomName.match(/^(.+?)와의 채팅방$/);
                           if (nameMatch && nameMatch[1] === admin.name) {
                             return false;
                           }
                         }
                         
                         return true;
                       });
                       
                       console.log("🔍 초대하기 - 필터링된 관리자 목록:", filteredAdminList.map(a => ({ name: a.name, userId: a.userId })));

                      // 부서별로 관리자 그룹화
                      const groupedAdmins = filteredAdminList.reduce((acc, admin) => {
                        const typeName = admin.adminTypeName || '기타';
                        if (!acc[typeName]) {
                          acc[typeName] = [];
                        }
                        acc[typeName].push(admin);
                        return acc;
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
                        const admins = groupedAdmins[typeName];
                        return (
                          <Box key={typeName} sx={{ mb: 1 }}>
                            <ListItem
                              button
                              onClick={() => handleInviteGroupToggle(typeName)}
                              sx={{
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                mb: 0.5
                              }}
                            >
                              <ListItemIcon>
                                {expandedInviteGroups.has(typeName) ? <ExpandMore /> : <ChevronRight />}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2">
                                      {typeName} ({admins.length})
                                    </Typography>
                                    <Checkbox
                                      checked={admins.every(admin => selectedInviteAdmins.has(admin.userIndex))}
                                      indeterminate={admins.some(admin => selectedInviteAdmins.has(admin.userIndex)) && !admins.every(admin => selectedInviteAdmins.has(admin.userIndex))}
                                      onChange={(e) => handleInviteSelectAllInDepartment(typeName, e.target.checked)}
                                      onClick={(e) => e.stopPropagation()}
                                      size="small"
                                    />
                                  </Box>
                                }
                              />
                            </ListItem>

                            {expandedInviteGroups.has(typeName) && (
                              <List sx={{ pl: 2 }}>
                                {admins.map((admin) => (
                                  <ListItem
                                    key={admin.userIndex}
                                    dense
                                    sx={{ py: 0.5 }}
                                  >
                                    <ListItemIcon>
                                      <Checkbox
                                        checked={selectedInviteAdmins.has(admin.userIndex)}
                                        onChange={(e) => handleInviteAdminCheckboxChange(admin.userIndex, e.target.checked)}
                                        size="small"
                                      />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={admin.name}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Box>
                        );
                      });
                    })()}
                  </List>
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleBackToChat}
                  >
                    취소
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleInviteUsers}
                    disabled={selectedInviteAdmins.size === 0}
                  >
                    초대하기 ({selectedInviteAdmins.size}명)
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

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
              const userInfo = JSON.parse(localStorage.getItem('admin-info'));
              // 메시지 발신자 ID와 현재 사용자 ID를 정확히 비교
              const messageSenderId = String(message.sender?.id || '');
              const currentUserId = String(userInfo?.id || '');
              const isMyMessage = messageSenderId === currentUserId && messageSenderId !== '';
              // active 상태를 안전하게 확인 (시스템 메시지는 제외하고, undefined, null, false, 0 모두 삭제된 것으로 처리)
              const isDeletedMessage = message.type !== 'system' && (message.active === false || message.active === 0 || message.active === null || message.active === undefined);
              const canDelete = isMyMessage && !isDeletedMessage;

              // 삭제된 메시지는 "삭제된 메시지"로 표시하거나 완전히 숨김
              if (isDeletedMessage) {
                return (
                  <Box key={safeKey} sx={{ mb: 1 }}>
                    <Box sx={{ textAlign: 'center', my: 1 }}>
                      <Chip
                        label="삭제된 메시지"
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem', 
                          backgroundColor: '#f5f5f5',
                          color: '#999',
                          fontStyle: 'italic'
                        }}
                      />
                    </Box>
                  </Box>
                );
              }

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
                            {message.sender?.name && message.sender.name !== message.sender.id ? message.sender.name : message.sender?.id || '알 수 없음'}
                          </Typography>
                          <Paper
                            sx={{
                              p: 1.5,
                              maxWidth: 280,
                              backgroundColor: isDeletedMessage ? '#f5f5f5' : (message.isLocal ? '#e3f2fd' : '#F8FAFC'),
                              color: isDeletedMessage ? '#999' : 'black',
                              borderRadius: '18px 18px 18px 4px',
                              boxShadow: 1,
                              border: '1px solid #e0e0e0',
                              opacity: message.isLocal ? 0.8 : 1,
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
                                                      {/* 파일이 없을 때만 텍스트 표시 */}
                          {(!message.files || message.files.length === 0) && (
                                                            <Typography variant="body2" sx={{ fontStyle: 'normal' }}>
                                  {isDeletedMessage ? '삭제된 메시지입니다' : message.text}
                            </Typography>
                          )}
                          
                          {/* 파일 첨부 표시 */}
                          {message.files && message.files.length > 0 && !isDeletedMessage && (
                            <Box sx={{ mt: 1 }}>
                              {message.files.map((file, fileIndex) => {
                                const isImage = file.type && file.type.startsWith('image/');
                                const fileSize = file.size ? (file.size / 1024).toFixed(1) : '0';
                                
                                return (
                                  <Box
                                    key={fileIndex}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: 1,
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: 1,
                                      mb: 0.5,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: '#e0e0e0'
                                      }
                                    }}
                                    onClick={() => {
                                      if (file.url) {
                                        if (isImage) {
                                          // 이미지는 새 탭에서 열기
                                          window.open(file.url, '_blank');
                                        } else {
                                          // 일반 파일은 다운로드
                                          const link = document.createElement('a');
                                          link.href = file.url;
                                          link.download = file.name;
                                          link.target = '_blank';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }
                                    }}
                                  >
                                    {isImage ? (
                                      // 이미지 미리보기
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box
                                          component="img"
                                          src={file.url}
                                          alt={file.name}
                                          sx={{
                                            width: 60,
                                            height: 60,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            mr: 1,
                                            border: '1px solid #ddd'
                                          }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                            {file.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
                                            {fileSize} KB
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ) : (
                                      // 일반 파일 아이콘
                                      <>
                                        <AttachFile sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                            {file.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
                                            {fileSize} KB
                                          </Typography>
                                        </Box>
                                      </>
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
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
                          onContextMenu={canDelete ? (e) => handleMessageContextMenu(e, message) : undefined}
                            sx={{
                              p: 1.5,
                              maxWidth: 280,
                            backgroundColor: isDeletedMessage ? '#f5f5f5' : '#1976d2',
                            color: isDeletedMessage ? '#999' : 'white',
                              borderRadius: '18px 18px 4px 18px',
                              boxShadow: 1,
                              border: 'none',
                            cursor: canDelete ? 'pointer' : 'default',
                            '&:hover': {
                              backgroundColor: isDeletedMessage ? '#f5f5f5' : (canDelete ? '#1565c0' : '#1976d2'),
                            },
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
                          {/* 파일이 없을 때만 텍스트 표시 */}
                          {(!message.files || message.files.length === 0) && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontStyle: 'normal',
                                color: isDeletedMessage ? '#999' : 'white'
                              }}
                            >
                              {isDeletedMessage ? '삭제된 메시지입니다' : message.text}
                            </Typography>
                          )}
                          
                          {/* 파일 첨부 표시 */}
                          {message.files && message.files.length > 0 && !isDeletedMessage && (
                            <Box sx={{ mt: 1 }}>
                              {message.files.map((file, fileIndex) => {
                                const isImage = file.type && file.type.startsWith('image/');
                                const fileSize = file.size ? (file.size / 1024).toFixed(1) : '0';
                                
                                return (
                                  <Box
                                    key={fileIndex}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: 1,
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      borderRadius: 1,
                                      mb: 0.5,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                      }
                                    }}
                                    onClick={() => {
                                      if (file.url) {
                                        if (isImage) {
                                          // 이미지는 새 탭에서 열기
                                          window.open(file.url, '_blank');
                                        } else {
                                          // 일반 파일은 다운로드
                                          const link = document.createElement('a');
                                          link.href = file.url;
                                          link.download = file.name;
                                          link.target = '_blank';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }
                                    }}
                                  >
                                    {isImage ? (
                                      // 이미지 미리보기
                                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box
                                          component="img"
                                          src={file.url}
                                          alt={file.name}
                                          sx={{
                                            width: 60,
                                            height: 60,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            mr: 1,
                                            border: '1px solid rgba(255, 255, 255, 0.3)'
                                          }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'white' }}>
                                            {file.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.6rem' }}>
                                            {fileSize} KB
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ) : (
                                      // 일반 파일 아이콘
                                      <>
                                        <AttachFile sx={{ fontSize: 16, mr: 1, color: 'rgba(255, 255, 255, 0.8)' }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'white' }}>
                                            {file.name}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.6rem' }}>
                                            {fileSize} KB
                                          </Typography>
                                        </Box>
                                      </>
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
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

          {/* 선택된 파일 목록 */}
          {selectedFiles.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
              <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                선택된 파일 ({selectedFiles.length}개)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {selectedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`}
                    onDelete={() => handleRemoveFile(index)}
                    size="small"
                    sx={{ maxWidth: '200px' }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleUploadFiles}
                  disabled={isUploading}
                  sx={{ flex: 1 }}
                >
                  {isUploading ? '업로드 중...' : '파일 업로드 하기'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                >
                  모두 취소
                </Button>
              </Box>
            </Box>
          )}

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
              multiple
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

      {/* 메시지 우클릭 메뉴 */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
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
        data-message-menu="menu"
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
        <MenuItem
          onClick={handleDeleteMessage}
          sx={{
            py: 1,
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.08)',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="삭제"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>
      </Menu>

    </Paper>
  );
}

export default ChatRoomWindow; 