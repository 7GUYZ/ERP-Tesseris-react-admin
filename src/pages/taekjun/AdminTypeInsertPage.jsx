import React, { useState, useEffect } from 'react';
import { adminTypeInsertApi } from '../../api/auth/TaekjunAuth';
import usePermissionStore from '../../store/taekjun/PermissionStore';
import '../../styles/taekjun/AdminTypeInsertPage.css';

const AdminTypeInsertPage = () => {
  const [adminTypes, setAdminTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    adminTypeName: '',
    insertPosition: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({
    adminTypeIndex: null,
    adminTypeName: '',
    newOrder: null
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // 권한 체크 훅 사용
  const { checkPermission, hasPermission } = usePermissionStore();

  // 컴포넌트 마운트 시 권한 체크
  useEffect(() => {
    checkPermission(40);
  }, [checkPermission]);

  // 데이터 조회
  useEffect(() => {
    fetchAdminTypes();
  }, []);

  // 관리자 타입 목록 조회
  const fetchAdminTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminTypeInsertApi.getAdminTypesList();
      console.log('관리자 타입 목록:', response.data);
      setAdminTypes(response.data || []);
    } catch (err) {
      console.error('관리자 타입 목록 조회 실패:', err);
      setError('관리자 타입 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.adminTypeName.trim()) {
      alert('관리자 타입 이름을 입력해주세요.');
      return false;
    }
    if (formData.insertPosition < 1 || formData.insertPosition > adminTypes.length + 1) {
      alert(`삽입 위치는 1부터 ${adminTypes.length + 1} 사이의 값이어야 합니다.`);
      return false;
    }
    return true;
  };

  const validateEditForm = () => {
    if (!editData.adminTypeName.trim()) {
      alert('관리자 타입 이름을 입력해주세요.');
      return false;
    }
    if (editData.newOrder < 1 || editData.newOrder > adminTypes.length) {
      alert(`순서는 1부터 ${adminTypes.length} 사이의 값이어야 합니다.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (hasPermission(40, 'insert') !== 1) {
      alert('등록 권한이 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await adminTypeInsertApi.insertAdminType({
        adminTypeName: formData.adminTypeName.trim(),
        insertPosition: parseInt(formData.insertPosition)
      });

      if (response.data.success) {
        alert('관리자 타입이 성공적으로 등록되었습니다.');
        setFormData({
          adminTypeName: '',
          insertPosition: 1
        });
        await fetchAdminTypes();
      } else {
        alert(response.data.message || '등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('관리자 타입 등록 실패:', err);
      const errorMessage = err.response?.data?.message || err.message || '등록 중 오류가 발생했습니다.';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStart = (adminType) => {
    setEditMode(adminType.adminTypeIndex);
    setEditData({
      adminTypeIndex: adminType.adminTypeIndex,
      adminTypeName: adminType.adminTypeName,
      newOrder: adminType.adminTypeOrder
    });
  };

  const handleEditCancel = () => {
    setEditMode(null);
    setEditData({
      adminTypeIndex: null,
      adminTypeName: '',
      newOrder: null
    });
  };

  const handleEditSave = async (adminTypeIndex) => {
    if (!validateEditForm()) {
      return;
    }

    if (hasPermission(40, 'update') !== 1) {
      alert('수정 권한이 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await adminTypeInsertApi.updateAdminType({
        adminTypeIndex: adminTypeIndex,
        adminTypeName: editData.adminTypeName.trim(),
        newOrder: parseInt(editData.newOrder)
      });

      if (response.data.success) {
        alert('관리자 타입이 성공적으로 수정되었습니다.');
        setEditMode(null);
        setEditData({
          adminTypeIndex: null,
          adminTypeName: '',
          newOrder: null
        });
        await fetchAdminTypes();
      } else {
        alert(response.data.message || '수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('관리자 타입 수정 실패:', err);
      const errorMessage = err.response?.data?.message || err.message || '수정 중 오류가 발생했습니다.';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (adminTypeIndex, adminTypeName) => {
    if (hasPermission(40, 'delete') !== 1) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm(`정말로 '${adminTypeName}' 관리자 타입을 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없으며, 관련된 모든 권한 기능도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await adminTypeInsertApi.deleteAdminType(adminTypeIndex);

      if (response.data.success) {
        alert('관리자 타입이 성공적으로 삭제되었습니다.');
        await fetchAdminTypes();
      } else {
        alert(response.data.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('관리자 타입 삭제 실패:', err);
      const errorMessage = err.response?.data?.message || err.message || '삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <div className="admin-type-insert-page">
      <div className="admin-type-insert-header">
        <h1 className="admin-type-insert-title">권한 타입 관리</h1>
      </div>

      <div className="admin-type-insert-container">
        <div className="admin-type-insert-header">
            <h2>권한 리스트</h2>
            {hasPermission(40, 'insert') === 1 && (
                <button 
                    className="admin-type-insert-add-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    등록
                </button>
            )}
        </div>

        {loading ? (
            <div className="admin-type-insert-loading">로딩 중...</div>
        ) : error ? (
            <div className="admin-type-insert-error">{error}</div>
        ) : (
            <div className="admin-type-list">
                {adminTypes.map((adminType, index) => (
                    <div key={adminType.adminTypeIndex} className="admin-type-item">
                        <div 
                            className="admin-type-header"
                            onClick={() => toggleRow(index)}
                            aria-expanded={expandedRow === index}
                        >
                            <div className="admin-type-info">
                                <span className="admin-type-order">{index}</span>
                                <span className="admin-type-name">
                                    {editMode === adminType.adminTypeIndex ? (
                                        <input
                                            type="text"
                                            value={editData.adminTypeName}
                                            onChange={(e) => handleEditInputChange('adminTypeName', e.target.value)}
                                            className="admin-type-edit-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        adminType.adminTypeName
                                    )}
                                </span>
                            </div>
                            <div className="admin-type-actions" onClick={(e) => e.stopPropagation()}>
                                {editMode === adminType.adminTypeIndex ? (
                                    <>
                                        <button
                                            onClick={() => handleEditSave(adminType.adminTypeIndex)}
                                            className="admin-type-insert-save-btn"
                                            disabled={isSubmitting}
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className="admin-type-insert-cancel-btn"
                                        >
                                            취소
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {index !== 0 && ( // 대표(index 0)가 아닌 경우에만 수정/삭제 버튼 표시
                                            <>
                                                {hasPermission(40, 'update') === 1 && (
                                                    <button
                                                        onClick={() => handleEditStart(adminType)}
                                                        className="admin-type-insert-edit-btn"
                                                    >
                                                        수정
                                                    </button>
                                                )}
                                                {hasPermission(40, 'delete') === 1 && (
                                                    <button
                                                        onClick={() => handleDelete(adminType.adminTypeIndex, adminType.adminTypeName)}
                                                        className="admin-type-insert-delete-btn"
                                                        disabled={isSubmitting}
                                                    >
                                                        삭제
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="admin-type-toggle"></div>
                        </div>
                        {expandedRow === index && (
                            <div className="admin-type-content">
                                {editMode === adminType.adminTypeIndex && (
                                    <div className="admin-type-order-edit">
                                        <label>순서 변경:</label>
                                        <select
                                            value={editData.newOrder}
                                            onChange={(e) => handleEditInputChange('newOrder', e.target.value)}
                                            className="admin-type-order-select"
                                        >
                                            {Array.from({ length: adminTypes.length - 1 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>
                                                    {num}번 위치로 이동
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {/* 추가적인 권한 정보를 여기에 표시할 수 있습니다 */}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* 등록 모달 */}
        {showAddModal && (
            <div className="admin-type-insert-modal">
                <div className="admin-type-insert-modal-content">
                    <h3>권한 타입 등록</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-type-insert-form-group">
                            <label>권한명</label>
                            <input
                                type="text"
                                value={formData.adminTypeName}
                                onChange={(e) => handleInputChange('adminTypeName', e.target.value)}
                                placeholder="권한명을 입력하세요"
                                className="admin-type-insert-input"
                            />
                        </div>
                        <div className="admin-type-insert-form-group">
                            <label>순서</label>
                            <select
                                value={formData.insertPosition}
                                onChange={(e) => handleInputChange('insertPosition', e.target.value)}
                                className="admin-type-order-select"
                            >
                                {Array.from({ length: adminTypes.length + 1 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>
                                        {num}번 위치에 추가
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="admin-type-insert-modal-actions">
                            <button
                                type="submit"
                                className="admin-type-insert-save-btn"
                                disabled={isSubmitting}
                            >
                                등록
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="admin-type-insert-cancel-btn"
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminTypeInsertPage; 