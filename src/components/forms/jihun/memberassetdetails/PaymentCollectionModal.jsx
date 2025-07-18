import { useState, useEffect } from "react"
import {
  ajgMemberAssetDetailsPayment,
  ajgMemberAssetDetailsCollection
} from "../../../../api/auth/JihunAuth.jsx"
import "../../../../styles/jihun/memberassetdetails/PaymentCollectionModal.css"

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
  const [activeTab, setActiveTab] = useState('cm-payment') // cm-payment, cm-collection, cmp-payment, cmp-collection
  const [formData, setFormData] = useState({
    id: "",
    cmHeld: "",
    grade: "",
    paymentAmount: "",
    reason: ""
  })

  // 모달이 열릴 때 선택된 회원 정보로 폼 초기화
  useEffect(() => {
    if (isOpen && selectedMember) {
      setFormData({
        id: selectedMember.id || "",
        cmHeld: selectedMember.cmHeld || "0",
        grade: selectedMember.grade || "",
        paymentAmount: "",
        reason: ""
      })
    }
  }, [isOpen, selectedMember])

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
      alert("지급할 CM을 입력해주세요.")
      return
    }
    
    if (!formData.reason || formData.reason.trim() === '') {
      alert("사유를 입력해주세요.")
      return
    }

    try {
      const paymentData = {
        memberId: formData.id,
        amount: parseInt(formData.paymentAmount),
        reason: formData.reason,
        currentCmHeld: parseInt(formData.cmHeld.replace(/,/g, ''))
      }

      console.log("지급/회수 데이터:", paymentData)
      
      let response;
      if (activeTab === 'cm-payment') {
        response = await ajgMemberAssetDetailsPayment(paymentData)
      } else if (activeTab === 'cm-collection') {
        response = await ajgMemberAssetDetailsCollection(paymentData)
      }
      
      if (response && response.data && response.data.success) {
        alert(`${activeTab === 'cm-payment' ? 'CM 지급' : 'CM 회수'} 처리가 완료되었습니다.`)
        
        // 부모 컴포넌트로 데이터 전달
        if (onPaymentSubmit) {
          onPaymentSubmit(paymentData)
        }
        
        // 모달 닫기
        onClose()
      } else {
        alert("처리 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("지급/회수 처리 중 오류:", error)
      alert("처리 중 오류가 발생했습니다.")
    }
  }

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      id: "",
      cmHeld: "",
      grade: "",
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
              type="submit"
              className="payment-collection-modal-btn payment"
              onClick={handleSubmit}
            >
              지급
            </button>
            <button
              type="button"
              className="payment-collection-modal-btn cancel"
              onClick={handleClose}
            >
              취소
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
              <label className="payment-collection-modal-label">ID</label>
              <input
                className="payment-collection-modal-input"
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            <div className="payment-collection-modal-field">
              <label className="payment-collection-modal-label">등급</label>
              <input
                className="payment-collection-modal-input"
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                readOnly
              />
            </div>
          </div>

          <div className="payment-collection-modal-row">
            <div className="payment-collection-modal-field">
              <label className="payment-collection-modal-label">보유중인 CM</label>
              <input
                className="payment-collection-modal-input"
                type="text"
                name="cmHeld"
                value={formData.cmHeld}
                onChange={handleInputChange}
                readOnly
              />
            </div>
            <div className="payment-collection-modal-field">
              <label className="payment-collection-modal-label">지급 CM</label>
              <input
                className="payment-collection-modal-input"
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleInputChange}
                placeholder="지급할 CM을 입력하세요."
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