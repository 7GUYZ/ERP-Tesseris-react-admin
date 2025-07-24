import React, { useState, useEffect } from "react"
import "../../../../styles/jihun/memberassetdetails/PaymentCollectionModal.css"
import { useToast } from '../../../../context/jungeun/ToastContext';

/**
 * 지급 및 회수 모달 컴포넌트
 * 
 * 주요 기능:
 * 1. CM 지급/회수 모달
 * 2. 선택된 회원 정보 표시
 * 3. 지급/회수 처리
 */
const PaymentCollectionModal = ({ 
  isOpen, 
  onClose, 
  selectedMember, 
  onPaymentSubmit 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cm-payment')
  const [formData, setFormData] = useState({
    paymentAmount: "",
    reason: ""
  })

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
        paymentAmount: "",
        reason: ""
      })
    }
  }, [isOpen])

  // 폼 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 지급/회수 처리 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.paymentAmount || formData.paymentAmount.trim() === '') {
      toast.error("금액을 입력해주세요.");
      return
    }
    
    if (!formData.reason || formData.reason.trim() === '') {
      toast.error("사유를 입력해주세요.");
      return
    }

    try {
      // 회수 처리 시 음수로 변환
      const amount = activeTab === 'cm-collection' ? 
        -parseInt(formData.paymentAmount) : 
        parseInt(formData.paymentAmount);

      const paymentData = {
        memberId: selectedMember.usersId,
        amount: amount,
        reason: formData.reason,
        currentCmHeld: parseInt(selectedMember.cmHeld.toString().replace(/,/g, '')) || 0
      }
      
      // 부모 컴포넌트로 데이터 전달
      if (onPaymentSubmit) {
        onPaymentSubmit(paymentData)
      }
      
      // 모달 닫기
      onClose()
    } catch (error) {
      console.error('Payment/Collection 처리 오류:', error);
      toast.error("처리 중 오류가 발생했습니다.");
    }
  }

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      paymentAmount: "",
      reason: ""
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="payment-collection-modal-overlay">
      <div className="payment-collection-modal">
        <div className="payment-collection-modal-header">
          <h2 className="payment-collection-modal-title">지급 및 회수</h2>
          <div className="payment-collection-modal-header-actions">
            <button
              type="button"
              className="payment-collection-modal-btn cancel"
              onClick={handleClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="payment-collection-modal-btn payment"
              onClick={handleSubmit}
            >
              {activeTab === 'cm-payment' ? '지급' : '회수'}
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="payment-collection-modal-tabs">
          <button
            className={`payment-collection-modal-tab ${activeTab === 'cm-payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('cm-payment')}
          >
            CM 지급
          </button>
          <button
            className={`payment-collection-modal-tab ${activeTab === 'cm-collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('cm-collection')}
          >
            CM 회수
          </button>
        </div>

        {/* 폼 내용 */}
        <form className="payment-collection-modal-form" onSubmit={handleSubmit}>
          <div className="payment-collection-modal-row">
            <div className="payment-collection-modal-field">
              <label className="payment-collection-modal-label">
                {activeTab === 'cm-payment' ? '지급 CM' : '회수 CM'}
              </label>
              <input
                className="payment-collection-modal-input"
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                placeholder={activeTab === 'cm-payment' ? '지급할 CM을 입력하세요.' : '회수할 CM을 입력하세요.'}
                min="0"
              />
            </div>
          </div>

          <div className="payment-collection-modal-row">
            <div className="payment-collection-modal-field full-width">
              <label className="payment-collection-modal-label">사유</label>
              <textarea
                className="payment-collection-modal-textarea"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="사유를 입력하세요."
                style={{ height: '300px', resize: 'none' }}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentCollectionModal 