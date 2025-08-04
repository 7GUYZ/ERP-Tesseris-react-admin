import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Fab, Badge, Tooltip, Box } from '@mui/material';
import { Chat, Circle } from '@mui/icons-material';

function RealTimeChatButton({ onClick, unreadCount = 0, isOnline = false }) {
  // 드래그 상태
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 100, 
    y: window.innerHeight - 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // 드래그 기능
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // 마우스가 일정 거리 이상 움직였을 때만 드래그로 인식
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - mouseStart.x, 2) + 
      Math.pow(e.clientY - mouseStart.y, 2)
    );
    
    if (moveDistance > 5) {
      setHasDragged(true);
    }
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 화면 크기에 관계없이 항상 보이도록 설정
    const maxX = Math.max(window.innerWidth - 80, 100);
    const maxY = Math.max(window.innerHeight - 80, 100);
    
    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY))
    });
  }, [isDragging, dragStart.x, dragStart.y, mouseStart.x, mouseStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // 드래그가 끝나면 hasDragged 상태를 리셋
    setTimeout(() => {
      setHasDragged(false);
    }, 50);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    setMouseStart({
      x: e.clientX,
      y: e.clientY
    });
    
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
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

  // 화면 크기 변경 시 버튼 위치 자동 조정
  useEffect(() => {
    const handleResize = () => {
      const maxX = Math.max(window.innerWidth - 80, 100);
      const maxY = Math.max(window.innerHeight - 80, 100);
      
      setPosition(prev => ({
        x: Math.max(10, Math.min(prev.x, maxX)),
        y: Math.max(10, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box
      ref={buttonRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        // 화면 크기에 관계없이 항상 보이도록 설정
        minWidth: '56px',
        minHeight: '56px'
      }}
      onMouseDown={handleMouseDown}
    >
      <Tooltip title="실시간 채팅" placement="left">
        <Badge badgeContent={unreadCount} color="error">
          <Fab
            onClick={!isDragging && !hasDragged ? onClick : undefined}
            sx={{
              background: 'linear-gradient(45deg, rgb(33, 150, 243) 30%, rgb(33, 203, 243) 90%)',
              boxShadow: 'rgba(33, 150, 243, 0.3) 0px 8px 20px',
              '&:hover': {
                background: 'linear-gradient(45deg, rgb(25, 118, 210) 30%, rgb(25, 151, 210) 90%)',
                transform: isDragging ? 'none' : 'scale(1.1)',
                boxShadow: 'rgba(33, 150, 243, 0.4) 0px 12px 25px',
              },
              transition: isDragging ? 'none' : 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <Chat sx={{ color: 'white', fontSize: 28 }} />
            {isOnline && (
              <Circle
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 12,
                  color: 'rgb(33, 150, 243)'
                }}
              />
            )}
          </Fab>
        </Badge>
      </Tooltip>
    </Box>
  );
}

export default RealTimeChatButton; 