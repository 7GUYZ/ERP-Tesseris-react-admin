"use client"

import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import { Download } from "@mui/icons-material"

const SalesPerformanceExcelDownloadButton = ({ data }) => {
  const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "SalesPerformance")
    XLSX.writeFile(wb, "sales_performance.xlsx")
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

export default SalesPerformanceExcelDownloadButton 