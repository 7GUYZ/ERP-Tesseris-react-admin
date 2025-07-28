import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { getBusinessManDetail, updateBusinessMan, getBusinessManTransactionHistory, setupInterceptors } from '../../../../api/auth/DeokkyuAuth';
import DetailModal from '../../../ui/deokkyu/DetailModal';
import NoRowsOverlay from '../../../ui/deokkyu/NoRowsOverlay';

/**
 * 사업자 상세정보 모달
 * 
 * 백엔드 API 요구사항:
 * 1. GET /api/modal/businessman/detail/{businessManId}
 *    응답 필드:
 *    - userPassword: 사용자 비밀번호
 *    - userName: 사용자 이름
 *    - userBirthday: 사용자 생년월일 (YYYY-MM-DD)
 *    - userGenderIndex: 사용자 성별 인덱스 (숫자)
 * 
 * 2. PUT /api/modal/businessman/update/{businessManId}
 *    요청 필드 (모두 선택사항):
 *    - userPassword: 비밀번호 변경 시
 *    - userName: 이름 변경 시
 *    - userBirthday: 생년월일 변경 시 (YYYY-MM-DD)
 *    - userGenderIndex: 성별 변경 시
 * 
 * 3. GET /api/modal/businessman/transaction-history/{businessManId}
 *    응답 필드:
 *    - temporaryStoreMasterIndexName: 가맹점 이름
 *    - temporaryStoreMasterDistributionTime: 분배 시간 (ISO 8601)
 *    - temporaryStoreCmValue: 분배받은 CM 값
 */

