import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdvertisement, updateAdvertisement, deleteAdvertisement, getPresignedUrl } from '../../api/auth/DabinAuth';
import { api } from '../../api/Http';
import Toast from '../../components/ui/jungeun/Toast';
import ConfirmCancelModal from './ConfirmCancelModal';
import '../../styles/dabin/AdvertisementEditPage.css';

const AdvertisementEditPage = () => {
    const [advertisementUrl, setAdvertisementUrl] = useState('');
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
    const { advertisementIndex } = useParams();

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
    }, [advertisementIndex]);

    const fetchAdvertisement = async () => {
        try {
            const response = await getAdvertisement(advertisementIndex);
            const ad = response.data;
            
            // presigned URL 가져오기
            let presignedUrl = null;
            try {
                presignedUrl = await getPresignedUrl(ad.advertisementPhoto);
            } catch {
                // presigned URL 가져오기 실패 시 원본 URL 사용
            }
            
            setAdvertisementUrl(ad.advertisementUrl || 'https://');
            setCurrentImage(ad.advertisementPhoto);
            setPreviewImage(presignedUrl || ad.advertisementPhoto);
        } catch (error) {
            console.error('팝업 조회 오류:', error);
            showToastMessage('팝업 정보를 불러오는데 실패했습니다.', 'error');
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
        // 링크가 입력된 경우에만 URL 유효성 검사
        if (advertisementUrl && advertisementUrl !== 'https://') {
            const urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            if (!urlRegex.test(advertisementUrl)) {
                showToastMessage('팝업주소를 다시한번 확인하세요.', 'error');
                return;
            }
        }

        setLoading(true);

        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append('file', selectedFile);
            }
            formData.append('advertisementUrl', advertisementUrl);

            // S3 업로드 API 호출 (StoreImageRegisterPage와 동일한 방식)
            const accessToken = localStorage.getItem("access-token");
            const response = await api.put(`/dabin/advertisement/${advertisementIndex}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
                },
                timeout: 30000 // 30초 타임아웃
            });

            if (response.data.success) {
                showToastMessage('팝업을 수정하였습니다.', 'success');
                setTimeout(() => {
                    navigate('/advertisement/list');
                }, 1500);
            } else {
                showToastMessage(response.data.message || '팝업 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('팝업 수정 오류:', error);
            showToastMessage('팝업 수정 중 오류가 발생했습니다.', 'error');
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
            const response = await deleteAdvertisement(advertisementIndex);

            if (response.data.success) {
                showToastMessage('팝업을 삭제하였습니다.', 'success');
                setTimeout(() => {
                    navigate('/advertisement/list');
                }, 1500);
            } else {
                showToastMessage(response.data.message || '팝업 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('팝업 삭제 오류:', error);
            showToastMessage('팝업 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setShowConfirmModal(false);
    };

    const handleListClick = () => {
        navigate(`/advertisement/detail/${advertisementIndex}`);
    };

    if (initialLoading) {
        return <div className="loading">로딩 중...</div>;
    }

    return (
        <div className="ad-edit-page">
            {/* Breadcrumb */}
            <ul className="ad-edit-breadcrumb">
                <li>배너 및 팝업 관리</li>
                <li>팝업 관리</li>
                <li>팝업 수정</li>
            </ul>

            {/* Header */}
            <div className="ad-edit-flex-between ad-edit-mb10">
                <p className="ad-edit-font-20 ad-edit-bold">팝업 수정</p>
            </div>

            {/* Card */}
            <div className="ad-edit-card">
                <div className="ad-edit-card-inner">
                    <div className="ad-edit-form-grid">
                        {/* 팝업 이미지 */}
                        <div className="ad-edit-form-item">
                            <div className="ad-edit-label-horizontal">
                                <span className="ad-edit-text">팝업 이미지</span>
                                <div className="ad-edit-banner-btn">
                                    <label>
                                        팝업사진 등록하기
                                        <input
                                            type="file"
                                            className="ad-edit-file-input"
                                            accept=".gif,.png,.jpg,.jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="ad-edit-image-preview">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="팝업 이미지"
                                    />
                                ) : (
                                    <div className="ad-edit-upload-area">
                                        <p>이미지를 드래그하거나 클릭하여 업로드</p>
                                        <p className="ad-edit-upload-guide">권장 비율: 675×270 (1.2.5 비율)</p>
                                    </div>
                                )}
                            </div>
                            <p className="ad-edit-img-guide">
                                <span className="ad-edit-color-red">이미지는 1:2.5 비율 (675×270)로 업로드</span>
                                해주시기 바랍니다.
                                <br />
                                그렇지 않으실경우, 이미지가 깨져 보이실 수 있습니다.
                            </p>
                        </div>

                        {/* 팝업 링크 주소 */}
                        <div className="ad-edit-form-item">
                            <div className="ad-edit-label">
                                <span>팝업 링크주소 <span style={{ color: '#666', fontSize: '14px' }}>(선택사항)</span></span>
                                <div className="ad-edit-input-box">
                                    <input
                                        type="text"
                                        className="ad-edit-link-input"
                                        value={advertisementUrl}
                                        onChange={(e) => setAdvertisementUrl(e.target.value)}
                                        placeholder="등록하실 팝업 링크주소를 입력하세요. (선택사항)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 저장/취소 버튼 */}
                    <div className="ad-edit-button-group" style={{ marginTop: 32, textAlign: 'right' }}>
                        <button
                            type="button"
                            className="ad-edit-cancel-button"
                            onClick={handleListClick}
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            className="ad-edit-edit-button"
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
                <ConfirmCancelModal
                    message="정말로 이 팝업을 삭제하시겠습니까?"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
};

export default AdvertisementEditPage; 