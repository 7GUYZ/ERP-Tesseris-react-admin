import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { getStoreDetail, updateStore, getStoreTransactionHistory, setupInterceptors } from '../../../../api/auth/DeokkyuAuth';
import DetailModal from '../../../ui/deokkyu/DetailModal';
import NoRowsOverlay from '../../../ui/deokkyu/NoRowsOverlay';

/**
 * 가맹점 상세정보 모달
 * 
 * 백엔드 API 요구사항:
 * 1. GET /store/transaction-history/:userId
 *    - user_cm_log 테이블에서 user_index_event_party = user_index 조건으로 조회
 *    - JOIN user_cm_log_payment ON user_cm_log.user_cm_log_payment_index = user_cm_log_payment.id
 *    - JOIN user_cm_log_transaction_type ON user_cm_log.user_cm_log_transaction_type_index = user_cm_log_transaction_type.id
 *    
 *    응답 필드:
 *    - userCmLogCreateTime: 거래 발생 시간
 *    - userCmLogPaymentName: 거래 종류명 (user_cm_log_payment.user_cm_log_payment_name)
 *    - userCmLogTransactionTypeName: 거래 타입명 (user_cm_log_transaction_type.user_cm_log_transaction_type_name)
 *    - userIndexEventTriggerId: 거래 요청인
 *    - amount: 거래 금액
 *    - userCmLogReason: 거래 메모
 */

