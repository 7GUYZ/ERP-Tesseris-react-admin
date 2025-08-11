import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBannerList, getPresignedUrl } from '../../api/auth/DabinAuth';
import { permissionCheckApi } from '../../api/auth/TaekjunAuth';
import { useToast } from '../../context/jungeun/ToastContext';
import '../../styles/dabin/BannerListPage.css';
import { BannerIsvisible } from '../../api/auth/JihunAuth';



const BannerListPage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canInsert, setCanInsert] = useState(false);
    const [canUpdate, setCanUpdate] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    // 전체 ON/OFF 토글 상태 (모든 배너의 표시 여부가 모두 ON이면 true)
    const [allVisible, setAllVisible] = useState(false);
    // 초기 표시 여부 스냅샷과 변경 여부 플래그
    const [initialVisibilityMap, setInitialVisibilityMap] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // 권한 체크
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const response = await permissionCheckApi.checkPermission(23); // programIndex: 23 (배너 관리)
                if (response.data) {
                    setCanInsert(response.data.hasInsertAuthority === 1);
                    setCanUpdate(response.data.hasUpdateAuthority === 1);
                    setCanDelete(response.data.hasDeleteAuthority === 1);
                    console.log('배너 관리 권한 체크 결과:', {
                        insert: response.data.hasInsertAuthority,
                        update: response.data.hasUpdateAuthority,
                        delete: response.data.hasDeleteAuthority
                    });
                }
            } catch (error) {
                console.error('권한 체크 실패:', error);
                setCanInsert(false);
                setCanUpdate(false);
                setCanDelete(false);
            }
        };

        checkPermission();
    }, []);

    useEffect(() => {
        fetchBanners();
    }, []);

    // 페이지 포커스 시 데이터 새로고침 (안전한 방법)
    useEffect(() => {
        const handleFocus = () => {
            // 포커스 이벤트가 실제로 페이지 전환으로 인한 것인지 확인
            setTimeout(() => {
                fetchBanners();
            }, 100);
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // presigned URL 변환 함수
    const fetchPresignedUrls = async (banners) => {
        console.log('fetchPresignedUrls 호출, banners:', banners);
        console.log('banners type:', typeof banners);
        console.log('banners isArray:', Array.isArray(banners));

        if (!banners || !Array.isArray(banners) || banners.length === 0) {
            console.log('banners가 배열이 아니거나 비어있음');
            return [];
        }

        const bannersWithUrls = await Promise.all(
            banners.map(async (banner) => {
                try {
                    const url = await getPresignedUrl(banner.bannerPhoto);
                    return { ...banner, presignedUrl: url };
                } catch {
                    return { ...banner, presignedUrl: null };
                }
            })
        );
        return bannersWithUrls;
    };

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await getBannerList();
            console.log('배너 목록 응답:', response);

            if (response.data && response.data.resultCode === 200 && response.data.data) {
                console.log('배너 데이터:', response.data.data);
                const bannersWithUrls = await fetchPresignedUrls(response.data.data);
                console.log('배너 데이터 (URL 포함):', bannersWithUrls);
                setBanners(bannersWithUrls);
                // 전체 토글 상태 동기화
                const everyOn = Array.isArray(bannersWithUrls) && bannersWithUrls.length > 0 && bannersWithUrls.every(b => !!b.bannerIsvisible);
                setAllVisible(everyOn);
                // 초기 스냅샷 저장 및 변경 플래그 초기화
                const initMap = Object.fromEntries((bannersWithUrls || []).map(b => [b.bannerIndex, !!b.bannerIsvisible]));
                setInitialVisibilityMap(initMap);
                setHasChanges(false);
            } else {
                // 데이터가 없는 경우 빈 배열로 설정
                setBanners([]);
                setAllVisible(false);
                setInitialVisibilityMap({});
                setHasChanges(false);
            }
        } catch (error) {
            console.error('배너 목록 조회 오류:', error);
            // 오류 발생 시 빈 배열로 설정
            setBanners([]);
            setAllVisible(false);
            setInitialVisibilityMap({});
            setHasChanges(false);
        } finally {
            setLoading(false);
        }
    };

    const computeHasChanges = (list) => {
        if (!Array.isArray(list) || !initialVisibilityMap) return false;
        return list.some(b => (!!b.bannerIsvisible) !== (!!initialVisibilityMap[b.bannerIndex]));
    };

    // 개별 행 토글
    const handleRowToggle = (bannerIndex) => {
        setBanners(prev => {
            const updated = prev.map(b => (
                b.bannerIndex === bannerIndex ? { ...b, bannerIsvisible: !b.bannerIsvisible } : b
            ));
            const everyOn = updated.length > 0 && updated.every(b => !!b.bannerIsvisible);
            setAllVisible(everyOn);
            setHasChanges(computeHasChanges(updated));
            return updated;
        });
    };

    // 전체 토글
    const handleToggleAll = () => {
        setAllVisible(prev => {
            const next = !prev;
            setBanners(prevBanners => {
                const updated = prevBanners.map(b => ({ ...b, bannerIsvisible: next }));
                setHasChanges(computeHasChanges(updated));
                return updated;
            });
            return next;
        });
    };

    // 저장 버튼 클릭 (수정되는 index만 전송)
    const handleSave = async () => {
        const changedIndices = (banners || [])
            .filter(b => (!!b.bannerIsvisible) !== (!!initialVisibilityMap?.[b.bannerIndex]))
            .map(b => b.bannerIndex);
        if (changedIndices.length === 0) return;

        try {
            const response = await BannerIsvisible(changedIndices);
            console.log('response', response);
            const nextSnapshot = Object.fromEntries((banners || []).map(b => [b.bannerIndex, !!b.bannerIsvisible]));
            setInitialVisibilityMap(nextSnapshot);
            setHasChanges(false);
            showToast('success', '저장되었습니다.');
            window.location.reload();
        } catch (e) {
            console.error(e);
            showToast('error', '저장 중 오류가 발생했습니다.');
        }
    };

    const handleRowClick = (bannerIndex) => {
        navigate(`/banner/detail/${bannerIndex}`);
    };

    const handleCreateClick = () => {
        if (!canInsert) {
            showToast("error", "등록 권한이 없습니다.");
            return;
        }
        navigate('/banner/create');
    };



    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }

    return (
        <div className="banner-list-page">
            {/* Header */}
            <div className="banner-list-flex-between banner-list-mb10">
                <p className="banner-list-font-20 banner-list-bold">배너 목록</p>
                <div className="banner-list-flex-end">
                    <button
                        type="button"
                        className="banner-list-save-button"
                        onClick={handleSave}
                        disabled={!hasChanges}
                        style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        저장
                    </button>
                    <button
                        type="button"
                        className="banner-list-edit-button"
                        onClick={handleCreateClick}
                        disabled={!canInsert}
                        style={!canInsert ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                        배너 등록
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="banner-list-card">
                <div className="banner-list-card-inner">
                    <div className="banner-list-table-box">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>등록한 관리자</th>
                                    <th>등록된 이미지</th>
                                    <th>등록일</th>
                                    <th>
                                        <div className="jiun-toggle-header">
                                            전체
                                            <label className="jiun-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={allVisible}
                                                    onChange={handleToggleAll}
                                                />
                                                <span className="jiun-toggle-slider"></span>
                                            </label>
                                            <span className={`jiun-toggle-text ${allVisible ? 'on' : 'off'}`}>{allVisible ? 'ON' : 'OFF'}</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {banners.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">등록된 배너 이미지가 없습니다.</td>
                                    </tr>
                                ) : (
                                    banners.map((banner, index) => (
                                        <tr
                                            key={banner.bannerIndex}
                                            className="banner-list-cursor-pointer"
                                            onClick={() => handleRowClick(banner.bannerIndex)}>
                                            <td>{index + 1}</td>
                                            <td>{banner.userId}</td>
                                            <td>
                                                <div className="banner-list-banner-img">
                                                    <img
                                                        src={banner.presignedUrl || banner.bannerPhoto}
                                                        alt="배너 이미지"
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
                                            </td>
                                            <td>
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
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="jiun-toggle-button">
                                                    <label className="jiun-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!banner.bannerIsvisible}
                                                            onChange={() => handleRowToggle(banner.bannerIndex)}
                                                        />
                                                        <span className="jiun-toggle-slider"></span>
                                                    </label>
                                                    <span className={`jiun-toggle-text ${banner.bannerIsvisible ? 'on' : 'off'}`}>
                                                        {banner.bannerIsvisible ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                            </td>
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

export default BannerListPage; 