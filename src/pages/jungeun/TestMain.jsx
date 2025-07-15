import { test } from "../../api/auth/JungeunAuth";

export default function TestMain(){
    const handleTestBackend = async (e) => {
        e.preventDefault();
    
        try {
          const response = await test();
          console.log("✅ 응답:", response);
        } catch (error) {
          console.error("API 요청 실패:", error.message || error);
          // 예: 토스트 띄우거나 화면에 오류 표시 가능
        }
      };
    
      return (
        <div>
          <h1>관리자 로그인 후 이동하는 메인 페이지</h1>
          <button onClick={handleTestBackend}>테스트 백엔드 호출</button>
        </div>
      );
    }