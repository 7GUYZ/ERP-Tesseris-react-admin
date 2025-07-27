import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBanner } from '../../api/auth/DabinAuth';
import { api } from '../../api/Http';
import '../../styles/dabin/BannerCreatePage.css';

const BannerCreatePage = () => {
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

        setLoading(true);

        try {
            // S3 업로드를 위한 FormData 구성
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            // S3 업로드 API 호출 (StoreImageRegisterPage와 동일한 방식)
            const accessToken = localStorage.getItem("access-token");
            const response = await api.post('/dabin/banner/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`
                },
                timeout: 30000 // 30초 타임아웃
            });

            if (response.data.resultCode === 200) {
                alert('배너를 등록하였습니다.');
                navigate('/banner/list');
            } else {
                alert(response.data.resultMessage || '배너 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 등록 오류:', error);
            alert('배너 등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleListClick = () => {
        navigate('/banner/list');
    };

    return (
        <div className="banner-create-page">
            {/* Breadcrumb */}
            <ul className="banner-create-breadcrumb">
                <li>배너 및 광고 관리</li>
                <li>배너 관리</li>
                <li>배너 등록</li>
            </ul>

            {/* Header */}
            <div className="banner-create-flex-between banner-create-mb10">
                <p className="banner-create-font-20 banner-create-bold">배너 등록</p>
                <div>
                    <button
                        type="button"
                        className="banner-create-cancel-button"
                        onClick={handleListClick}>
                        목록
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="banner-create-card">
                <div className="banner-create-card-inner">
                    <div className="banner-create-form-grid">
                        {/* 배너 이미지 */}
                        <div className="banner-create-form-item">
                            <div className="banner-create-label-horizontal">
                                <span className="banner-create-text">배너 이미지</span>
                                <div className="banner-create-banner-btn">
                                    <label>
                                        배너사진 등록하기
                                        <input
                                            type="file"
                                            className="banner-create-file-input"
                                            accept=".gif,.png,.jpg,.jpeg"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="banner-create-image-preview">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="배너 이미지 미리보기"
                                    />
                                ) : (
                                    <div className="banner-create-upload-area">
                                        <p>이미지를 드래그하거나 클릭하여 업로드</p>
                                        <p className="banner-create-upload-guide">권장 비율: 675×270 (1.2.5 비율)</p>
                                    </div>
                                )}
                            </div>
                            <p className="banner-create-img-guide">
                                <span className="banner-create-color-red">이미지는 1:2.5 비율 (675×270)로 업로드</span>
                                해주시기 바랍니다.
                                <br />
                                그렇지 않으실경우, 이미지가 깨져 보이실 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* 등록 버튼 */}
                    <div className="banner-create-button-container">
                        <button
                            type="button"
                            className="banner-create-register-button"
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

export default BannerCreatePage; 