const StoreDetailModal = ({ isOpen, onClose, storeId, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [storeData, setStoreData] = useState(initialData || {});
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
      width: 180,
      valueFormatter: (params) => {
        // params.value가 없으면 params.row에서 직접 가져오기
        let dateValue = params.value || params.row?.userCmLogCreateTime;
        
        if (!dateValue) {
          return '-';
        }
        
        if (dateValue instanceof Date) {
          return dateValue.toLocaleString('ko-KR');
        }
        
        // 배열 형태 [2025, 7, 21, 3, 55, 38]인 경우
        if (Array.isArray(dateValue) && dateValue.length >= 6) {
          const [year, month, day, hour, minute, second] = dateValue;
          const date = new Date(year, month - 1, day, hour, minute, second);
          return date.toLocaleString('ko-KR');
        }
        
        return String(dateValue);
      }
    },
    { 
      field: 'userCmLogPaymentName', 
      headerName: '거래 종류', 
      width: 120
    },
    { 
      field: 'userCmLogTransactionTypeName', 
      headerName: '거래 타입', 
      width: 140
    },
    { 
      field: 'userIndexEventTriggerId', 
      headerName: '거래 요청인', 
      width: 120
    },
    { 
      field: 'userCmLogValue', 
      headerName: '거래 금액', 
      width: 130,
      valueFormatter: (params) => {
        if (!params || params.value === null || params.value === undefined) {
          return '-';
        }
        const amount = Number(params.value);
        if (isNaN(amount)) {
          return '-';
        }
        return `${amount.toLocaleString()}원`;
      }
    },
    { 
      field: 'userCmLogReason', 
      headerName: '거래 메모', 
      width: 200
    }
  ];

  // 상세 정보 로딩
  useEffect(() => {
    if (isOpen && storeId && (!storeData.userId || storeData.userId !== storeId)) {
      fetchStoreDetail();
      fetchTransactionHistory();
    }
  }, [isOpen, storeId]);

  // 거래내역 불러오기
  const fetchTransactionHistory = async () => {
    try {
      setTransactionLoading(true);
      console.log('🔍 거래내역 요청:', storeId);
      
      setupInterceptors();
      const response = await getStoreTransactionHistory(storeId);
      console.log('✅ 거래내역 응답:', response.data);

      if (!Array.isArray(response.data)) {
        console.error('🚨 응답이 배열이 아님:', response.data);
        return;
      }
      
      const transactionData = (response.data || []).map((item, index) => {
        // 날짜 배열 [2025, 7, 21, 3, 55, 38] -> Date 객체로 변환
        let createTime = null;
        if (Array.isArray(item.userCmLogCreateTime) && item.userCmLogCreateTime.length >= 6) {
          const [year, month, day, hour, minute, second] = item.userCmLogCreateTime;
          createTime = new Date(year, month - 1, day, hour, minute, second); // month는 0부터 시작
        } else if (item.userCmLogCreateTime) {
          createTime = new Date(item.userCmLogCreateTime);
        }

        return {
          id: index + 1,
          userCmLogCreateTime: createTime,
          userCmLogPaymentName: item.userCmLogPaymentName || null,
          userCmLogTransactionTypeName: item.userCmLogTransactionTypeName || null,
          userIndexEventTriggerId: item.userIndexEventTriggerId || null,
          userCmLogValue: item.userCmLogValue || 0,
          userCmLogReason: item.userCmLogReason || null,
          ...item
        };
      });
      
      setTransactionHistory(transactionData);
      
    } catch (error) {
      console.error('🚨 거래내역 로딩 실패:', error);
      setTransactionHistory([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  // 추가 정보 둘러오기 
  const fetchStoreDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 가맹점 상세정보 요청:', storeId);
      
      setupInterceptors();
      const response = await getStoreDetail(storeId);
      console.log('✅가맹점 상세정보 응답:', response);
      
      const detailData = {
        ...initialData,
        // 사용자 기본 정보 (users 테이블)
        userPassword: response.data.userPassword || '',
        // 사용자 상세 정보 (user_tesseris 테이블)
        userBirthday: response.data.userBirthday || '',
        userGenderIndex: response.data.userGenderIndex || 0,
        // 가맹점 사진 정보들 (store 테이블)
        storeProntPhoto: response.data.storeProntPhoto || '',
        storeBusinessLicensePhoto: response.data.storeBusinessLicensePhoto || '',
        storeSignPhoto: response.data.storeSignPhoto || ''
      };
      
      setStoreData(detailData);
      setEditData(detailData);
      
    } catch (error) {
      console.error('🚨 가맹점 상세정보 로딩 실패:', error);
      setStoreData(initialData || {});
      setEditData(initialData || {});
    } finally {
      setLoading(false);
    }
  };

  // 수정 모드 토글
  const handleEditToggle = () => {
    if (editMode) {
      setEditData(storeData);
    }
    setEditMode(!editMode);
  };

  // 데이터 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 가맹점 정보 저장:', editData);
      
      setupInterceptors();
      const response = await updateStore(storeId, editData);
      console.log('✅ 가맹점 정보 저장 완료:', response);
      
      setStoreData(editData);
      setEditMode(false);
      alert('가맹점 정보가 성공적으로 저장되었습니다.');
      
    } catch (error) {
      console.error('🚨 가맹점 정보 저장 실패:', error);
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

  // 사진 업로드 핸들러
  const handlePhotoUpload = (photoType) => {
    console.log(`📷 ${photoType} 사진 업로드 요청`);
    // TODO: 파일 선택 및 업로드 로직 구현
    alert(`${photoType === 'exterior' ? '외관' : photoType === 'interior' ? '내부' : '사업자 등록증'} 사진 업로드 기능은 개발 예정입니다.`);
  };

  // 모달 닫기
  const handleClose = () => {
    if (editMode) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
        setEditMode(false);
        setEditData(storeData);
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
          가맹점 상세정보 로딩 중...
        </div>
      );
    }

    const displayData = editMode ? editData : storeData;

    return (
      <div className="store-detail-modal-container">
        {/* 2열 레이아웃 컨테이너 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* 왼쪽 컬럼 */}
          <div>
            {/* 기본 정보 섹션 */}
            <div className="store-detail-section">
              <h3 className="store-detail-section-title">기본 정보</h3>
              <div className="store-detail-fields">
                <div className="store-detail-field">
                  <label className="store-detail-label">가맹점 ID</label>
                  <div className="store-detail-value">{displayData.userId || '-'}</div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">회원 이름</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="text"
                        value={displayData.userName || ''}
                        onChange={(e) => handleFieldChange('userName', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.userName || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">핸드폰 번호</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="tel"
                        value={displayData.userPhone || ''}
                        onChange={(e) => handleFieldChange('userPhone', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.userPhone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">비밀번호</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="password"
                        value={displayData.userPassword || ''}
                        onChange={(e) => handleFieldChange('userPassword', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.userPassword ? '**********' : '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">생년월일</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="date"
                        value={displayData.userBirthday || ''}
                        onChange={(e) => handleFieldChange('userBirthday', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.userBirthday || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">성별</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <select
                        value={displayData.userGenderIndex || ''}
                        onChange={(e) => handleFieldChange('userGenderIndex', e.target.value)}
                        className="store-detail-select"
                      >
                        <option value="">선택하세요</option>
                        <option value="1">남자</option>
                        <option value="2">여자</option>
                        <option value="3">선택 안함</option>
                      </select>
                    ) : (
                      displayData.userGenderIndex === 1 ? '남자' : displayData.userGenderIndex === 2 ? '여자' : '선택 안함'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 가맹점 정보 섹션 */}
            <div className="store-detail-section">
              <h3 className="store-detail-section-title">가맹점 정보</h3>
              <div className="store-detail-fields">
                <div className="store-detail-field">
                  <label className="store-detail-label">가맹점 명</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="text"
                        value={displayData.storeName || ''}
                        onChange={(e) => handleFieldChange('storeName', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.storeName || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">상호명</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="text"
                        value={displayData.storeCorporateName || ''}
                        onChange={(e) => handleFieldChange('storeCorporateName', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.storeCorporateName || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">신청일</label>
                  <div className="store-detail-value">
                    {displayData.storeCreateDate ? new Date(displayData.storeCreateDate).toLocaleDateString('ko-KR') : '-'}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">대표자 이름</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="text"
                        value={displayData.storeBossName || ''}
                        onChange={(e) => handleFieldChange('storeBossName', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.storeBossName || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">사업자 등록번호</label>
                  <div className="store-detail-value">{displayData.storeRegistrationNum || '-'}</div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">세금 유형</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <select
                        value={displayData.storeTypeTaxation || ''}
                        onChange={(e) => handleFieldChange('storeTypeTaxation', e.target.value)}
                        className="store-detail-select"
                      >
                        <option value="">선택하세요</option>
                        <option value="일반과세">일반과세</option>
                        <option value="간이과세">간이과세</option>
                        <option value="면세">면세</option>
                      </select>
                    ) : (
                      displayData.storeTypeTaxation || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">가맹점 유형</label>
                  <div className="store-detail-value">{displayData.storeCategoryName || '-'}</div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">대표 번호</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <input
                        type="tel"
                        value={displayData.storePhone || ''}
                        onChange={(e) => handleFieldChange('storePhone', e.target.value)}
                        className="store-detail-input"
                      />
                    ) : (
                      displayData.storePhone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') || '-'
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">승인 여부</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <select
                        value={displayData.storeRequestStatusName || ''}
                        onChange={(e) => handleFieldChange('storeRequestStatusName', e.target.value)}
                        className="store-detail-select"
                      >
                        <option value="">선택하세요</option>
                        <option value="승인">승인</option>
                        <option value="대기">대기</option>
                        <option value="거절">거절</option>
                        <option value="보류">보류</option>
                        <option value="해지">해지</option>
                      </select>
                    ) : (
                      <span className={`status-${displayData.storeRequestStatusName === '승인' ? 'active' : 
                                                 displayData.storeRequestStatusName === '대기' ? 'pending' : 'inactive'}`}>
                        {displayData.storeRequestStatusName || '-'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="store-detail-field">
                  <label className="store-detail-label">거래 상태</label>
                  <div className="store-detail-value">
                    {editMode ? (
                      <select
                        value={displayData.storeTransactionStatus || ''}
                        onChange={(e) => handleFieldChange('storeTransactionStatus', e.target.value)}
                        className="store-detail-select"
                      >
                        <option value="">선택하세요</option>
                        <option value="정상">정상</option>
                        <option value="정지">정지</option>
                      </select>
                    ) : (
                      <span className={`status-${displayData.storeTransactionStatus === '정상' ? 'active' : 'inactive'}`}>
                        {displayData.storeTransactionStatus || '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div>
            {/* 거래 내역 섹션 */}
            <div className="store-detail-section">
              <h3 className="store-detail-section-title">거래 내역 ({transactionHistory.length}건)</h3>
              
              {/* 거래 요약 정보 */}
              <div className="store-detail-transaction-summary">
                <div className="store-detail-summary-item">
                  <span className="store-detail-summary-label">초기지급 CMP</span>
                  <span className="store-detail-summary-value currency">
                    {(displayData.userCmpInit || 0).toLocaleString()}원
                  </span>
                </div>
                <div className="store-detail-summary-item">
                  <span className="store-detail-summary-label">보유 CM</span>
                  <span className="store-detail-summary-value currency">
                    {(displayData.totalCM || 0).toLocaleString()}원
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
                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                  총 {transactionHistory.length}건의 거래내역
                </div>
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

            {/* 사진 섹션 */}
            <div className="store-detail-section">
              <h3 className="store-detail-section-title">사진</h3>
              <div className="store-detail-photo-section">
                
                
                {/* 가맹점 프론트 사진 */}
                <div className="store-detail-photo-item">
                  <h4 className="store-detail-photo-title">가맹점 프론트</h4>
                  <div className="store-detail-photo-placeholder">
                    {displayData.storeProntPhoto ? (
                      <>
                        <img
                          src={displayData.storeProntPhoto}
                          alt="가맹점 프론트" 
                          className="store-detail-photo-image"
                        />
                        <div className="store-detail-photo-string">
                          <small>String 값: {displayData.storeProntPhoto}</small>
                        </div>
                      </>
                    ) : (
                      <div className="store-detail-photo-empty">
                        <p>가맹점 프론트 사진이 등록되지 않았습니다.</p>
                        {editMode && (
                          <button 
                            className="store-detail-photo-upload-btn"
                            onClick={() => handlePhotoUpload('pront')}
                          >
                            사진 업로드
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 사업자 등록증 사진 (새로운 필드) */}
                <div className="store-detail-photo-item">
                  <h4 className="store-detail-photo-title">사업자 등록증 (새로운)</h4>
                  <div className="store-detail-photo-placeholder">
                    {displayData.storeBusinessLicensePhoto ? (
                      <>
                        <img 
                          src={displayData.storeBusinessLicensePhoto} 
                          alt="사업자 등록증 (새로운)" 
                          className="store-detail-photo-image"
                        />
                        <div className="store-detail-photo-string">
                          <small>String 값: {displayData.storeBusinessLicensePhoto}</small>
                        </div>
                      </>
                    ) : (
                      <div className="store-detail-photo-empty">
                        <p>사업자 등록증 (새로운) 사진이 등록되지 않았습니다.</p>
                        {editMode && (
                          <button 
                            className="store-detail-photo-upload-btn"
                            onClick={() => handlePhotoUpload('businessLicenseNew')}
                          >
                            사진 업로드
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 가맹점 서명 사진 */}
                <div className="store-detail-photo-item">
                  <h4 className="store-detail-photo-title">가맹점 서명</h4>
                  <div className="store-detail-photo-placeholder">
                    {displayData.storeSignPhoto ? (
                      <>
                        <img 
                          src={displayData.storeSignPhoto} 
                          alt="가맹점 서명" 
                          className="store-detail-photo-image"
                        />
                        <div className="store-detail-photo-string">
                          <small>String 값: {displayData.storeSignPhoto}</small>
                        </div>
                      </>
                    ) : (
                      <div className="store-detail-photo-empty">
                        <p>가맹점 서명 사진이 등록되지 않았습니다.</p>
                        {editMode && (
                          <button 
                            className="store-detail-photo-upload-btn"
                            onClick={() => handlePhotoUpload('sign')}
                          >
                            사진 업로드
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* 하단 메모 영역 */}
        <div className="store-detail-section" style={{ marginTop: '24px' }}>
          <h3 className="store-detail-section-title">메모</h3>
          
          {/* 가맹점 메모 */}
          <div className="store-detail-field">
            <label className="store-detail-label">가맹점 메모</label>
            <div className="store-detail-value">
              {editMode ? (
                <textarea
                  value={displayData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={3}
                  placeholder="가맹점 메모를 입력하세요..."
                  className="store-detail-textarea"
                />
              ) : (
                displayData.notes || '등록된 메모가 없습니다.'
              )}
            </div>
          </div>

          {/* 최근 거래 메모 */}
          <div className="store-detail-field" style={{ marginTop: '16px' }}>
            <label className="store-detail-label">최근 거래 메모</label>
            <div className="store-detail-value">
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
              {saving ? '저장 중...' : '💾 저장'}
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
              ✏️ 수정
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
      title={`가맹점 상세 정보 ${editMode ? '(수정 모드)' : ''}`}
      customContent={renderCustomContent()}
      customFooter={
        <div className="detail-modal-footer">
          {renderFooterButtons()}
        </div>
      }
    />
  );
};

export default StoreDetailModal; 