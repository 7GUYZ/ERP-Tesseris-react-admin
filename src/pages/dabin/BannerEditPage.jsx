import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBanner, updateBanner, deleteBanner, getPresignedUrl } from '../../api/auth/DabinAuth';
import { api } from '../../api/Http';
import Toast from '../../components/ui/jungeun/Toast';
import ConfirmModal from '../../components/ui/jungeun/ConfirmModal';
import '../../styles/dabin/BannerEditPage.css';

const BannerEditPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    // Toast states
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [showToast, setShowToast] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const navigate = useNavigate();
    const { bannerIndex } = useParams();

    const showToastMessage = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const closeToast = () => {
        setShowToast(false);
    };

    useEffect(() => {
        fetchBanner();
    }, [bannerIndex]);

    const fetchBanner = async () => {
        try {
            const response = await getBanner(bannerIndex);
            if (response.data && response.data.resultCode === 200 && response.data.data) {
                const banner = response.data.data;
                
                // presigned URL 가져오기
                let presignedUrl = null;
                try {
                    presignedUrl = await getPresignedUrl(banner.bannerPhoto);
                } catch {
                    // presigned URL 가져오기 실패 시 원본 URL 사용
                }
                
                setCurrentImage(banner.bannerPhoto);
                setPreviewImage(presignedUrl || banner.bannerPhoto);
            }
        } catch (error) {
            console.error('배너 조회 오류:', error);
            showToastMessage('배너 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            
            // 이미지 미리보기
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);

        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            // S3 업로드 API 호출 (StoreImageRegisterPage와 동일한 방식)
            const accessToken = localStorage.getItem("access-token");
            const response = await api.put(`/dabin/banner/${bannerIndex}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
                },
                timeout: 30000 // 30초 타임아웃
            });

            if (response.data.success) {
                showToastMessage('배너를 수정하였습니다.', 'success');
                setTimeout(() => {
                    navigate('/banner/list');
                }, 1500);
            } else {
                showToastMessage(response.data.message || '배너 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('배너 수정 오류:', error);
            showToastMessage('배너 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        setLoading(true);

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
            console.error('배너 삭제 오류:', error);
            showToastMessage('배너 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/banner/list');
    };

    if (initialLoading) {
        return <div className="loading">로딩 중...</div>;
    }

    return (
        <div className="banner-edit-page">
            {/* Breadcrumb */}
            <ul className="banner-edit-breadcrumb">
                <li>배너 및 광고 관리</li>
                <li>배너 관리</li>
                <li>배너 수정</li>
            </ul>

            {/* Header */}
            <div className="banner-edit-flex-between banner-edit-mb10">
                <p className="banner-edit-font-20 banner-edit-bold">배너 수정</p>
            </div>

            {/* Card */}
            <div className="banner-edit-card">
                <div className="banner-edit-card-inner">
                    <div className="banner-edit-form-grid">
                        {/* 배너 이미지 */}
                        <div className="banner-edit-form-item">
                            <div className="banner-edit-label-horizontal">
                                <span className="banner-edit-text">배너 이미지</span>
                                <div className="banner-edit-banner-btn">
                                    <label>
                                        배너사진 등록하기
                                        <input
                                            type="file"
                                            className="banner-edit-file-input"
                                            accept=".gif,.png,.jpg,.jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="banner-edit-image-preview">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="배너 이미지"
                                    />
                                ) : (
                                    <div className="banner-edit-upload-area">
                                        <p>이미지를 드래그하거나 클릭하여 업로드</p>
                                        <p className="banner-edit-upload-guide">권장 비율: 675×270 (1.2.5 비율)</p>
                                    </div>
                                )}
                            </div>
                            <p className="banner-edit-img-guide">
                                <span className="banner-edit-color-red">이미지는 1:2.5 비율 (675×270)로 업로드</span>
                                해주시기 바랍니다.
                                <br />
                                그렇지 않으실경우, 이미지가 깨져 보이실 수 있습니다.
                            </p>
                        </div>
                    </div>
                    {/* 저장/취소 버튼 */}
                    <div className="banner-edit-button-group" style={{ marginTop: 32, textAlign: 'right' }}>
                        <button
                            type="button"
                            className="banner-edit-cancel-button"
                            onClick={handleListClick}
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="banner-edit-edit-button"
                            onClick={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? '저장 중...' : '저장'}
                        </button>
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
            
            {/* Confirm Modal */}
            {showConfirmModal && (
                <ConfirmModal
                    message="정말로 이 배너를 삭제하시겠습니까?"
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};

export default BannerEditPage; 