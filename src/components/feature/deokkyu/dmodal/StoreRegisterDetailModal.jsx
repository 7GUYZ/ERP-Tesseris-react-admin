import React, { useState, useEffect } from 'react';
import { getStoreRegisterDetail, updateStoreRegister, setupInterceptors } from '../../../../api/auth/DeokkyuAuth';
import DetailModal from '../../../ui/deokkyu/DetailModal';

// 이미지 컴포넌트
const ImageWithLoading = ({ src, alt, style, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
    if (onError) onError();
  };

  if (!src) return null;

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: '#6c757d',
            fontSize: '0.9em'
          }}>
            🔄 로딩 중...
          </div>
        )}
        {!error && (
          <img 
            src={src} 
            alt={alt}
            style={{ 
              ...style,
              cursor: 'pointer',
              opacity: loading ? 0.3 : 1,
              transition: 'opacity 0.3s'
            }}
            onLoad={handleLoad}
            onError={handleError}
            onClick={() => setEnlarged(true)}
            title="클릭하면 크게 볼 수 있습니다"
          />
        )}
        {error && (
          <div style={{ 
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '4px',
            color: '#6c757d',
            fontSize: '0.9em'
          }}>
            🖼️ 이미지를 불러올 수 없습니다
          </div>
        )}
      </div>

      {/* 확대 모달 */}
      {enlarged && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setEnlarged(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={src} 
              alt={alt}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={() => setEnlarged(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const StoreRegisterDetailModal = ({ isOpen, onClose, storeId, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [storeData, setStoreData] = useState(initialData || {});
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // 상세 정보 로딩
  useEffect(() => {
    if (isOpen && storeId && (!storeData.userId || storeData.userId !== storeId)) {
      fetchStoreRegisterDetail();
    }
  }, [isOpen, storeId]);

  const fetchStoreRegisterDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 가맹점 신청 상세정보 요청:', storeId);
      
      setupInterceptors();
      const response = await getStoreRegisterDetail(storeId);
      console.log('✅ 가맹점 신청 상세정보 응답:', response);
      
      // ✅ null 값 제거 함수
      const removeNullValues = (obj) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };

      // ✅ response.data에서 null이 아닌 값들만 추출
      const cleanedResponseData = removeNullValues(response.data);
      
      console.log('🧹 정리된 response.data:', cleanedResponseData);

      const detailData = {
        ...initialData,
        ...cleanedResponseData,  // null 값들을 제거한 데이터만 병합
        // 추가로 받아온 상세 정보들 (null 체크 포함)
        applicationMemo: response.data.applicationMemo || initialData.applicationMemo || '',
        rejectionReason: response.data.rejectionReason || initialData.rejectionReason || '',
        approvedBy: response.data.approvedBy || initialData.approvedBy || '',
        approvedDate: response.data.approvedDate || initialData.approvedDate || '',
        reviewNotes: response.data.reviewNotes || initialData.reviewNotes || '',
        contractDocument: response.data.contractDocument || initialData.contractDocument || '',
        businessLicense: response.data.businessLicense || initialData.businessLicense || '',
        accountInfo: response.data.accountInfo || initialData.accountInfo || '',
        emergencyContact: response.data.emergencyContact || initialData.emergencyContact || '',
        referralSource: response.data.referralSource || initialData.referralSource || '',
        expectedOpenDate: response.data.expectedOpenDate || initialData.expectedOpenDate || '',
        storeSize: response.data.storeSize || initialData.storeSize || '',
        employeeCount: response.data.employeeCount || initialData.employeeCount || 0,
        parkingSpaces: response.data.parkingSpaces || initialData.parkingSpaces || 0,
        hasDelivery: response.data.hasDelivery || initialData.hasDelivery || false,
        deliveryRadius: response.data.deliveryRadius || initialData.deliveryRadius || '',
        specialRequests: response.data.specialRequests || initialData.specialRequests || ''
      };
      
      console.log('📥 initialData:', initialData);
      console.log('📥 response.data:', response.data);
      console.log('📥 최종 detailData:', detailData);
      console.log('📥 storeRequestStatusName:', detailData.storeRequestStatusName);
      console.log('📥 storeRequestStatusIndex:', detailData.storeRequestStatusIndex);
      console.log('📥 store_request_status_index:', detailData.store_request_status_index);
      
      console.log('🖼️ 사진 URL 정보:');
      console.log('   - storeBusinessLicensePhoto:', detailData.storeBusinessLicensePhoto || 'NULL');
      console.log('   - storeSignPhoto:', detailData.storeSignPhoto || 'NULL');
      console.log('   - storeProntPhoto:', detailData.storeProntPhoto || 'NULL');
      
      setStoreData(detailData);
      setEditData(detailData);
      
    } catch (error) {
      console.error('🚨 가맹점 신청 상세정보 로딩 실패:', error);
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
      console.log('💾 가맹점 신청 정보 저장:', editData);
      
      setupInterceptors();
      const response = await updateStoreRegister(storeId, editData);
      console.log('✅ 가맹점 신청 정보 저장 완료:', response);
      
      setStoreData(editData);
      setEditMode(false);
      alert('가맹점 신청 정보가 성공적으로 저장되었습니다.');
      
    } catch (error) {
      console.error('🚨 가맹점 신청 정보 저장 실패:', error);
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
        setEditData(storeData);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 승인 처리
  const handleApprove = async () => {
    if (window.confirm('이 신청을 승인하시겠습니까?')) {
      try {
        setSaving(true);
        console.log('🔄 승인 처리 시작 - storeId:', storeId);
        
        // 현재 로그인한 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('admin-info') || '{}');
        const approvedBy = userInfo.username || userInfo.user_name || '관리자';
        
        // 승인 데이터 구성 (store_request_status_index = 2)
        const approvalData = {
          storeRequestStatusIndex: 2,  // 승인: 2
          store_request_status_index: 2,  // 두 가지 형태 모두 보냄
          storeRequestStatusName: '승인',
          approvedBy: approvedBy,
          approvedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
          reviewNotes: `${approvedBy}에 의해 승인됨`
        };
        
        console.log('📤 승인 데이터 전송:', approvalData);
        
        setupInterceptors();
        const response = await updateStoreRegister(storeId, approvalData);
        console.log('✅ 가맹점 승인 완료:', response);
        
        // 로컬 상태 업데이트
        const updatedData = {
          ...storeData,
          ...approvalData
        };
        setStoreData(updatedData);
        setEditData(updatedData);
        
        alert('가맹점 신청이 승인되었습니다.');
        
      } catch (error) {
        console.error('🚨 가맹점 승인 실패:', error);
        console.error('🚨 응답 데이터:', error.response?.data);
        console.error('🚨 응답 상태:', error.response?.status);
        
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        '알 수 없는 오류가 발생했습니다.';
        alert(`승인 실패: ${errorMsg}`);
      } finally {
        setSaving(false);
      }
    }
  };

  // 거절 처리
  const handleReject = async () => {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (reason && reason.trim()) {
      try {
        setSaving(true);
        console.log('🔄 거절 처리 시작 - storeId:', storeId);
        
        // 현재 로그인한 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('admin-info') || '{}');
        const approvedBy = userInfo.username || userInfo.user_name || '관리자';
        
        // 거절 데이터 구성 (store_request_status_index = 3)
        const rejectionData = {
          storeRequestStatusIndex: 3,  // 거절: 3
          store_request_status_index: 3,  // 두 가지 형태 모두 보냄
          storeRequestStatusName: '거절',
          rejectionReason: reason.trim(),
          approvedBy: approvedBy,
          approvedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
          reviewNotes: `${approvedBy}에 의해 거절됨: ${reason.trim()}`
        };
        
        console.log('📤 거절 데이터 전송:', rejectionData);
        
        setupInterceptors();
        const response = await updateStoreRegister(storeId, rejectionData);
        console.log('✅ 가맹점 거절 완료:', response);
        
        // 로컬 상태 업데이트
        const updatedData = {
          ...storeData,
          ...rejectionData
        };
        setStoreData(updatedData);
        setEditData(updatedData);
        
        alert('가맹점 신청이 거절되었습니다.');
        
      } catch (error) {
        console.error('🚨 가맹점 거절 실패:', error);
        console.error('🚨 응답 데이터:', error.response?.data);
        console.error('🚨 응답 상태:', error.response?.status);
        
        const errorMsg = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        '알 수 없는 오류가 발생했습니다.';
        alert(`거절 실패: ${errorMsg}`);
      } finally {
        setSaving(false);
      }
    } else if (reason !== null) {
      alert('거절 사유를 입력해주세요.');
    }
  };

  // 커스텀 컨텐츠 렌더링
  const renderCustomContent = () => {
    if (loading) {
      return (
        <div className="detail-modal-loading">
          🔄 가맹점 신청 상세정보 로딩 중...
        </div>
      );
    }

    const displayData = editMode ? editData : storeData;

    return (
      <div className="detail-modal-fields">
        {/* 신청 상태 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            📋 신청 상태
          </h3>
          
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">✅</span>
              승인 여부
            </div>
            <div className="detail-modal-field-value">
              <span className={`status-${displayData.storeRequestStatusName === '승인' ? 'active' : 
                                       displayData.storeRequestStatusName === '대기' ? 'pending' : 'inactive'}`}>
                {displayData.storeRequestStatusName || '대기'}
              </span>
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">📅</span>
              신청일
            </div>
            <div className="detail-modal-field-value">
              {displayData.storeCreateDate ? new Date(displayData.storeCreateDate).toLocaleDateString('ko-KR') : '-'}
            </div>
          </div>

          {displayData.approvedBy && (
            <div className="detail-modal-field">
              <div className="detail-modal-field-label">
                <span className="detail-modal-field-icon">👤</span>
                승인자
              </div>
              <div className="detail-modal-field-value">
                {displayData.approvedBy}
              </div>
            </div>
          )}

          {displayData.approvedDate && (
            <div className="detail-modal-field">
              <div className="detail-modal-field-label">
                <span className="detail-modal-field-icon">📆</span>
                승인일
              </div>
              <div className="detail-modal-field-value">
                {new Date(displayData.approvedDate).toLocaleDateString('ko-KR')}
              </div>
            </div>
          )}

          {displayData.rejectionReason && (
            <div className="detail-modal-field">
              <div className="detail-modal-field-label">
                <span className="detail-modal-field-icon">❌</span>
                거절 사유
              </div>
              <div className="detail-modal-field-value">
                {displayData.rejectionReason}
              </div>
            </div>
          )}
        </div>

        {/* 기본 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            🏪 기본 정보
          </h3>
          
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🆔</span>
              가맹점 ID
            </div>
            <div className="detail-modal-field-value">
              {displayData.userId || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">👤</span>
              신청자 이름
            </div>
            <div className="detail-modal-field-value">
              {displayData.userName || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">📞</span>
              핸드폰 번호
            </div>
            <div className="detail-modal-field-value">
              {displayData.userPhone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') || '-'}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🏬</span>
              가맹점 명
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="text"
                  value={displayData.storeName || ''}
                  onChange={(e) => handleFieldChange('storeName', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.storeName || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🏪</span>
              상호명
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <input
                  type="text"
                  value={displayData.storeCorporateName || ''}
                  onChange={(e) => handleFieldChange('storeCorporateName', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.storeCorporateName || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">👔</span>
              대표자 이름
            </div>
            <div className="detail-modal-field-value">
              {displayData.storeBossName || '-'}
            </div>
          </div>
        </div>

        {/* 사업자 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            🏢 사업자 정보
          </h3>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🏢</span>
              담당 사업자
            </div>
            <div className="detail-modal-field-value">
              {displayData.businessUserName || '-'} ({displayData.businessUserId || '-'})
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🏅</span>
              사업자 등급
            </div>
            <div className="detail-modal-field-value">
              {displayData.businessGradeName || '-'}
            </div>
          </div>
        </div>

        {/* 재정 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            💰 재정 정보
          </h3>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">💳</span>
              충전금액
            </div>
            <div className="detail-modal-field-value currency">
              {editMode ? (
                <input
                  type="number"
                  value={displayData.storeSubscriptionFeeValue || ''}
                  onChange={(e) => handleFieldChange('storeSubscriptionFeeValue', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                (displayData.storeSubscriptionFeeValue || 0).toLocaleString() + '원'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">💼</span>
              가맹비
            </div>
            <div className="detail-modal-field-value currency">
              {editMode ? (
                <input
                  type="number"
                  value={displayData.franchiseFee || ''}
                  onChange={(e) => handleFieldChange('franchiseFee', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                (displayData.franchiseFee || 0).toLocaleString() + '원'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">📊</span>
              분배여부
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <select
                  value={displayData.storeSubscriptionFeeCommissionCheck || ''}
                  onChange={(e) => handleFieldChange('storeSubscriptionFeeCommissionCheck', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">선택하세요</option>
                  <option value="완료">완료</option>
                  <option value="대기">대기</option>
                  <option value="보류">보류</option>
                </select>
              ) : (
                displayData.storeSubscriptionFeeCommissionCheck || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">💰</span>
              초기지급 CMP
            </div>
            <div className="detail-modal-field-value currency">
              {(displayData.userCmpInit || 0).toLocaleString()}원
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">💎</span>
              보유 TS
            </div>
            <div className="detail-modal-field-value currency">
              {(displayData.totalCM || 0).toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 📸 사진 정보 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            📸 업로드된 사진
          </h3>

          {/* 사업자등록증 사진 */}
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">📄</span>
              사업자등록증
            </div>
            <div className="detail-modal-field-value">
              {displayData.storeBusinessLicensePhoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ImageWithLoading
                    src={displayData.storeBusinessLicensePhoto} 
                    alt="사업자등록증"
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa'
                    }}
                  />
                  <a 
                    href={displayData.storeBusinessLicensePhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.9em', color: '#007bff' }}
                  >
                    🔗 원본 보기
                  </a>
                </div>
              ) : (
                <span style={{ color: '#6c757d' }}>업로드된 사진이 없습니다</span>
              )}
            </div>
          </div>

          {/* 간판 사진 */}
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🪧</span>
              간판 사진
            </div>
            <div className="detail-modal-field-value">
              {displayData.storeSignPhoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ImageWithLoading
                    src={displayData.storeSignPhoto} 
                    alt="간판 사진"
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa'
                    }}
                  />
                  <a 
                    href={displayData.storeSignPhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.9em', color: '#007bff' }}
                  >
                    🔗 원본 보기
                  </a>
                </div>
              ) : (
                <span style={{ color: '#6c757d' }}>업로드된 사진이 없습니다</span>
              )}
            </div>
          </div>

          {/* 외관 사진 */}
          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🏪</span>
              외관 사진
            </div>
            <div className="detail-modal-field-value">
              {displayData.storeProntPhoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ImageWithLoading
                    src={displayData.storeProntPhoto} 
                    alt="외관 사진"
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa'
                    }}
                  />
                  <a 
                    href={displayData.storeProntPhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.9em', color: '#007bff' }}
                  >
                    🔗 원본 보기
                  </a>
                </div>
              ) : (
                <span style={{ color: '#6c757d' }}>업로드된 사진이 없습니다</span>
              )}
            </div>
          </div>
        </div>

        {/* 기타 정보 섹션 */}
        <div>
          <h3 style={{ marginBottom: '16px', color: '#495057', borderBottom: '2px solid #e9ecef', paddingBottom: '8px' }}>
            📝 기타 정보
          </h3>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">📋</span>
              신청 메모
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <textarea
                  value={displayData.applicationMemo || ''}
                  onChange={(e) => handleFieldChange('applicationMemo', e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.applicationMemo || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🔍</span>
              검토 메모
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <textarea
                  value={displayData.reviewNotes || ''}
                  onChange={(e) => handleFieldChange('reviewNotes', e.target.value)}
                  rows={3}
                  placeholder="검토 의견을 입력하세요..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.reviewNotes || '-'
              )}
            </div>
          </div>

          <div className="detail-modal-field">
            <div className="detail-modal-field-label">
              <span className="detail-modal-field-icon">🎯</span>
              특별 요청사항
            </div>
            <div className="detail-modal-field-value">
              {editMode ? (
                <textarea
                  value={displayData.specialRequests || ''}
                  onChange={(e) => handleFieldChange('specialRequests', e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                displayData.specialRequests || '-'
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

    // 디버깅을 위한 상태 출력
    console.log('🔍 StoreRegisterDetailModal 전체 데이터:', storeData);
    console.log('🔍 storeRequestStatusName:', storeData.storeRequestStatusName);
    console.log('🔍 storeRequestStatusIndex:', storeData.storeRequestStatusIndex);
    console.log('🔍 store_request_status_index:', storeData.store_request_status_index);
    
    // 여러 가지 조건으로 체크
    const statusName = storeData.storeRequestStatusName;
    const statusIndex = storeData.storeRequestStatusIndex || storeData.store_request_status_index;
    
    const isApprovalPending = 
      statusName === '대기' || 
      statusName === '신청' || 
      statusName === '검토중' ||
      statusName === '승인대기' ||
      statusIndex === 1 ||
      statusIndex === '1';
      
    console.log('🔍 승인 대기 여부:', isApprovalPending);

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
            
            {isApprovalPending && (
              <>
                <button
                  className="detail-modal-btn"
                  style={{ background: '#dc3545', color: 'white' }}
                  onClick={handleReject}
                  disabled={saving}
                >
                  ❌ 거절
                </button>
                <button
                  className="detail-modal-btn"
                  style={{ background: '#28a745', color: 'white' }}
                  onClick={handleApprove}
                  disabled={saving}
                >
                  ✅ 승인
                </button>
              </>
            )}
            
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
      title={`가맹점 신청 상세 정보 ${editMode ? '(수정 모드)' : ''}`}
      customContent={renderCustomContent()}
      customFooter={
        <div className="detail-modal-footer">
          {renderFooterButtons()}
        </div>
      }
    />
  );
};

export default StoreRegisterDetailModal; 