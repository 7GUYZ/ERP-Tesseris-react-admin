import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdvertisement, deleteAdvertisement, getPresignedUrl } from '../../api/auth/DabinAuth';
import Toast from '../../components/ui/jungeun/Toast';
import '../../styles/dabin/AdvertisementDetailPage.css';

const AdvertisementDetailPage = () => {
    const { advertisementIndex } = useParams();
    const navigate = useNavigate();
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Toast states
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [showToast, setShowToast] = useState(false);

    const showToastMessage = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const closeToast = () => {
        setShowToast(false);
    };

    useEffect(() => {
        fetchAdvertisement();
        // eslint-disable-next-line
    }, [advertisementIndex]);

    const fetchAdvertisement = async () => {
        try {
            const response = await getAdvertisement(advertisementIndex);
            const adData = response.data;
            
            // presigned URL 가져오기
            try {
                const presignedUrl = await getPresignedUrl(adData.advertisementPhoto);
                setAd({ ...adData, presignedUrl });
            } catch {
                setAd(adData);
            }
        } catch (error) {
            showToastMessage('광고 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/advertisement/list');
    };

    const handleEditClick = () => {
        navigate(`/advertisement/edit/${advertisementIndex}`);
    };

    const handleDeleteClick = async () => {
        if (!window.confirm('정말로 이 광고를 삭제하시겠습니까?')) return;
        try {
            const response = await deleteAdvertisement(advertisementIndex);
            if (response.data.success) {
                showToastMessage('광고를 삭제하였습니다.', 'success');
                setTimeout(() => {
                    navigate('/advertisement/list');
                }, 1500);
            } else {
                showToastMessage(response.data.message || '광고 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            showToastMessage('광고 삭제 중 오류가 발생했습니다.', 'error');
        }
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (!ad) return <div>광고 정보를 찾을 수 없습니다.</div>;

    return (
        <div className="ad-detail-page">
            {/* Breadcrumb */}
            <ul className="ad-detail-breadcrumb">
                <li>배너 및 광고 관리</li>
                <li>광고 관리</li>
                <li>광고 상세</li>
            </ul>

            {/* Header */}
            <div className="ad-detail-flex-between ad-detail-mb10">
                <p className="ad-detail-font-20 ad-detail-bold">광고 상세</p>
                <div>
                    <button type="button" className="ad-detail-cancel-button" onClick={handleListClick}>목록</button>
                    <button type="button" className="ad-detail-delete-button" onClick={handleDeleteClick}>삭제</button>
                    <button type="button" className="ad-detail-edit-button" onClick={handleEditClick}>수정</button>
                </div>
            </div>

            {/* Card */}
            <div className="ad-detail-card">
                <div className="ad-detail-card-inner">
                    <div className="ad-detail-form-grid">
                        <div className="ad-detail-form-item">
                            <span className="ad-detail-text">광고 이미지</span>
                            <div className="ad-detail-banner-img">
                                <img src={ad.presignedUrl || ad.advertisementPhoto} alt="광고 이미지" style={{ maxWidth: 300 }} onError={e => {e.target.src='/placeholder-image.png'}} />
                            </div>
                        </div>
                        <div className="ad-detail-form-item">
                            <span className="ad-detail-text">광고 링크주소</span>
                            <div className="ad-detail-input-box">
                                <a href={ad.advertisementUrl} target="_blank" rel="noopener noreferrer">{ad.advertisementUrl}</a>
                            </div>
                        </div>
                        <div className="ad-detail-form-item">
                            <span className="ad-detail-text">등록일</span>
                            <div>{new Date(ad.advertisementCreateTime).toLocaleString()}</div>
                        </div>
                        <div className="ad-detail-form-item">
                            <span className="ad-detail-text">등록한 관리자</span>
                            <div>{ad.userId}</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Toast Component */}
            {showToast && (
                <Toast
                    type={toastType}
                    message={toastMessage}
                    onClose={closeToast}
                />
            )}
        </div>
    );
};

export default AdvertisementDetailPage; 