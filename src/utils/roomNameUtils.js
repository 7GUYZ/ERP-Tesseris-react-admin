// Utility functions for generating chat room names

/**
 * Generate room name for 1:1 chat
 * @param {Array} participants - Array of participant user IDs
 * @param {Object} adminList - List of admin data
 * @param {string} currentUserId - Current user's ID
 * @returns {string} Room name in format "상대방과의 채팅방"
 */
export const generateOneOnOneRoomName = (participants, adminList, currentUserId) => {
  if (!participants || participants.length !== 2) return "1:1 채팅방";
  
  const otherUserId = participants.find(id => id !== currentUserId);
  if (!otherUserId) return "1:1 채팅방";
  
  const otherUser = adminList.find(admin => admin.userId === otherUserId);
  if (!otherUser) return "1:1 채팅방";
  
  return `${otherUser.name}와의 채팅방`;
};

/**
 * Generate room name for group chat
 * @param {Array} participants - Array of participant user IDs
 * @param {Object} adminList - List of admin data
 * @param {string} currentUserId - Current user's ID
 * @returns {string} Room name in format "참여자1, 참여자2, 참여자3 그룹채팅"
 */
export const generateGroupRoomName = (participants, adminList, currentUserId) => {
  if (!participants || participants.length < 3) return "그룹 채팅방";
  
  const otherParticipants = participants.filter(id => id !== currentUserId);
  const participantNames = otherParticipants
    .map(userId => {
      const admin = adminList.find(admin => admin.userId === userId);
      return admin ? admin.name : userId;
    })
    .filter(name => name);
  
  if (participantNames.length === 0) return "그룹 채팅방";
  
  return `${participantNames.join(', ')} 그룹채팅`;
};

/**
 * Unified function to generate room name for both 1:1 and group chats
 * @param {Array} participants - Array of participant user IDs
 * @param {string} roomName - Existing room name (if any)
 * @param {Object} adminList - List of admin data
 * @param {string} currentUserId - Current user's ID
 * @param {boolean} isGroupChat - Whether this is a group chat
 * @returns {string} Generated room name
 */
export const generateRoomName = (participants, roomName, adminList, currentUserId, isGroupChat = false) => {
  if (roomName) return roomName;
  
  if (isGroupChat) {
    return generateGroupRoomName(participants, adminList, currentUserId);
  } else {
    return generateOneOnOneRoomName(participants, adminList, currentUserId);
  }
}; 