const BusinessManDetailModal = ({ isOpen, onClose, businessManId, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [businessManData, setBusinessManData] = useState(initialData || {});
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // 거래내역 관련 상태
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);

  // 날짜를 Date 객체로 변환하는 공통 함수
  const parseDate = (dateValue) => {
    try {
      if (!dateValue) return null;
      
      // 배열 형태인 경우 [year, month, day, hour, minute, second] → Date로 변환
      if (Array.isArray(dateValue) && dateValue.length >= 6) {
        const [year, month, day, hour, minute, second] = dateValue;
        return new Date(year, month - 1, day, hour, minute, second);
      }
      
      // 문자열인 경우 ISO 8601 형식 (2024-01-01T10:00:00) 또는 YYYY-MM-DD 형식
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return null;
    }
  };

  // 날짜를 한국어 형식으로 포맷하는 함수
  const formatDate = (dateValue, includeTime = true) => {
    const date = parseDate(dateValue);
    if (!date) return '-';
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleString('ko-KR', options);
  };

  // 거래내역 컬럼 정의 (BusinessManTransactionHistoryDto 기반)
  const transactionColumns = [
    { 
      field: 'temporaryStoreMasterDistributionTime', 
      headerName: '수당 발생 시간', 
      width: 180,
      valueGetter: (params) => {
        console.log('📅 날짜 valueGetter params:', params);
        return params.row.temporaryStoreMasterDistributionTime;
      },
      valueFormatter: (params) => {
        console.log('📅 날짜 포맷 params:', params);
        // 배열 형태의 날짜 데이터 처리
        return formatDate(params?.value);
      }
    },
    { 
      field: 'temporaryStoreMasterIndexName', 
      headerName: '가맹점 유저 이름', 
      width: 150,
      valueGetter: (params) => {
        console.log('👤 이름 valueGetter params:', params);
        return params.row.temporaryStoreMasterIndexName;
      },
      valueFormatter: (params) => {
        console.log('👤 이름 포맷 params:', params);
        try {
          if (!params || !params.value) return '-';
          return String(params.value);
        } catch (error) {
          console.error('유저 이름 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'temporaryStoreCmValue', 
      headerName: '수당 금액', 
      width: 130,
      valueGetter: (params) => {
        console.log('💰 금액 valueGetter params:', params);
        return params.row.temporaryStoreCmValue;
      },
      valueFormatter: (params) => {
        console.log('💰 금액 포맷 params:', params);
        try {
          if (!params || params.value === null || params.value === undefined) return '-';
          const amount = Number(params.value);
          if (isNaN(amount)) return '-';
          return `${amount.toLocaleString()}원`;
        } catch (error) {
          console.error('수당 금액 포맷 오류:', error);
          return '-';
        }
      }
    },
  ];

  // 상세 정보 로딩
  useEffect(() => {
    if (isOpen && businessManId && (!businessManData.key || businessManData.key !== businessManId)) {
      fetchBusinessManData(); // 상세정보와 거래내역을 별도로 가져오기
    }
  }, [isOpen, businessManId]);

  // 사업자 상세정보 및 거래내역 불러오기 (두 개의 API 호출)
  const fetchBusinessManData = async () => {
    try {
      setLoading(true);
      setTransactionLoading(true);
      console.log('🔍 사업자 데이터 요청:', businessManId);
      
      setupInterceptors();
      
      // 🔄 두 개의 API를 병렬로 호출
      const [detailResponse, transactionResponse] = await Promise.all([
        getBusinessManDetail(businessManId),
        getBusinessManTransactionHistory(businessManId)
      ]);
      
      console.log('✅ 사업자 상세정보 응답:', detailResponse);
      console.log('✅ 사업자 거래내역 응답:', transactionResponse);
      
      // 1️⃣ 상세정보 데이터 처리 (새로운 API 응답 구조)
      const detailData = detailResponse.data || {};
      
      // 기본 정보만 API에서 받아오고, 나머지는 initialData에서 가져옴
      const basicInfo = {
        userPassword: detailData.userPassword || '',
        userName: detailData.userName || '',
        userBirthday: detailData.userBirthday || '',
        userGenderIndex: detailData.userGenderIndex || null,
      };
      
      // 조직 정보는 initialData에서 가져옴 (API에서 제공하지 않음)
      const organizationInfo = {
        name: initialData?.name || initialData?.businessUserName || initialData?.BusinessUsername || '',
        userId: initialData?.BusinessUserId || initialData?.businessUserId || businessManId,
        grade: initialData?.businessGradeName || '',
        area: initialData?.businessAreaName || '',
        parent: initialData?.bossUserId || null,
        totalStore: initialData?.totalStore || 0,
        totalCm: initialData?.totalCm || 0,
      };
      
      
      // 메모 정보는 initialData에서 가져옴 (API에서 제공하지 않음)
      const memoInfo = {
        notes: initialData?.notes || '',
      };
      
      // 2️⃣ 거래내역 데이터 처리 (새로운 API 응답 구조)
      const transactionData = (transactionResponse.data || []).map((item, index) => {
        console.log(`🔄 거래내역 아이템 ${index + 1}:`, item);
        
        return {
          id: index + 1,
          temporaryStoreMasterDistributionTime: item.temporaryStoreMasterDistributionTime || null,
          temporaryStoreMasterIndexName: item.temporaryStoreMasterIndexName || null,
          temporaryStoreCmValue: item.temporaryStoreCmValue || 0,
          // 원본 데이터도 유지
          ...item
        };
      });
      
      console.log('📊 최종 거래내역 데이터:', transactionData);
      
      // 3️⃣ 통합된 데이터 설정
      const finalData = {
        ...initialData,
        ...basicInfo,
        ...organizationInfo,
        ...memoInfo,
      };
      
      setBusinessManData(finalData);
      setEditData(finalData);
      setTransactionHistory(transactionData);
      
    } catch (error) {
      console.error('🚨 사업자 데이터 로딩 실패:', error);
      setBusinessManData(initialData || {});
      setEditData(initialData || {});
      setTransactionHistory([]);
    } finally {
      setLoading(false);
      setTransactionLoading(false);
    }
  };



  // 수정 모드 토글
  const handleEditToggle = () => {
    if (editMode) {
      // 수정 취소 - 원래 데이터로 되돌리기
      setEditData(businessManData);
    }
    setEditMode(!editMode);
  };

  // 데이터 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 백엔드 API에 맞는 데이터 구조로 변환
      const updateData = {};
      
      // 변경된 필드만 포함
      if (editData.userPassword !== businessManData.userPassword) {
        updateData.userPassword = editData.userPassword;
      }
      if (editData.userName !== businessManData.userName) {
        updateData.userName = editData.userName;
      }
      if (editData.userBirthday !== businessManData.userBirthday) {
        updateData.userBirthday = editData.userBirthday;
      }
      if (editData.userGenderIndex !== businessManData.userGenderIndex) {
        updateData.userGenderIndex = editData.userGenderIndex;
      }
      
      console.log('💾 사업자 정보 저장:', updateData);
      
      setupInterceptors();
      const response = await updateBusinessMan(businessManId, updateData);
      console.log('✅ 사업자 정보 저장 완료:', response);
      
      // 성공 시 로컬 데이터 업데이트
      setBusinessManData(prev => ({
        ...prev,
        ...updateData
      }));
      setEditMode(false);
      alert('사업자 정보가 성공적으로 저장되었습니다.');
      
    } catch (error) {
      console.error('🚨 사업자 정보 저장 실패:', error);
      alert(`저장 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 필드 값 변경
  const handleFieldChange = (key, value) => {
    setEditData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 모달 닫기
  const handleClose = () => {
    if (editMode) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
        setEditMode(false);
        setEditData(businessManData);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 커스텀 컨텐츠 렌더링
  const renderCustomContent = () => {
    if (loading) {
      return (
        <div className="detail-modal-loading">
          사업자 상세정보 로딩 중...
        </div>
      );
    }

    const displayData = editMode ? editData : businessManData;

    return (
      <div className="detail-modal-fields">
        {/* 기본 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            기본 정보
          </h3>
          
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              이름
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="text"
                  value={displayData.userName || displayData.name || displayData.businessUserName || displayData.BusinessUsername || ''}
                  onChange={(e) => handleFieldChange('userName', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.userName || displayData.name || displayData.businessUserName || displayData.BusinessUsername || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              사업자 ID
            </div>
            <div className="detail-modal-field-value">
              {displayData.userId || displayData.BusinessUserId || displayData.key || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              비밀번호
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="password"
                  value={displayData.userPassword || ''}
                  onChange={(e) => handleFieldChange('userPassword', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="새 비밀번호 입력"
                />
              ) : (
                '********'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              생년월일
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="date"
                  value={(() => {
                    const date = parseDate(displayData.userBirthday);
                    return date ? date.toISOString().split('T')[0] : '';
                  })()}
                  onChange={(e) => handleFieldChange('userBirthday', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                formatDate(displayData.userBirthday, false)
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              성별
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <select
                  value={displayData.userGenderIndex || ''}
                  onChange={(e) => handleFieldChange('userGenderIndex', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">선택하세요</option>
                  <option value="1">남성</option>
                  <option value="2">여성</option>
                </select>
              ) : (
                Number(displayData.userGenderIndex) === 1 ? '남성' : 
                Number(displayData.userGenderIndex) === 2 ? '여성' : '-'
              )}
            </div>
          </div>
        </div>

        {/* 조직 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            조직 정보
          </h3>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              등급
            </div>
            <div className="detail-modal-field-value">
              {displayData.grade || displayData.businessGradeName || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              담당구역
            </div>
            <div className="detail-modal-field-value">
              {displayData.area || displayData.businessAreaName || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              조직 위치
            </div>
            <div className="detail-modal-field-value">
              {displayData.parent || displayData.bossUserId ? 
                `상급자 ID: ${displayData.parent || displayData.bossUserId}` : 
                '최고 책임자'
              }
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              하위 직원 수
            </div>
            <div className="detail-modal-field-value">
              {(displayData.totalSubordinates || 0).toLocaleString()}명
            </div>
          </div>
        </div>

        {/* 수당 지급 내역 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            수당 지급 내역
          </h3>
          
          {/* 수당 요약 정보 */}
          <div className="store-detail-transaction-summary">
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">개인 담당 가맹점</span>
              <span className="store-detail-summary-value">
                {(displayData.currentTotalStore || displayData.totalStore || 0).toLocaleString()}개
              </span>
            </div>
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">총 수당 지급 금액</span>
              <span className="store-detail-summary-value currency">
                {transactionHistory.reduce((sum, item) => sum + (item.temporaryStoreCmValue || 0), 0).toLocaleString()}원
              </span>
            </div>
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">총 수당 지급 건수</span>
              <span className="store-detail-summary-value">
                {transactionHistory.length.toLocaleString()}건
              </span>
            </div>
          </div>

          {/* 거래 내역 DataGrid */}
          <div className="store-detail-transaction-grid">
            <Box sx={{ height: 350, width: '100%' }}>
              <DataGrid
                rows={transactionHistory}
                columns={transactionColumns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 }
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                loading={transactionLoading}
                disableRowSelectionOnClick
                density="compact"
                slots={{
                  noRowsOverlay: () => (
                    <NoRowsOverlay loading={transactionLoading} />
                  ),
                }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    fontSize: '13px',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: '#f8f9fa',
                  },
                }}
              />
            </Box>
          </div>
        </div>


        {/* 메모 섹션 */}
        <div>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            메모
          </h3>

          {/* 사업자 메모 */}
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              사업자 메모
            </div>
            <div className="detail-modal-field-value">
              {displayData.notes || '등록된 메모가 없습니다.'}
            </div>
          </div>

          {/* 최근 수당 지급 정보 */}
          <div className="detail-modal-field" style={{ marginTop: '16px' }}>
            <div className="detail-modal-field-label">
              최근 수당 지급 정보
            </div>
            <div className="detail-modal-field-value">
              {transactionHistory.length > 0 ? (
                <div className="store-detail-recent-transaction-memo">
                  <div className="recent-memo-content">
                    {transactionHistory[0].temporaryStoreMasterIndexName}님에게 {(transactionHistory[0].temporaryStoreCmValue || 0).toLocaleString()}원 지급
                  </div>
                  <div className="recent-memo-time">
                    {formatDate(transactionHistory[0]?.temporaryStoreMasterDistributionTime)}
                  </div>
                </div>
              ) : (
                '최근 수당 지급 내역이 없습니다.'
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 커스텀 푸터 버튼들
  const renderFooterButtons = () => {
    if (loading) return null;

    return (
      <>
        {editMode ? (
          <>
            <button
              className="detail-modal-btn detail-modal-btn-secondary"
              onClick={handleEditToggle}
              disabled={saving}
            >
              취소
            </button>
            <button
              className="detail-modal-btn detail-modal-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        ) : (
          <>
            <button
              className="detail-modal-btn detail-modal-btn-secondary"
              onClick={handleClose}
            >
              닫기
            </button>
            <button
              className="detail-modal-btn detail-modal-btn-primary"
              onClick={handleEditToggle}
            >
              수정
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`사업자 상세 정보 ${editMode ? '(수정 모드)' : ''}`}
      customContent={renderCustomContent()}
      customFooter={
        <div className="detail-modal-footer">
          {renderFooterButtons()}
        </div>
      }
    />
  );
};

export default BusinessManDetailModal; 