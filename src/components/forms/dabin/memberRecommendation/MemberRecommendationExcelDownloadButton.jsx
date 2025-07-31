"use client"

import { Button } from "@mui/material"
import * as XLSX from "xlsx"
import { Download } from "@mui/icons-material"

const MemberRecommendationExcelDownloadButton = ({ data, selectedRows }) => {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.")
      return
    }

    let dataToExport = data;
    let fileName = `회원_추천현황_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    // 선택된 항목이 있으면 선택된 항목만, 없으면 전체 다운로드
    if (selectedRows && selectedRows.size > 0) {
      dataToExport = data.filter(item => selectedRows.has(item.id));
      fileName = `선택된_회원_추천현황_${selectedRows.size}개_${new Date().toISOString().split("T")[0]}.xlsx`;
    }

    // 안전한 날짜 변환 함수
    const formatDate = (dateValue) => {
      console.log('formatDate 호출 - 원본 값:', dateValue, '타입:', typeof dateValue);
      
      if (!dateValue) {
        console.log('날짜 값이 없음');
        return '';
      }
      
      try {
        let date;
        
        // 배열 형태 처리 (LocalDateTime이 배열로 전송되는 경우)
        if (Array.isArray(dateValue)) {
          console.log('배열 형태 날짜:', dateValue);
          if (dateValue.length >= 6) {
            const [year, month, day, hour, minute, second] = dateValue;
            date = new Date(year, month - 1, day, hour, minute, second);
          } else if (dateValue.length >= 3) {
            const [year, month, day] = dateValue;
            date = new Date(year, month - 1, day);
          } else {
            console.log('배열 길이가 부족함:', dateValue.length);
            return '';
          }
        } else if (typeof dateValue === 'string') {
          console.log('문자열 형태 날짜:', dateValue);
          // ISO 형식 문자열 처리
          if (dateValue.includes('T')) {
            date = new Date(dateValue);
          } else {
            // 다른 형식의 문자열 처리
            date = new Date(dateValue);
          }
        } else {
          console.log('기본 Date 생성자 사용');
          date = new Date(dateValue);
        }
        
        if (isNaN(date.getTime())) {
          console.log('유효하지 않은 날짜');
          return '';
        }
        
        const result = date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        console.log('날짜 변환 결과:', result);
        return result;
      } catch (error) {
        console.error('날짜 변환 오류:', error, '원본 값:', dateValue);
        return '';
      }
    };

    // 데이터를 엑셀 형식에 맞게 변환 - 순서가 보장된 객체 생성
    const excelData = dataToExport.map((item, index) => {
      console.log(`데이터 매핑 ${index + 1}번째 항목:`, item);
      console.log('가입일 필드:', item.joinDate);
      
      const orderedData = {};
      
      // 순서대로 필드 추가
      orderedData["추천인 아이디"] = item.suggestionUserId || "";
      orderedData["추천인 이름"] = item.suggestionUserName || "";
      orderedData["추천인 등급"] = item.suggestionUserRole || "";
      orderedData["가맹점 이름"] = item.suggestionStoreName || "";
      orderedData["아이디"] = item.recommendationUserId || "";
      orderedData["이름"] = item.recommendationUserName || "";
      orderedData["등급"] = item.recommendationUserRole || "";
      orderedData["가입일"] = formatDate(item.joinDate);
      
      console.log(`매핑 결과 ${index + 1}번째:`, orderedData);
      return orderedData;
    });

    // 컬럼 순서 명시적 설정
    const columnOrder = [
      "추천인 아이디",
      "추천인 이름", 
      "추천인 등급",
      "가맹점 이름",
      "아이디",
      "이름",
      "등급",
      "가입일"
    ];
    
    // 순서대로 정렬된 데이터 생성
    const orderedData = excelData.map(row => {
      const orderedRow = {};
      columnOrder.forEach(col => {
        if (row.hasOwnProperty(col)) {
          orderedRow[col] = row[col];
        }
      });
      return orderedRow;
    });

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(orderedData)

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 15 }, // 추천인 아이디
      { wch: 12 }, // 추천인 이름
      { wch: 12 }, // 추천인 등급
      { wch: 15 }, // 가맹점 이름
      { wch: 15 }, // 아이디
      { wch: 12 }, // 이름
      { wch: 12 }, // 등급
      { wch: 13 }, // 가입일
    ]
    ws["!cols"] = colWidths

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, "회원 추천현황")

    // 파일 다운로드
    XLSX.writeFile(wb, fileName)
  }

  const getButtonText = () => {
    return "엑셀";
  };

  return (
    <Button
      onClick={handleDownload}
      variant="contained"
      startIcon={<Download />}
      data-button-type="excel"
      style={{
        backgroundColor: "#10b981",
        color: "white",
        textTransform: "none",
        padding: "8px 16px",
      }}
    >
      {getButtonText()}
    </Button>
  )
}

export default MemberRecommendationExcelDownloadButton 