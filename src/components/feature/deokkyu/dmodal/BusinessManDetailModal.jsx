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
 * 1. GET /businessman/detail/:businessManId
 *    기본정보 필드:
 *    - userPassword: 비밀번호 (users 테이블)
 *    - userBirthday: 생년월일 (user_tesseris 테이블)
 *    - userGenderIndex: 성별 인덱스 (user_tesseris 테이블)
 * 
 * 2. GET /businessman/transaction-history/:businessManId
 *    - user_cm_log 테이블에서 user_index_event_party = businessManId 조건으로 조회
 *    - JOIN user_cm_log_payment ON user_cm_log.user_cm_log_payment_index = user_cm_log_payment.id
 *    - JOIN user_cm_log_transaction_type ON user_cm_log.user_cm_log_transaction_type_index = user_cm_log_transaction_type.id
 *    
 *    거래내역 응답 필드:
 *    - userCmLogCreateTime: 거래 발생 시간 (user_cm_log 테이블)
 *    - userCmLogPaymentName: 거래 종류명 (user_cm_log_payment 테이블)
 *    - userCmLogTransactionTypeName: 거래 타입명 (user_cm_log_transaction_type 테이블)
 *    - userIndexEventTrigger: 거래 요청인 (user_cm_log 테이블)
 *    - amount: 거래 금액
 *    - userCmLogReason: 거래 메모 (user_cm_log 테이블) - 메모 섹션에서 사용
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

  // 거래내역 컬럼 정의
  const transactionColumns = [
    { 
      field: 'userCmLogCreateTime', 
      headerName: '거래 발생 시간', 
      width: 150,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return '-';
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return '-';
          return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          console.error('거래 시간 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'userCmLogPaymentName', 
      headerName: '거래 종류', 
      width: 120,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return '-';
          return String(params.value);
        } catch (error) {
          console.error('거래 종류 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'userCmLogTransactionTypeName', 
      headerName: '거래 타입', 
      width: 140,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return '-';
          return String(params.value);
        } catch (error) {
          console.error('거래 타입 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'userIndexEventTrigger', 
      headerName: '거래 요청인', 
      width: 120,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return '-';
          return String(params.value);
        } catch (error) {
          console.error('거래 요청인 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'amount', 
      headerName: '거래 금액', 
      width: 130,
      valueFormatter: (params) => {
        try {
          if (!params || params.value === null || params.value === undefined) return '-';
          const amount = Number(params.value);
          if (isNaN(amount)) return '-';
          return `${amount.toLocaleString()}원`;
        } catch (error) {
          console.error('거래 금액 포맷 오류:', error);
          return '-';
        }
      }
    },
    { 
      field: 'userCmLogReason', 
      headerName: '거래 메모', 
      width: 200,
      valueFormatter: (params) => {
        try {
          if (!params || !params.value) return '-';
          return String(params.value);
        } catch (error) {
          console.error('거래 메모 포맷 오류:', error);
          return '-';
        }
      }
    }
  ];

  // 상세 정보 로딩
  useEffect(() => {
    if (isOpen && businessManId && (!businessManData.key || businessManData.key !== businessManId)) {
      fetchBusinessManDetail();
      fetchTransactionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, businessManId]);

  // 거래내역 불러오기
  const fetchTransactionHistory = async () => {
    try {
      setTransactionLoading(true);
      console.log('🔍 사업자 거래내역 요청:', businessManId);
      
      setupInterceptors();
      const response = await getBusinessManTransactionHistory(businessManId);
      console.log('✅ 사업자 거래내역 응답:', response);
      
      const transactionData = (response.data || []).map((item, index) => ({
        id: index + 1,
        userCmLogCreateTime: item.userCmLogCreateTime || null,
        userCmLogPaymentName: item.userCmLogPaymentName || null,
        userCmLogTransactionTypeName: item.userCmLogTransactionTypeName || null,
        userIndexEventTrigger: item.userIndexEventTrigger || null,
        amount: item.amount || 0,
        userCmLogReason: item.userCmLogReason || null,
        ...item
      }));
      
      setTransactionHistory(transactionData);
      
    } catch (error) {
      console.error('🚨 사업자 거래내역 로딩 실패:', error);
      setTransactionHistory([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  const fetchBusinessManDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 사업자 상세정보 요청:', businessManId);
      
      setupInterceptors();
      const response = await getBusinessManDetail(businessManId);
      console.log('✅ 사업자 상세정보 응답:', response);
      
      const detailData = {
        ...initialData,
        ...response.data,
        // 백엔드에서 받아온 실제 데이터들
        userPassword: response.data.userPassword || '',
        userBirthday: response.data.userBirthday || '',
        userGenderIndex: response.data.userGenderIndex || null,
        // 기존 필드들 (백엔드에 없으면 제거 예정)
        email: response.data.email || '',
        address: response.data.address || '',
        joinDate: response.data.joinDate || '',
        lastLoginDate: response.data.lastLoginDate || '',
        totalSubordinates: response.data.totalSubordinates || 0,
        thisMonthPerformance: response.data.thisMonthPerformance || 0,
        lastMonthPerformance: response.data.lastMonthPerformance || 0,
        notes: response.data.notes || ''
      };
      
      setBusinessManData(detailData);
      setEditData(detailData);
      
    } catch (error) {
      console.error('🚨 사업자 상세정보 로딩 실패:', error);
      // 에러 시 초기 데이터 사용
      setBusinessManData(initialData || {});
      setEditData(initialData || {});
    } finally {
      setLoading(false);
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
      console.log('💾 사업자 정보 저장:', editData);
      
      setupInterceptors();
      const response = await updateBusinessMan(businessManId, editData);
      console.log('✅ 사업자 정보 저장 완료:', response);
      
      setBusinessManData(editData);
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
                  value={displayData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.name || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              사업자 ID
            </div>
            <div className="detail-modal-field-value">
              {displayData.userId || '-'}
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
                  value={displayData.userBirthday ? displayData.userBirthday.split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('userBirthday', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.userBirthday ? new Date(displayData.userBirthday).toLocaleDateString('ko-KR') : '-'
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
                  onChange={(e) => handleFieldChange('userGenderIndex', e.target.value)}
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
              {editMode ? (
                <select
                  value={displayData.grade || ''}
                  onChange={(e) => handleFieldChange('grade', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">선택하세요</option>
                  <option value="총재">총재</option>
                  <option value="부총재">부총재</option>
                  <option value="단장">단장</option>
                  <option value="A등급">A등급</option>
                  <option value="B등급">B등급</option>
                  <option value="C등급">C등급</option>
                  <option value="D등급">D등급</option>
                </select>
              ) : (
                displayData.grade || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              담당구역
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="text"
                  value={displayData.area || ''}
                  onChange={(e) => handleFieldChange('area', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.area || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              조직 위치
            </div>
            <div className="detail-modal-field-value">
              {displayData.parent ? `상급자 ID: ${displayData.parent}` : '최고 책임자'}
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

        {/* 거래 내역 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            거래 내역
          </h3>
          
          {/* 거래 요약 정보 */}
          <div className="store-detail-transaction-summary">
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">개인 담당 가맹점</span>
              <span className="store-detail-summary-value">
                {(displayData.currentTotalStore || 0).toLocaleString()}개
              </span>
            </div>
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">총 수당</span>
              <span className="store-detail-summary-value currency">
                {(displayData.allowance || 0).toLocaleString()}원
              </span>
            </div>
            <div className="store-detail-summary-item">
              <span className="store-detail-summary-label">총 거래 건수</span>
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
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
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
              {editMode ? (
                <textarea
                  value={displayData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  placeholder="사업자 메모를 입력하세요..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.notes || '등록된 메모가 없습니다.'
              )}
            </div>
          </div>

          {/* 최근 거래 메모 */}
          <div className="detail-modal-field" style={{ marginTop: '16px' }}>
            <div className="detail-modal-field-label">
              최근 거래 메모
            </div>
            <div className="detail-modal-field-value">
              {transactionHistory.length > 0 && transactionHistory[0].userCmLogReason ? (
                <div className="store-detail-recent-transaction-memo">
                  <div className="recent-memo-content">
                    {transactionHistory[0].userCmLogReason}
                  </div>
                  <div className="recent-memo-time">
                    {transactionHistory[0].userCmLogCreateTime ? 
                      new Date(transactionHistory[0].userCmLogCreateTime).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''
                    }
                  </div>
                </div>
              ) : (
                '최근 거래 메모가 없습니다.'
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