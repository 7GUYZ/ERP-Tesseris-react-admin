import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdvertisement, updateAdvertisement, deleteAdvertisement, getPresignedUrl } from '../../api/auth/DabinAuth';
import { api } from '../../api/Http';
import '../../styles/dabin/AdvertisementEditPage.css';

const AdvertisementEditPage = () => {
    const [advertisementUrl, setAdvertisementUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const navigate = useNavigate();
    const { advertisementIndex } = useParams();

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
            console.error('광고 조회 오류:', error);
            alert('광고 정보를 불러오는데 실패했습니다.');
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
        if (!advertisementUrl || advertisementUrl === 'https://') {
            alert('광고 링크 주소를 입력해주세요.');
            return;
        }

        // URL 유효성 검사
        const urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        if (!urlRegex.test(advertisementUrl)) {
            alert('광고주소를 다시한번 확인하세요.');
            return;
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
                alert('광고를 수정하였습니다.');
                navigate('/advertisement/list');
            } else {
                alert(response.data.message || '광고 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('광고 수정 오류:', error);
            alert('광고 수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말로 이 광고를 삭제하시겠습니까?')) {
            return;
        }

        setLoading(true);

        try {
            const response = await deleteAdvertisement(advertisementIndex);

            if (response.data.success) {
                alert('광고를 삭제하였습니다.');
                navigate('/advertisement/list');
            } else {
                alert(response.data.message || '광고 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('광고 삭제 오류:', error);
            alert('광고 삭제 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/advertisement/list');
    };

    if (initialLoading) {
        return <div className="loading">로딩 중...</div>;
    }

    return (
        <div className="ad-edit-page">
            {/* Breadcrumb */}
            <ul className="ad-edit-breadcrumb">
                <li>배너 및 광고 관리</li>
                <li>광고 관리</li>
                <li>광고 수정</li>
            </ul>

            {/* Header */}
            <div className="ad-edit-flex-between ad-edit-mb10">
                <p className="ad-edit-font-20 ad-edit-bold">광고 수정</p>
            </div>

            {/* Card */}
            <div className="ad-edit-card">
                <div className="ad-edit-card-inner">
                    <div className="ad-edit-form-grid">
                        {/* 광고 이미지 업로드 */}
                        <div className="ad-edit-form-item">
                            <div className="ad-edit-label-horizontal">
                                <span className="ad-edit-text">광고사진 등록</span>
                                <div className="ad-edit-banner-btn">
                                    <label>
                                        광고사진 등록하기
                                        <input
                                            type="file"
                                            className="ad-edit-file-input"
                                            accept=".gif,.png,.jpg,.jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <p className="ad-edit-img-guide">
                                <span className="ad-edit-color-red">이미지는 1:2.5 비율 (675×270)로 업로드</span>
                                해주시기 바랍니다.
                                <br />
                                그렇지 않으실경우, 이미지가 깨져 보이실 수 있습니다.
                            </p>
                        </div>

                        {/* 광고 링크 주소 */}
                        <div className="ad-edit-form-item">
                            <div className="ad-edit-label">
                                <span>광고 링크주소</span>
                                <div className="ad-edit-input-box">
                                    <input
                                        type="text"
                                        className="ad-edit-link-input"
                                        value={advertisementUrl}
                                        onChange={(e) => setAdvertisementUrl(e.target.value)}
                                        placeholder="등록하실 광고 링크주소를 입력하세요."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 등록된 광고 이미지 */}
                        <div className="ad-edit-form-item">
                            <div className="ad-edit-label-horizontal">
                                <span className="ad-edit-text">등록된 광고이미지</span>
                            </div>
                            <div className="ad-edit-image-preview">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="광고 이미지"
                                    />
                                ) : (
                                    <div className="ad-edit-upload-area">
                                        <p>이미지를 드래그하거나 클릭하여 업로드</p>
                                        <p className="ad-edit-upload-guide">권장 비율: 675×270 (1.2.5 비율)</p>
                                    </div>
                                )}
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
        </div>
    );
};

export default AdvertisementEditPage; 