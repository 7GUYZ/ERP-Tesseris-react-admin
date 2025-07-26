"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const CouponExcelDownloadButton = ({ data, selectedRows }) => {
  const handleDownload = () => {
    let dataToExport = data;
    let fileName = "coupons.xlsx";
    
    // 선택된 항목이 있으면 선택된 항목만, 없으면 전체 다운로드
    if (selectedRows && selectedRows.size > 0) {
      dataToExport = data.filter(item => selectedRows.has(item.id));
      fileName = `selected_coupons_${selectedRows.size}.xlsx`;
    }
    
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
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
