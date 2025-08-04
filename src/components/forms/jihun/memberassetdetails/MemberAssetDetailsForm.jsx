import React, { useState, useCallback, useEffect } from 'react';
import MemberAssetDetailsTable from "../../../ui/jihun/memberassetdetails/MemberAssetDetailsTable.jsx"
import PaymentCollectionModal from "./PaymentCollectionModal.jsx"
import {
  ajgMemberAssetDetails,
  ajgMemberAssetDetailsSearch,
  ajgMemberAssetDetailsLookupGrades,
  ajgMemberAssetDetailsPayment,
  excelDownloadMemberAssetDetails
} from "../../../../api/auth/JihunAuth.jsx"
import { downloadExcel } from "../../../feature/jihun/common/ExcelCommon.jsx"
import "../../../../styles/jihun/memberassetdetails/MemberAssetDetailsForm.css"
import { useToast } from '../../../../context/jungeun/ToastContext';
import { permissionCheckApi } from "../../../../api/auth/TaekjunAuth";

/**
 * 회원 자산 현황 폼 컴포넌트
 * 
 * 주요 기능:
 * 1. 회원 자산 현황 조회
 * 2. 동적 검색 조건 지원
 * 3. 페이징 처리된 결과 표시
 * 4. 엑셀 다운로드
 * 5. 지급 및 회수 기능
 */
