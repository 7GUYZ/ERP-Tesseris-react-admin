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
  const buttonRef = useRef(null);

  // 드래그 기능
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    
    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY))
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
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

  return (
    <Box
      ref={buttonRef}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <Tooltip title="실시간 채팅 (드래그 가능)" placement="left">
        <Badge badgeContent={unreadCount} color="error">
          <Fab
            onClick={!isDragging ? onClick : undefined}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                transform: isDragging ? 'none' : 'scale(1.1)',
                boxShadow: '0 12px 25px rgba(33, 150, 243, 0.4)',
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
                  color: '#4CAF50'
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