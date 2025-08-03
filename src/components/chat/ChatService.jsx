import { GetAdminList, SaveSendMessage } from "../../api/auth/JihunAuth";


const adminlist = async () => {
    try {
        const response = await GetAdminList();
        return response.data.data;
    } catch (error) {
        console.error('Error fetching admin list:', error);
        throw error;
    }
}

const saveSendMessage = async (messageData) => {
    try {
        const response = await SaveSendMessage(messageData);
        return response.data.data.data;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

export { adminlist, saveSendMessage };