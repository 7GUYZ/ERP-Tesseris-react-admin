"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const CommissionPaymentExcelDownloadButton = ({ data, selectedRows }) => {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.")
      return
    }

    let dataToExport = data;
    let fileName = `수당지급내역_${new Date().toISOString().split('T')[0]}.xlsx`;

    // 선택된 항목이 있으면 선택된 항목만, 없으면 전체 다운로드
    if (selectedRows && selectedRows.size > 0) {
      dataToExport = data.filter(item => selectedRows.has(item.id));
      fileName = `선택된_수당지급내역_${selectedRows.size}개_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // 안전한 날짜 변환 함수
    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.warn('날짜 변환 오류:', error, '원본 값:', dateValue);
        return '';
      }
    };

    // 데이터 가공 - 순서가 보장된 객체 생성
    const processedData = dataToExport.map(item => {
      const orderedData = {};
      
      // 순서대로 필드 추가
      orderedData['사용자 ID'] = item.userId || '';
      orderedData['사용자명'] = item.userName || '';
      orderedData['전화번호'] = item.userPhone || '';
      orderedData['거래명'] = item.transactionName || '';
      orderedData['승인여부'] = item.advanceMsg || '';
      orderedData['충전 시간'] = formatDate(item.chargeTime);
      orderedData['충전내역'] = item.description || '';
      orderedData['CM 값'] = item.cmValue ? item.cmValue.toLocaleString() : '0';
      orderedData['결제금액'] = item.cashValue ? item.cashValue.toLocaleString() : '0';
      orderedData['수당지급'] = item.regularCashValue ? item.regularCashValue.toLocaleString() : '0';
      orderedData['추천인 ID'] = item.suggestionUserId || '';
      orderedData['추천인명'] = item.suggestionUserName || '';
      orderedData['추천인 전화번호'] = item.suggestionUserPhone || '';
      orderedData['등급'] = item.userRoleKorNm || '';
      orderedData['계좌번호'] = item.userBankNumber || '';
      orderedData['은행명'] = item.userBankName || '';
      orderedData['예금주'] = item.userBankHolder || '';
      orderedData['지급 상태'] = item.paymentStatus || '';
      
      return orderedData;
    });

    // 컬럼 순서 명시적 설정
    const columnOrder = [
      '사용자 ID',
      '사용자명', 
      '전화번호',
      '거래명',
      '승인여부',
      '충전 시간',
      '충전내역',
      'CM 값',
      '결제금액',
      '수당지급',
      '추천인 ID',
      '추천인명',
      '추천인 전화번호',
      '등급',
      '계좌번호',
      '은행명',
      '예금주',
      '지급 상태'
    ];
    
    // 순서대로 정렬된 데이터 생성
    const orderedData = processedData.map(row => {
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
    ws['!cols'] = columnOrder.map(col => ({ wch: Math.max(col.length, 10) }));
    
    XLSX.utils.book_append_sheet(wb, ws, "CommissionPayment")
    XLSX.writeFile(wb, fileName)
  }

  return (
    <Button
      onClick={handleDownload}
      variant="contained"
      data-button-type="excel"
      style={{
        backgroundColor: "#059669",
        color: "white",
        textTransform: "none",
        padding: "8px 16px",
      }}
    >
      엑셀
    </Button>
  )
}

export default CommissionPaymentExcelDownloadButton 