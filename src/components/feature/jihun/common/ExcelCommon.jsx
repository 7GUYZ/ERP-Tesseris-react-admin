import * as XLSX from 'xlsx'

/**
 * 엑셀 다운로드 공통 유틸리티
 * 
 * 사용법:
 * 1. import { downloadExcel } from '@/components/feature/jihun/common/ExcelCommon'
 * 2. downloadExcel(data, fileName, sheetName)
 * 
 * @param {Array} data - 다운로드할 데이터 배열 (객체 배열)
 * @param {string} fileName - 파일명 (확장자 제외)
 * @param {string} sheetName - 시트명 (기본값: 'Sheet1')
 * @param {boolean} includeDate - 파일명에 날짜 포함 여부 (기본값: true)
 * 
 * 예시:
 * const data = [
 *   { '순번': 1, '이름': '홍길동', '나이': 25 },
 *   { '순번': 2, '이름': '김철수', '나이': 30 }
 * ]
 * 
 * downloadExcel(data, '회원목록', '회원정보')
 */

/**
 * 엑셀 파일 다운로드 함수
 * @param {Array} data - 다운로드할 데이터 배열
 * @param {string} fileName - 파일명 (확장자 제외)
 * @param {string} sheetName - 시트명 (기본값: 'Sheet1')
 * @param {boolean} includeDate - 파일명에 날짜 포함 여부 (기본값: true)
 */
export const downloadExcel = (data, fileName, sheetName = 'Sheet1', includeDate = true) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 데이터의 첫 번째 행에서 컬럼 정보를 추출하여 자동으로 컬럼 너비 설정
    if (data.length > 0) {
      const firstRow = data[0];
      const columnWidths = Object.keys(firstRow).map(key => {
        // 컬럼명의 길이와 데이터의 최대 길이를 고려하여 너비 설정
        const columnNameLength = key.length;
        const maxDataLength = Math.max(
          columnNameLength,
          ...data.map(row => String(row[key] || '').length)
        );
        return { wch: Math.max(10, Math.min(maxDataLength + 2, 50)) }; // 최소 10, 최대 50
      });
      worksheet['!cols'] = columnWidths;
    }

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 파일명 생성
    let finalFileName = fileName;
    if (includeDate) {
      finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      finalFileName = `${fileName}.xlsx`;
    }

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, finalFileName);

    console.log(`엑셀 다운로드 완료: ${data.length}개 항목`);
    return true;
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
    return false;
  }
}

/**
 * 선택된 항목만 엑셀로 다운로드하는 함수
 * @param {Array} allData - 전체 데이터 배열 또는 선택된 데이터 배열
 * @param {Set|Array} selectedRows - 선택된 행들의 Set (인덱스) 또는 선택된 데이터 배열
 * @param {string} fileName - 파일명 (확장자 제외)
 * @param {string} sheetName - 시트명 (기본값: 'Sheet1')
 * @param {boolean} includeDate - 파일명에 날짜 포함 여부 (기본값: true)
 */
export const downloadSelectedExcel = (allData, selectedRows, fileName, sheetName = 'Sheet1', includeDate = true) => {
  try {
    let dataToExport;
    
    // selectedRows가 배열인 경우 (선택된 데이터가 직접 전달된 경우)
    if (Array.isArray(selectedRows)) {
      dataToExport = selectedRows;
    } 
    // selectedRows가 Set인 경우 (기존 방식 - 인덱스 기반)
    else if (selectedRows instanceof Set) {
      // 체크된 항목이 없으면 안내 메시지
      if (selectedRows.size === 0) {
        alert("다운로드할 항목을 체크해주세요.\n\n체크박스를 클릭하여 원하는 항목을 선택한 후 다운로드 버튼을 눌러주세요.");
        return false;
      }
      
      // 체크된 항목만 필터링
      dataToExport = allData.filter((_, index) => selectedRows.has(index));
    } 
    // 그 외의 경우
    else {
      alert("선택된 데이터 형식이 올바르지 않습니다.");
      return false;
    }

    if (dataToExport.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return false;
    }

    // 엑셀 다운로드 실행
    return downloadExcel(dataToExport, fileName, sheetName, includeDate);
  } catch (error) {
    console.error('선택 항목 엑셀 다운로드 오류:', error);
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
    return false;
  }
}

export default {
  downloadExcel,
  downloadSelectedExcel
} 