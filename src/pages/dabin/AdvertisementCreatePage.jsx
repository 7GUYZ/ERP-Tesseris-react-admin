import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdvertisement } from '../../api/auth/DabinAuth';
import { api } from '../../api/Http';
import '../../styles/dabin/AdvertisementCreatePage.css';

const AdvertisementCreatePage = () => {
    const [advertisementUrl, setAdvertisementUrl] = useState('https://');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert('이미지를 선택해주세요.');
            return;
        }

        // 링크가 입력된 경우에만 URL 유효성 검사
        if (advertisementUrl && advertisementUrl !== 'https://') {
            const urlRegex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
            if (!urlRegex.test(advertisementUrl)) {
                alert('팝업주소를 다시한번 확인하세요.');
                return;
            }
        }

        setLoading(true);

        try {
            // S3 업로드를 위한 FormData 구성
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('advertisementUrl', advertisementUrl);
            
            // S3 업로드 API 호출 (StoreImageRegisterPage와 동일한 방식)
            const accessToken = localStorage.getItem("access-token");
            const response = await api.post('/dabin/advertisement/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
                },
                timeout: 30000 // 30초 타임아웃
            });

            if (response.data.success) {
                alert('팝업을 등록하였습니다.');
                navigate('/advertisement/list');
            } else {
                alert(response.data.message || '팝업 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('팝업 등록 오류:', error);
            alert('팝업 등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/advertisement/list');
    };

    return (
        <div className="ad-create-page">
            {/* Breadcrumb */}
            <ul className="ad-create-breadcrumb">
                <li>배너 및 팝업 관리</li>
                <li>팝업 관리</li>
                <li>팝업 등록</li>
            </ul>

            {/* Header */}
            <div className="ad-create-flex-between ad-create-mb10">
                <p className="ad-create-font-20 ad-create-bold">팝업 등록</p>
                <div>
                    <button
                        type="button"
                        className="ad-create-cancel-button"
                        onClick={handleListClick}>
                        목록
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="ad-create-card">
                <div className="ad-create-card-inner">
                    <div className="ad-create-form-grid">
                        {/* 팝업 이미지 업로드 */}
                        <div className="ad-create-form-item">
                            <div className="ad-create-label-horizontal">
                                <span className="ad-create-text">팝업사진 등록</span>
                                <div className="ad-create-banner-btn">
                                    <label>
                                        팝업사진 등록하기
                                        <input
                                            type="file"
                                            className="ad-create-file-input"
                                            accept=".gif,.png,.jpg,.jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <p className="ad-create-img-guide">
                                <span className="ad-create-color-red">이미지는 1:2.5 비율 (675×270)로 업로드</span>
                                해주시기 바랍니다.
                                <br />
                                그렇지 않으실경우, 이미지가 깨져 보이실 수 있습니다.
                            </p>
                        </div>

                        {/* 팝업 링크 주소 */}
                        <div className="ad-create-form-item">
                            <div className="ad-create-label">
                                <span>팝업 링크주소 <span style={{ color: '#666', fontSize: '14px' }}>(선택사항)</span></span>
                                <div className="ad-create-input-box">
                                    <input
                                        type="text"
                                        className="ad-create-link-input"
                                        value={advertisementUrl}
                                        onChange={(e) => setAdvertisementUrl(e.target.value)}
                                        placeholder="등록하실 팝업 링크주소를 입력하세요. (선택사항)"
                                    />
                                </div>
                            </div>
                        </div>



                        {/* 이미지 미리보기 */}
                        <div className="ad-create-form-item">
                            <div className="ad-create-label-horizontal">
                                <span className="ad-create-text">등록된 팝업이미지</span>
                            </div>
                            <div className="ad-create-image-preview">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="팝업 이미지 미리보기"
                                    />
                                ) : (
                                    <div className="ad-create-upload-area">
                                        <p>이미지를 드래그하거나 클릭하여 업로드</p>
                                        <p className="ad-create-upload-guide">권장 비율: 675×270 (1.2.5 비율)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 등록 버튼 */}
                    <div className="ad-create-button-container">
                        <button
                            type="button"
                            className="ad-create-register-button"
                            onClick={handleSubmit}
                            disabled={loading}>
                            {loading ? '등록 중...' : '등록'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvertisementCreatePage; 