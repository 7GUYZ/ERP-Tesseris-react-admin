import { GetAdminList, SaveSendMessage } from "../../api/auth/JihunAuth";


const adminlist = async () => {
    try {
        const response = await GetAdminList();
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

const saveSendMessage = async (messageData) => {
    try {
        const response = await SaveSendMessage(messageData);
        return response.data.data.data;
    } catch (error) {
        throw error;
    }
}

export { adminlist, saveSendMessage };