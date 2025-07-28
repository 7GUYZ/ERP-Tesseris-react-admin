import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  // 알림 데이터 설정
  setNotifications: (notifications) => set({ notifications }),
  
  // 로딩 상태 설정
  setLoading: (loading) => set({ loading }),
  
  // 에러 상태 설정
  setError: (error) => set({ error }),

  // 특정 알림을 읽음 처리
  markAsRead: (alarmId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.alarmId === alarmId
          ? { ...notification, isRead: 1 }
          : notification
      ),
    }));
  },

  // 알림 데이터 초기화
  resetNotifications: () => set({ notifications: [], loading: false, error: null }),
}));

export default useNotificationStore; 