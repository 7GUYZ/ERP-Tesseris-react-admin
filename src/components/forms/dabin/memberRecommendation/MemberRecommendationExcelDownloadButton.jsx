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

    // 데이터를 엑셀 형식에 맞게 변환
    const excelData = dataToExport.map((item) => ({
      "추천인 아이디": item.suggestionUserId || "",
      "추천인 이름": item.suggestionUserName || "",
      "추천인 등급": item.suggestionUserRole || "",
      "가맹점 이름": item.suggestionStoreName || "",
      "아이디": item.recommendationUserId || "",
      "이름": item.recommendationUserName || "",
      "등급": item.recommendationUserRole || "",
      "가입일": item.joinDate
        ? new Date(item.joinDate).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",
    }))

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

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