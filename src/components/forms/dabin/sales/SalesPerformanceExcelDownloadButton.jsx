"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const SalesPerformanceExcelDownloadButton = ({ data, selectedRows }) => {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("다운로드할 데이터가 없습니다.")
      return
    }

    let dataToExport = data;
    let fileName = `영업실적_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 선택된 항목이 있으면 선택된 항목만, 없으면 전체 다운로드
    if (selectedRows && selectedRows.size > 0) {
      dataToExport = data.filter(item => selectedRows.has(item.id));
      fileName = `선택된_영업실적_${selectedRows.size}개_${new Date().toISOString().split("T")[0]}.xlsx`;
    }

    // 데이터를 엑셀 형식에 맞게 변환
    const excelData = dataToExport.map((item) => ({
      "사업자 ID": item.businessUserId || "",
      "사업자 이름": item.businessUserName || "",
      "사업자 등급": item.businessGradeName || "",
      "가맹점 ID": item.storeUserId || "",
      "가맹점명": item.storeName || "",
      "가맹점 상태": item.storeTransactionStatus === "1" ? "정상" : item.storeTransactionStatus === "0" ? "정지" : "",
      "승인 여부": item.storeRequestStatusName || "",
      "등록일": item.registrationDate || "",
      "수정일": item.modificationDate || "",
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "SalesPerformance")
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

export default SalesPerformanceExcelDownloadButton 