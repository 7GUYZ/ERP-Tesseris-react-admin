import { GetAdminList } from "../../api/auth/JihunAuth";


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

// const chatrooms = async () => {
//     const response = await GetChatRooms();
//     return response.data;
// }

export { adminlist };