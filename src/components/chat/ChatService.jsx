import { GetAdminList, SaveSendMessage } from "../../api/auth/JihunAuth";


const adminlist = async () => {
    try {
        const response = await GetAdminList();
        console.log("관리자 목록 조회 성공", response.data.data.data);
        return response.data.data.data;
    } catch (error) {
        console.error('Error fetching admin list:', error);
        throw error;
    }
}

const saveSendMessage = async (messageData) => {
    try {
        const response = await SaveSendMessage(messageData);
        console.log("메세지 저장 성공", response.data.data.data.room_index);
        return response.data.data.data;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

export { adminlist, saveSendMessage };