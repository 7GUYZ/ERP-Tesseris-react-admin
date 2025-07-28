"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const CouponExcelDownloadButton = ({ data, selectedRows }) => {
  const handleDownload = () => {
    let dataToExport = data;
    let fileName = `쿠폰목록_${new Date().toISOString().split("T")[0]}.xlsx`;
    
    // 선택된 항목이 있으면 선택된 항목만, 없으면 전체 다운로드
    if (selectedRows && selectedRows.size > 0) {
      dataToExport = data.filter(item => selectedRows.has(item.id));
      fileName = `선택된_쿠폰목록_${selectedRows.size}개_${new Date().toISOString().split("T")[0]}.xlsx`;
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

    // 데이터를 엑셀 형식에 맞게 변환 - 실제 데이터 구조에 맞게 수정
    const excelData = dataToExport.map((item, index) => {
      console.log(`데이터 매핑 ${index + 1}번째 항목:`, item);
      console.log('날짜 필드들:', {
        couponIssuanceTime: item.couponIssuanceTime,
        couponProvidedTime: item.couponProvidedTime,
        couponLimitTime: item.couponLimitTime
      });
      
      const orderedData = {};
      
      // 순서대로 필드 추가 (실제 데이터 구조에 맞게 조정)
      orderedData["쿠폰명"] = item.couponName || "";
      orderedData["발행자 등급"] = item.issuanceUserRole || "";
      orderedData["발행자 ID"] = item.issuanceUser || "";
      orderedData["쿠폰 가격"] = item.couponPrice ? item.couponPrice.toLocaleString() : "0";
      orderedData["쿠폰 기한"] = item.couponLimit || "0";
      orderedData["쿠폰 발행 상태"] = item.couponIssuanceStatus || "";
      orderedData["쿠폰 발행일"] = formatDate(item.couponIssuanceTime);
      orderedData["지급받은자 등급"] = item.providedUserRole || "";
      orderedData["지급받은자 ID"] = item.providedUser || "";
      orderedData["쿠폰 지급 상태"] = item.couponProvidedStatus || "";
      orderedData["쿠폰 지급일"] = formatDate(item.couponProvidedTime);
      orderedData["쿠폰 만기일"] = formatDate(item.couponLimitTime);
      
      console.log(`매핑 결과 ${index + 1}번째:`, orderedData);
      return orderedData;
    });
    
    // 컬럼 순서 명시적 설정 (실제 데이터 구조에 맞게 조정)
    const columnOrder = [
      "쿠폰명",
      "발행자 등급",
      "발행자 ID",
      "쿠폰 가격",
      "쿠폰 기한",
      "쿠폰 발행 상태",
      "쿠폰 발행일",
      "지급받은자 등급",
      "지급받은자 ID",
      "쿠폰 지급 상태",
      "쿠폰 지급일",
      "쿠폰 만기일"
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
    
    const ws = XLSX.utils.json_to_sheet(orderedData)
    const wb = XLSX.utils.book_new()
    
    // 컬럼 너비 설정
    ws['!cols'] = columnOrder.map(col => ({ wch: Math.max(col.length, 12) }));
    
    XLSX.utils.book_append_sheet(wb, ws, "Coupons")
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

export default CouponExcelDownloadButton