const MemberAssetDetailsForm = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    grade: ""
  })

  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(true)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [allSelectedRows, setAllSelectedRows] = useState(new Map()) // 페이지별 선택 항목 저장
  const [options, setOptions] = useState({
    grades: []
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [canUpdate, setCanUpdate] = useState(false)

  // 서버 사이드 페이징 상태
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // 🆕 검색 모드 상태 추가
  const [isSearchMode, setIsSearchMode] = useState(false)

  // 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await permissionCheckApi.checkPermission(11); // programIndex: 11 (회원 자산 현황)
        if (response.data) {
          setCanUpdate(response.data.hasUpdateAuthority === 1);
          console.log('회원 자산 현황 수정 권한 체크 결과:', response.data.hasUpdateAuthority);
        }
      } catch (error) {
        console.error('권한 체크 실패:', error);
        setCanUpdate(false);
      }
    };
    
    checkPermission();
  }, []);

  // 페이징 전용 데이터 로드 함수
  const loadDataWithPagination = useCallback(async (page, size, searchFormData = formData) => {
    try {

      setLoading(true)
      
      // 검색 조건이 있는 경우와 없는 경우를 구분
      const hasSearchCriteria = searchFormData.id || searchFormData.name || searchFormData.phone || searchFormData.grade
      
      let response
      
      if (hasSearchCriteria) {
        // 검색 조건이 있는 경우
        const searchCriteria = {
          userEmail: searchFormData.id ? searchFormData.id.trim() : null,
          userName: searchFormData.name ? searchFormData.name.trim() : null,
          userPhone: searchFormData.phone ? searchFormData.phone.trim() : null,
          userRoleIndex: searchFormData.grade ? parseInt(searchFormData.grade) : null
        }
        
        const paginationInfo = {
          page: page,
          size: size
        }
        
        const cleanSearchCriteria = Object.fromEntries(
          Object.entries(searchCriteria).filter(([_, value]) => value !== null && value !== undefined)
        )
        
        const searchRequest = {
          searchCriteria: cleanSearchCriteria,
          paginationInfo: paginationInfo
        }
        
        response = await ajgMemberAssetDetailsSearch(searchRequest)
      } else {
        // 검색 조건이 없는 경우 - GET 요청 사용
        response = await ajgMemberAssetDetails(page, size)
      }
      
      if (response.data && response.data.content) {
        const transformedData = response.data.content.map((item, index) => {
          // CM 값 변환 로직 개선
          let cmHeld = 0;
          if (item.userCmCurrent !== null && item.userCmCurrent !== undefined) {
            if (typeof item.userCmCurrent === 'string') {
              cmHeld = parseInt(item.userCmCurrent) || 0;
            } else if (typeof item.userCmCurrent === 'number') {
              cmHeld = item.userCmCurrent;
            }
          }
          const emailValue = item.userEmail || item.userId || item.email || "";
          const emailDisplay = emailValue ? emailValue.split('@')[0] : "";
          
          return {
            id: `row-${(page * size) + index + 1}`, // 🆕 페이지 기반 고유 키
            email: emailDisplay,
            name: item.userName || "",
            phone: item.userPhone || "",
            grade: item.userRoleKorNm || "",
            franchiseName: item.storeName || "",
            cmHeld: cmHeld,
            cmpHeld: item.userCmpCurrent ? (typeof item.userCmpCurrent === 'string' ? parseInt(item.userCmpCurrent) : item.userCmpCurrent) || 0 : 0,
            cashHeld: item.userCashCurrent ? (typeof item.userCashCurrent === 'string' ? parseInt(item.userCashCurrent) : item.userCashCurrent) || 0 : 0,
            registrationDate: item.userCreateTime ? 
                (() => {
                  try {
                    // 🆕 배열 형태로 전달되는 경우 처리
                    if (Array.isArray(item.userCreateTime)) {
                      const [year, month, day] = item.userCreateTime;
                      // 월은 0부터 시작하므로 -1, 일은 그대로 사용
                      const date = new Date(year, month - 1, day);
                      if (isNaN(date.getTime())) {
                        return "";
                      }
                      return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
                    } else {
                      // 기존 로직 (문자열이나 Date 객체)
                      const date = new Date(item.userCreateTime);
                      if (isNaN(date.getTime())) {
                        return "";
                      }
                      return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
                    }
                  } catch (error) {
                    console.warn('날짜 변환 오류:', error);
                    return "";
                  }
                })() : "",
            uniqueKey: `row-${(page * size) + index + 1}`, // 🆕 페이지 기반 고유 키
            rowNumber: (page * size) + index + 1, // 🆕 페이지 기반 순번으로 수정
            userIndex: item.userIndex || "", // 지급/회수 시 사용할 실제 ID
            usersId: item.userId || "",
            userEmail: item.userEmail || "",
            userId: item.userId || "",
            userRoleKorNm: item.userRoleKorNm || "",
            userName: item.userName || "",
            userPhone: item.userPhone || "",
            storeName: item.storeName || "",
            userCmCurrent: item.userCmCurrent || 0,
            userCmpCurrent: item.userCmpCurrent || 0,
            userCashCurrent: item.userCashCurrent || 0
          };
        });
         
         // 🆕 모든 데이터를 그대로 표시 (이미 index + 1로 설정됨)
         setSearchResults(transformedData)
         
         // 🆕 백엔드에서 받은 실제 totalElements 사용
         setTotalCount(response.data.totalElements || 0)
      } else {
        setSearchResults([])
        setTotalCount(0)
      }
    } catch (error) {
      setSearchResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [formData])

  // 🆕 초기 데이터 로딩 함수 (검색 조건 없이)
  const loadInitialData = useCallback(async (page, size) => {
    try {
      setLoading(true)
      
      // 검색 조건 없이 전체 데이터 조회
      const response = await ajgMemberAssetDetails(page, size)
      
      if (response.data && response.data.content) {
        const transformedData = response.data.content.map((item, index) => {
          // CM 값 변환 로직 개선
          let cmHeld = 0;
          if (item.userCmCurrent !== null && item.userCmCurrent !== undefined) {
            if (typeof item.userCmCurrent === 'string') {
              cmHeld = parseInt(item.userCmCurrent) || 0;
            } else if (typeof item.userCmCurrent === 'number') {
              cmHeld = item.userCmCurrent;
            }
          }
          const emailValue = item.userEmail || item.userId || item.email || "";
          const emailDisplay = emailValue ? emailValue.split('@')[0] : "";
          
          return {
            id: `row-${(page * size) + index + 1}`, // 🆕 페이지 기반 고유 키
            email: emailDisplay,
            name: item.userName || "",
            phone: item.userPhone || "",
            grade: item.userRoleKorNm || "",
            franchiseName: item.storeName || "",
            cmHeld: cmHeld,
            cmpHeld: item.userCmpCurrent ? (typeof item.userCmpCurrent === 'string' ? parseInt(item.userCmpCurrent) : item.userCmpCurrent) || 0 : 0,
            cashHeld: item.userCashCurrent ? (typeof item.userCashCurrent === 'string' ? parseInt(item.userCashCurrent) : item.userCashCurrent) || 0 : 0,
            registrationDate: item.userCreateTime ? 
                (() => {
                  try {
                    // 🆕 배열 형태로 전달되는 경우 처리
                    if (Array.isArray(item.userCreateTime)) {
                      const [year, month, day] = item.userCreateTime;
                      // 월은 0부터 시작하므로 -1, 일은 그대로 사용
                      const date = new Date(year, month - 1, day);
                      if (isNaN(date.getTime())) {
                        return "";
                      }
                      return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
                    } else {
                      // 기존 로직 (문자열이나 Date 객체)
                      const date = new Date(item.userCreateTime);
                      if (isNaN(date.getTime())) {
                        return "";
                      }
                      return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
                    }
                  } catch (error) {
                    console.warn('날짜 변환 오류:', error);
                    return "";
                  }
                })() : "",
            uniqueKey: `row-${(page * size) + index + 1}`, // 🆕 페이지 기반 고유 키
            rowNumber: (page * size) + index + 1, // 🆕 페이지 기반 순번으로 수정
            userIndex: item.userIndex || "", // 지급/회수 시 사용할 실제 ID
            usersId: item.userId || "",
            userEmail: item.userEmail || "",
            userId: item.userId || "",
            userRoleKorNm: item.userRoleKorNm || "",
            userName: item.userName || "",
            userPhone: item.userPhone || "",
            storeName: item.storeName || "",
            userCmCurrent: item.userCmCurrent || 0,
            userCmpCurrent: item.userCmpCurrent || 0,
            userCashCurrent: item.userCashCurrent || 0
          };
                 });
         
         // 🆕 모든 데이터를 그대로 표시 (이미 index + 1로 설정됨)
         setSearchResults(transformedData)
         
         // 🆕 백엔드에서 받은 실제 totalElements 사용
         setTotalCount(response.data.totalElements || 0)
      } else {
        setSearchResults([])
        setTotalCount(0)
      }
    } catch (error) {
      setSearchResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true)
        const gradesRes = await ajgMemberAssetDetailsLookupGrades()
        setOptions({
          grades: gradesRes.data?.data || []
        })
        
        // 🆕 초기 데이터 로딩 (검색 조건 없이)
        await loadInitialData(0, pageSize)
      } catch (error) {
        // 기본 등급 옵션 설정
        setOptions({
          grades: [
            { index: 1, name: "일반" },
            { index: 2, name: "가맹점" },
            { index: 3, name: "사업자" },
            { index: 4, name: "정회원" }
          ]
        })
        await loadInitialData(0, pageSize)
      } finally {
        setLoading(false)
      }
    }
    loadOptions()
  }, [loadInitialData, pageSize]) // 🆕 formData 의존성 제거

  // 폼 입력 변경 핸들러 (성능 최적화)
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const [error, setError] = useState(null);

  // 🆕 검색 전용 함수 (조회 버튼 클릭 시에만 실행)
  const handleSearch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null) // 에러 초기화
      
      // 검색 시 첫 페이지로 리셋
      setCurrentPage(0)
      setSelectedRows(new Set()) // 검색 시 선택된 행들 초기화
      setAllSelectedRows(new Map()) // 전체 선택 맵도 초기화
      
      // 검색 조건이 있는 경우에만 검색 API 호출
      const hasSearchCriteria = formData.id || formData.name || formData.phone || formData.grade
      
      if (hasSearchCriteria) {
        setIsSearchMode(true) // 🆕 검색 모드로 설정
        await loadDataWithPagination(0, pageSize, formData)
      } else {
        // 검색 조건이 없으면 초기 데이터 로드
        setIsSearchMode(false) // 🆕 초기 모드로 설정
        await loadInitialData(0, pageSize)
      }
    } catch (error) {
      setError("검색 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [loadDataWithPagination, loadInitialData, pageSize, formData])

  // 선택된 행들 처리 핸들러
  const handleSelectionChange = (newSelection) => {
    // Set으로 안전한 선택 처리
    const safeSelection = newSelection instanceof Set ? newSelection : new Set(newSelection || []);
    setSelectedRows(safeSelection);
    
    // 현재 페이지의 선택 항목을 전체 선택 맵에 저장
    const pageKey = `page_${currentPage}`;
    const newAllSelectedRows = new Map(allSelectedRows);
    
    if (safeSelection.size > 0) {
      // 🆕 ID 기반으로 선택된 행들의 데이터 저장
      const selectedData = searchResults.filter((row, index) => {
        // row.id가 'row-1', 'row-2' 형태이므로 이를 기반으로 필터링
        return safeSelection.has(row.id);
      });
      newAllSelectedRows.set(pageKey, selectedData);
      console.log(`페이지 ${currentPage}에서 ${selectedData.length}개 항목 선택됨`);
    } else {
      // 선택이 해제되면 해당 페이지 데이터 삭제
      newAllSelectedRows.delete(pageKey);
      console.log(`페이지 ${currentPage} 선택 해제됨`);
    }
    
    setAllSelectedRows(newAllSelectedRows);
    console.log('전체 선택된 항목들:', Array.from(newAllSelectedRows.entries()));
  }

  // 🆕 서버 사이드 페이징 핸들러 (검색 모드에 따라 다른 함수 사용)
  const handlePageChange = useCallback(async (newPage) => {
    setCurrentPage(newPage)
    
    if (isSearchMode) {
      // 검색 모드일 때는 검색 조건과 함께 페이징
      await loadDataWithPagination(newPage, pageSize, formData)
    } else {
      // 초기 모드일 때는 검색 조건 없이 페이징
      await loadInitialData(newPage, pageSize)
    }
  }, [loadDataWithPagination, loadInitialData, pageSize, formData, isSearchMode])

  // 🆕 페이지 크기 변경 핸들러 (검색 모드에 따라 다른 함수 사용)
  const handlePageSizeChange = useCallback(async (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // 페이지 크기 변경 시 첫 페이지로 리셋
    
    if (isSearchMode) {
      // 검색 모드일 때는 검색 조건과 함께 페이징
      await loadDataWithPagination(0, newPageSize, formData)
    } else {
      // 초기 모드일 때는 검색 조건 없이 페이징
      await loadInitialData(0, newPageSize)
    }
  }, [loadDataWithPagination, loadInitialData, formData, isSearchMode])

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = useCallback(async () => {
    try {
      // 🆕 모든 페이지에서 선택된 항목들을 합쳐서 확인
      const allSelectedData = [];
      allSelectedRows.forEach((selectedData) => {
        allSelectedData.push(...selectedData);
      });
      
      console.log('엑셀 다운로드 - allSelectedRows:', allSelectedRows);
      console.log('엑셀 다운로드 - allSelectedData.length:', allSelectedData.length);
      
      if (allSelectedData.length > 0) {
        // 🆕 모든 페이지에서 선택된 항목들 엑셀 다운로드
        const excelData = allSelectedData.map((row, index) => ({
          'No.': index + 1,
          '사용자번호': row.userIndex || '',
          '사용자ID': row.userEmail || row.userId || row.usersId || '',
          '사용자역할': row.userRoleKorNm || '',
          '사용자이름': row.userName || '',
          '사용자전화번호': row.userPhone || '',
          '가맹점명': row.storeName || '',
          'CM현재잔액': row.userCmCurrent || 0,
          'CMP현재잔액': row.userCmpCurrent || 0,
          '현금현재잔액': row.userCashCurrent || 0
        }));
        console.log('선택된 항목들 엑셀 다운로드:', excelData.length, '개');
        downloadExcel(excelData, '회원자산현황_선택항목', '회원자산현황', true, showToast);
        
        // 🆕 엑셀 다운로드 후 선택된 항목들 초기화
        setSelectedRows(new Set());
        setAllSelectedRows(new Map());
        console.log('엑셀 다운로드 후 선택된 항목들 초기화 완료');
      } else {
        console.log('선택된 항목이 없어서 전체 다운로드 실행');
        setLoading(true);
        
        // 🆕 초기 조회와 동일한 API 사용하여 전체 데이터 다운로드
        const maxRecords = 30000;
        
        if (maxRecords <= 50000) {
          const response = await ajgMemberAssetDetails(0, maxRecords);
          const data = response.data;
          if (data.content) {
            const allData = data.content.map((item, index) => ({
              'No.': index + 1,
              '사용자번호': item.userIndex || '',
              '사용자ID': item.userEmail || item.userId || '',
              '사용자역할': item.userRoleKorNm || '',
              '사용자이름': item.userName || '',
              '사용자전화번호': item.userPhone || '',
              '가맹점명': item.storeName || '',
              'CM현재잔액': item.userCmCurrent || 0,
              'CMP현재잔액': item.userCmpCurrent || 0,
              '현금현재잔액': item.userCashCurrent || 0
            }));
            downloadExcel(allData, '회원자산현황_전체', '회원자산현황', true, showToast);
          }
        } else {
          const chunkSize = 50000;
          const totalChunks = Math.ceil(maxRecords / chunkSize);
          let allData = [];
          
          for (let i = 0; i < totalChunks; i++) {
            const chunkResponse = await ajgMemberAssetDetails(i, chunkSize);
            const chunkData = chunkResponse.data;
            if (chunkData.content) {
              const chunkExcelData = chunkData.content.map((item, index) => ({
                'No.': allData.length + index + 1,
                '사용자번호': item.userIndex || '',
                '사용자ID': item.userEmail || item.userId || '',
                '사용자역할': item.userRoleKorNm || '',
                '사용자이름': item.userName || '',
                '사용자전화번호': item.userPhone || '',
                '가맹점명': item.storeName || '',
                'CM현재잔액': item.userCmCurrent || 0,
                'CMP현재잔액': item.userCmpCurrent || 0,
                '현금현재잔액': item.userCashCurrent || 0
              }));
              allData = allData.concat(chunkExcelData);
            }
            console.log(`엑셀 다운로드 진행률: ${i + 1}/${totalChunks}`);
          }
          downloadExcel(allData, '회원자산현황_전체', '회원자산현황', true, showToast);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      showToast("error", '엑셀 다운로드 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [allSelectedRows, showToast]);

  // 지급 및 회수 핸들러
  const handlePaymentAndCollection = () => {
    if (!canUpdate) {
      showToast("error", "수정 권한이 없습니다.");
      return;
    }

    if (selectedRows.size === 0) {
      showToast("error", "지급 및 회수할 항목을 선택해주세요.");
      return;
    }
    
    // 다중선택 지원 - 첫 번째 선택된 항목으로 모달 열기 (대표 정보 표시용)
    const selectedId = Array.from(selectedRows)[0];
    // id가 'user-130' 형태이므로, 실제 row는 id === selectedId 인 것을 찾음
    const member = searchResults.find(row => row.id === selectedId);
    // 디버깅용 콘솔 로그
    console.log('지급/회수 버튼 클릭!');
    console.log('selectedRows:', Array.from(selectedRows));
    console.log('selectedId:', selectedId);
    console.log('searchResults.length:', searchResults.length);
    console.log('searchResults:', searchResults);
    console.log('선택된 member:', member);
    
    if (!member) {
      showToast("error", "선택된 회원 정보를 찾을 수 없습니다.");
      return;
    }
    
    // 선택된 회원 수 표시
    if (selectedRows.size > 1) {
      showToast("info", `${selectedRows.size}명의 회원이 선택되었습니다. 대표 회원 정보로 모달이 열립니다.`);
    }
    
    // 지급/회수 모달에 넘길 때 usersId(uuid)만 넘기도록
    setSelectedMember({ ...member, usersId: member.usersId });
    setIsModalOpen(true);
  }

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  }

  // 지급/회수 제출 핸들러에서도 usersId(uuid)만 백엔드로 넘기도록 수정
  const handlePaymentSubmit = async (paymentData) => {
    try {
      // amount 방어코드 추가
      let amount = paymentData.amount;
      if (amount === undefined || amount === null || isNaN(amount)) {
        // paymentAmount가 있으면 숫자로 변환, 없으면 0
        if (paymentData.paymentAmount !== undefined && paymentData.paymentAmount !== null && paymentData.paymentAmount !== "") {
          amount = parseInt(paymentData.paymentAmount);
        } else {
          showToast("error", "금액을 입력해주세요.");
          return;
        }
      }
      if (amount === 0) {
        showToast("error", "금액은 0보다 커야 합니다.");
        return;
      }
      setLoading(true);
      const selectedIds = Array.from(selectedRows);
      // id가 'user-130' 형태이므로, 실제 row는 id === selectedId 인 것을 찾음
      const selectedMembers = selectedIds.map(id => searchResults.find(row => row.id === id)).filter(Boolean);
      const isPayment = paymentData.type === 'cm-payment' || paymentData.type === 'cmp-payment';
      const results = [];
      let successCount = 0;
      let failCount = 0;
      for (const member of selectedMembers) {
        try {
          // memberId로 반드시 userIndex(숫자)만 넘김
          const response = await ajgMemberAssetDetailsPayment({
            memberId: member.userIndex,
            amount: amount,
            reason: paymentData.reason,
            type: paymentData.type
          });
          if (response.data && response.data.success) {
            results.push({ member, success: true, message: '성공' });
            successCount++;
          } else {
            results.push({ member, success: false, message: response.data?.message || '실패' });
            failCount++;
          }
        } catch (error) {
          results.push({ member, success: false, message: error.message || '오류' });
          failCount++;
        }
      }
      setLoading(false);
      // 결과 표시
      const totalCount = selectedMembers.length;
      if (successCount > 0 && failCount === 0) {
        showToast("success", `${isPayment ? 'CM 지급' : 'CM 회수'} 처리가 ${totalCount}명의 회원에 대해 완료되었습니다.`);
      } else if (successCount > 0 && failCount > 0) {
        showToast("warning", `${isPayment ? 'CM 지급' : 'CM 회수'} 처리가 완료되었습니다.`);
      } else {
        showToast("error", `처리 실패:\n성공: ${successCount}명\n실패: ${failCount}명`);
      }
      // 모달 닫기
      handleModalClose();
      // 데이터 새로고침
      handleSearch();
    } catch (error) {
      console.error('Payment/Collection 처리 오류:', error);
      showToast("error", "처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="member-asset-details-container">
      {/* 페이지 제목과 액션 버튼 */}
      <div className="member-asset-details-page-header">
        <h1 className="member-asset-details-page-title">회원 자산 현황</h1>
        <div className="member-asset-details-actions">
          <button 
            className="member-asset-details-btn excel" 
            onClick={handleExcelDownload}
            disabled={searchResults.length === 0}
          >
            엑셀
          </button>
          <button
            className="member-asset-details-btn payment"
            onClick={handlePaymentAndCollection}
            disabled={!canUpdate}
            style={!canUpdate ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            지급 및 회수
          </button>
          <button
            className="member-asset-details-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {/* 검색 조건 섹션 */}
      <div className="member-asset-details-section">
        {/* 검색 조건 토글 헤더 */}
        <div className="member-asset-details-toggle-header">
          <button 
            className="member-asset-details-toggle-btn"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
          >
            <span className="member-asset-details-toggle-text">검색 조건</span>
            <span className={`member-asset-details-toggle-icon ${isSearchFormOpen ? 'open' : 'closed'}`}>
              ▼
            </span>
          </button>
        </div>
        
        {/* 검색 조건 폼 */}
        <div className={`member-asset-details-form ${isSearchFormOpen ? 'open' : 'closed'}`}>
          {/* 첫 번째 행: 아이디/이름 */}
          <div className="member-asset-details-row">
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">아이디</label>
              <input
                className="member-asset-details-input"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">이름</label>
              <input
                className="member-asset-details-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
          </div>

          {/* 두 번째 행: 전화번호/등급 */}
          <div className="member-asset-details-row">
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">전화번호</label>
              <input
                className="member-asset-details-input"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="검색명을 입력하세요."
              />
            </div>
            <div className="member-asset-details-field">
              <label className="member-asset-details-label">등급</label>
              <select
                className="member-asset-details-select"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
              >
                <option value="">등급을 선택하세요.</option>
                {options.grades.map((grade) => (
                  <option key={grade.index} value={grade.index}>{grade.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="member-asset-details-error">
          {error}
        </div>
      )}

      {/* 결과 테이블 섹션 */}
      <div className="member-asset-details-results-section">
        <MemberAssetDetailsTable 
          data={searchResults} 
          onSelectionChange={handleSelectionChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>

      {/* 지급 및 회수 모달 */}
      <PaymentCollectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedMember={selectedMember}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </div>
  )
}

export default MemberAssetDetailsForm 