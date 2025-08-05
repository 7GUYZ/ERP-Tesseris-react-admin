import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBanner, deleteBanner, getPresignedUrl } from '../../api/auth/DabinAuth';
import Toast from '../../components/ui/jungeun/Toast';
import ConfirmCancelModal from './ConfirmCancelModal';
import { permissionCheckApi } from '../../api/auth/TaekjunAuth';
import { useToast } from '../../context/jungeun/ToastContext';
import '../../styles/dabin/BannerDetailPage.css';

const BannerDetailPage = () => {
    const { bannerIndex } = useParams();
    const navigate = useNavigate();
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canUpdate, setCanUpdate] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const { showToast } = useToast();

    // 권한 체크
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const response = await permissionCheckApi.checkPermission(23); // programIndex: 23 (배너 관리)
                if (response.data) {
                    setCanUpdate(response.data.hasUpdateAuthority === 1);
                    setCanDelete(response.data.hasDeleteAuthority === 1);
                    console.log('배너 관리 권한 체크 결과:', {
                        update: response.data.hasUpdateAuthority,
                        delete: response.data.hasDeleteAuthority
                    });
                }
            } catch (error) {
                console.error('권한 체크 실패:', error);
                setCanUpdate(false);
                setCanDelete(false);
            }
        };
        
        checkPermission();
    }, []);
    
    // Toast states
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [showToast1, setShowToast1] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const showToastMessage = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast1(true);
    };

    const closeToast = () => {
        setShowToast1(false);
    };

    useEffect(() => {
        fetchBanner();
        // eslint-disable-next-line
    }, [bannerIndex]);

    const fetchBanner = async () => {
        try {
            const response = await getBanner(bannerIndex);
            if (response.data && response.data.resultCode === 200 && response.data.data) {
                const bannerData = response.data.data;
                
                // presigned URL 가져오기
                try {
                    const presignedUrl = await getPresignedUrl(bannerData.bannerPhoto);
                    setBanner({ ...bannerData, presignedUrl });
                } catch {
                    setBanner(bannerData);
                }
            }
        } catch (error) {
            showToastMessage('배너 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/banner/list');
    };

    const handleEditClick = () => {
        if (!canUpdate) {
            showToast1("error", "수정 권한이 없습니다.");
            return;
        }
        navigate(`/banner/edit/${bannerIndex}`);
    };

    const handleDeleteClick = () => {
        if (!canDelete) {
            showToast1("error", "삭제 권한이 없습니다.");
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        try {
            const response = await deleteBanner(bannerIndex);
            if (response.data.success) {
                showToastMessage('배너를 삭제하였습니다.', 'success');
                setTimeout(() => {
                    navigate('/banner/list');
                }, 1500);
            } else {
                showToastMessage(response.data.message || '배너 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            showToastMessage('배너 삭제 중 오류가 발생했습니다.', 'error');
        }
    };

    const cancelDelete = () => {
        setShowConfirmModal(false);
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (!banner) return <div>배너 정보를 찾을 수 없습니다.</div>;

    return (
        <div className="banner-detail-page">
            {/* Header */}
            <div className="banner-detail-flex-between banner-detail-mb10">
                <p className="banner-detail-font-20 banner-detail-bold">배너 상세</p>
                <div>
                    <button type="button" className="banner-detail-cancel-button" onClick={handleListClick}>목록</button>
                    <button 
                        type="button" 
                        className="banner-detail-delete-button" 
                        onClick={handleDeleteClick}
                        disabled={!canDelete}
                        style={!canDelete ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                        삭제
                    </button>
                    <button 
                        type="button" 
                        className="banner-detail-edit-button" 
                        onClick={handleEditClick}
                        disabled={!canUpdate}
                        style={!canUpdate ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                        수정
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="banner-detail-card">
                <div className="banner-detail-card-inner">
                    <div className="banner-detail-form-grid">
                        <div className="banner-detail-form-item">
                            <span className="banner-detail-text">배너 이미지</span>
                            <div className="banner-detail-banner-img">
                                <img 
                                    src={banner.presignedUrl || banner.bannerPhoto} 
                                    alt="배너 이미지" 
                                    style={{ maxWidth: 300 }} 
                                    onError={(e) => {
                                        console.log('이미지 로드 실패:', banner.bannerPhoto);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling && (e.target.nextSibling.style.display = 'block');
                                    }}
                                />
                                <div style={{ display: 'none', padding: '10px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                                    이미지를 불러올 수 없습니다
                                </div>
                            </div>
                        </div>
                        <div className="banner-detail-form-item">
                            <span className="banner-detail-text">등록일</span>
                            <div>
                                {(() => {
                                    if (!banner.bannerCreateTime) return '-';
                                    
                                    try {
                                        // 배열 형태인지 확인 (Spring Boot에서 LocalDateTime이 배열로 직렬화된 경우)
                                        if (Array.isArray(banner.bannerCreateTime)) {
                                            const [year, month, day, hour, minute, second] = banner.bannerCreateTime;
                                            const date = new Date(year, month - 1, day, hour, minute, second);
                                            return date.toLocaleString('ko-KR');
                                        }
                                        
                                        // 일반적인 날짜 문자열인 경우
                                        return new Date(banner.bannerCreateTime).toLocaleString('ko-KR');
                                    } catch (error) {
                                        console.error('날짜 파싱 오류:', error, 'bannerCreateTime:', banner.bannerCreateTime);
                                        return '-';
                                    }
                                })()}
                            </div>
                        </div>
                        <div className="banner-detail-form-item">
                            <span className="banner-detail-text">등록한 관리자</span>
                            <div>{banner.userId}</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Toast Component */}
            {showToast1 && (
                <Toast
                    type={toastType}
                    message={toastMessage}
                    onClose={closeToast}
                />
            )}
            
            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmCancelModal
                    message="정말로 이 배너를 삭제하시겠습니까?"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
};

export default BannerDetailPage; 