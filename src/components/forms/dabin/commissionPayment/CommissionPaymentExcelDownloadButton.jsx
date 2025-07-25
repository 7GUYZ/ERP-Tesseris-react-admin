"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const CommissionPaymentExcelDownloadButton = ({ data }) => {
  const handleDownload = () => {
    // 데이터 가공
    const processedData = data.map(item => ({
      '사용자 ID': item.userId || '',
      '사용자명': item.userName || '',
      '전화번호': item.userPhone || '',
      '거래명': item.transactionName || '',
      '충전 시간': item.chargeTime ? new Date(item.chargeTime).toLocaleString('ko-KR') : '',
      'CM 값': item.cmValue ? item.cmValue.toLocaleString() : '0',
      '캐시 값': item.cashValue ? item.cashValue.toLocaleString() : '0',
      '정기 캐시 값': item.regularCashValue ? item.regularCashValue.toLocaleString() : '0',
      '설명': item.description || '',
      '지급 상태': item.paymentStatus || '',
      '추천인 ID': item.suggestionUserId || '',
      '추천인명': item.suggestionUserName || '',
      '추천인 전화번호': item.suggestionUserPhone || '',
      '사용자 권한': item.userRoleKorNm || '',
      '계좌번호': item.userBankNumber || '',
      '은행명': item.userBankName || '',
      '예금주': item.userBankHolder || '',
    }))

    const ws = XLSX.utils.json_to_sheet(processedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "CommissionPayment")
    XLSX.writeFile(wb, `수당지급내역_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <Button
      onClick={handleDownload}
      variant="contained"
      startIcon={<Download />}
      style={{
        backgroundColor: "#059669",
        color: "white",
        textTransform: "none",
        padding: "8px 16px",
      }}
    >
      엑셀 다운로드
    </Button>
  )
}

export default CommissionPaymentExcelDownloadButton 