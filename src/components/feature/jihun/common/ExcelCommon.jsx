import * as XLSX from 'xlsx'

/**
 * 엑셀 다운로드 유틸리티 함수
 * 
 * @param {Array} data - 다운로드할 데이터 배열
 * @param {string} fileName - 파일명 (확장자 제외)
 * @param {string} sheetName - 시트명 (기본값: 'Sheet1')
 * @param {boolean} includeDate - 파일명에 날짜 포함 여부 (기본값: true)
 * @param {Function} toast - toast 함수 (선택사항)
 * @returns {boolean} - 성공 여부
 */
export const downloadExcel = (data, fileName, sheetName = 'Sheet1', includeDate = true, toast = null) => {
  // 데이터 검증
  if (!data || !Array.isArray(data) || data.length === 0) {
    if (toast) {
      toast.error("내보낼 데이터가 없습니다.");
    } else {
      alert("내보낼 데이터가 없습니다.");
    }
    return;
  }

  try {
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 컬럼 너비 자동 설정
    const columnWidths = [];
    const headers = Object.keys(data[0] || {});
    
    headers.forEach(header => {
      let maxWidth = header.length;
      data.forEach(row => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });
      // 최소 10, 최대 50으로 제한
      columnWidths.push({ wch: Math.min(Math.max(maxWidth, 10), 50) });
    });
    
    worksheet['!cols'] = columnWidths;
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 파일명 생성
    let finalFileName = fileName;
    if (includeDate) {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      finalFileName = `${fileName}_${dateStr}`;
    }
    
    // 파일 다운로드
    XLSX.writeFile(workbook, `${finalFileName}.xlsx`);
    
    console.log(`엑셀 다운로드 완료: ${data.length}개 항목`);
    return true;
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    if (toast) {
      toast.error('엑셀 다운로드 중 오류가 발생했습니다.');
    } else {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
    return false;
  }
};

/**
 * 선택된 항목만 엑셀 다운로드
 * 
 * @param {Array} allData - 전체 데이터 배열
 * @param {Set} selectedRows - 선택된 행들의 Set (인덱스)
 * @param {string} fileName - 파일명 (확장자 제외)
 * @param {string} sheetName - 시트명 (기본값: 'Sheet1')
 * @param {boolean} includeDate - 파일명에 날짜 포함 여부 (기본값: true)
 * @param {Function} toast - toast 함수 (선택사항)
 * @returns {boolean} - 성공 여부
 */
export const downloadSelectedExcel = (allData, selectedRows, fileName, sheetName = 'Sheet1', includeDate = true, toast = null) => {
  // 선택된 항목 검증
  if (!selectedRows || selectedRows.size === 0) {
    if (toast) {
      toast.error("다운로드할 항목을 체크해주세요.\n\n체크박스를 클릭하여 원하는 항목을 선택한 후 다운로드 버튼을 눌러주세요.");
    } else {
      alert("다운로드할 항목을 체크해주세요.\n\n체크박스를 클릭하여 원하는 항목을 선택한 후 다운로드 버튼을 눌러주세요.");
    }
    return;
  }

  // 데이터 검증
  if (!allData || !Array.isArray(allData) || allData.length === 0) {
    if (toast) {
      toast.error("선택된 데이터 형식이 올바르지 않습니다.");
    } else {
      alert("선택된 데이터 형식이 올바르지 않습니다.");
    }
    return;
  }

  // 선택된 데이터 추출
  const selectedData = Array.from(selectedRows).map(index => allData[index]).filter(Boolean);

  if (selectedData.length === 0) {
    if (toast) {
      toast.error("내보낼 데이터가 없습니다.");
    } else {
      alert("내보낼 데이터가 없습니다.");
    }
    return;
  }

  try {
    // 엑셀 다운로드 실행
    return downloadExcel(selectedData, fileName, sheetName, includeDate, toast);
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    if (toast) {
      toast.error('엑셀 다운로드 중 오류가 발생했습니다.');
    } else {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
    return false;
  }
};

const excelUtils = {
  downloadExcel,
  downloadSelectedExcel
}

export default excelUtils 