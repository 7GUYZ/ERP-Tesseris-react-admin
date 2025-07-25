import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdvertisementList } from '../../api/auth/DabinAuth';
import '../../styles/dabin/AdvertisementListPage.css';

const AdvertisementListPage = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAdvertisements();
    }, []);

    const fetchAdvertisements = async () => {
        try {
            const response = await getAdvertisementList();
            setAdvertisements(response.data);
        } catch (error) {
            console.error('광고 목록 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (advertisementIndex) => {
        navigate(`/advertisement/detail/${advertisementIndex}`);
    };

    const handleCreateClick = () => {
        navigate('/advertisement/create');
    };

    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }

    return (
        <div className="ad-list-page">
            {/* Breadcrumb */}
            <ul className="ad-list-breadcrumb">
                <li>배너 및 광고 관리</li>
                <li>광고 관리</li>
            </ul>

            {/* Header */}
            <div className="ad-list-flex-between ad-list-mb10">
                <p className="ad-list-font-20 ad-list-bold">광고 목록</p>
                <div className="ad-list-flex-end">
                    <button
                        type="button"
                        className="ad-list-edit-button"
                        onClick={handleCreateClick}>
                        광고 등록
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="ad-list-card">
                <div className="ad-list-card-inner">
                    <div className="ad-list-table-box">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>등록한 관리자</th>
                                    <th>등록된 이미지</th>
                                    <th>광고 주소</th>
                                    <th>등록일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advertisements.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">등록된 광고 이미지가 없습니다.</td>
                                    </tr>
                                ) : (
                                    advertisements.map((ad, index) => (
                                        <tr
                                            key={ad.advertisementIndex}
                                            className="ad-list-cursor-pointer"
                                            onClick={() => handleRowClick(ad.advertisementIndex)}>
                                            <td>{index + 1}</td>
                                            <td>{ad.userId}</td>
                                            <td>
                                                <div className="ad-list-banner-img">
                                                    <img
                                                        src={ad.advertisementPhoto}
                                                        alt="광고 이미지"
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-image.png';
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                {ad.advertisementUrl && (
                                                    <a 
                                                        href={ad.advertisementUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="ad-list-cursor-view">
                                                        {ad.advertisementUrl}
                                                    </a>
                                                )}
                                            </td>
                                            <td>{new Date(ad.advertisementCreateTime).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvertisementListPage; 