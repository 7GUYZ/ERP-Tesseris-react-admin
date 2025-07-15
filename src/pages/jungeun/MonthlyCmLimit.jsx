"use client"

import { useState } from "react"
import "../../styles/jungeun/monthlyCmLimit.css"

const MonthlyCmLimit = () => {
  const [monthlyLimit, setMonthlyLimit] = useState(300000)
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(monthlyLimit)

  const handleEdit = () => {
    setTempValue(monthlyLimit)
    setIsEditing(true)
  }

  const handleSave = () => {
    setMonthlyLimit(tempValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(monthlyLimit)
    setIsEditing(false)
  }

  const handleAmountIncrease = (amount) => {
    setTempValue((prev) => prev + amount)
  }

  const formatNumber = (num) => {
    return num.toLocaleString()
  }

  const amountButtons = [
    { amount: 1000, label: "+1천원" },
    { amount: 5000, label: "+5천원" },
    { amount: 10000, label: "+1만원" },
    { amount: 50000, label: "+5만원" },
    { amount: 100000, label: "+10만원" },
  ]

  return (
    <div className="monthly-cm-limit">
      <div className="setting-card">
        <div className="card-header">
          <div className="header-content">
            <h2 className="setting-title">월 CM 사용한도</h2>
            <p className="setting-description">매월 사용 가능한 CM 한도를 설정합니다</p>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              <button className="edit-btn" onClick={handleEdit}>
                수정
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>
                  저장
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  취소
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="value-display">
            <div className="value-label">현재 월 CM 한도</div>
            {!isEditing ? (
              <div className="value-amount">
                <span className="amount-number">{formatNumber(monthlyLimit)}</span>
                <span className="amount-unit">원</span>
              </div>
            ) : (
              <div className="edit-section">
                <div className="value-input-container">
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(Number(e.target.value))}
                    className="value-input"
                    placeholder="한도를 입력하세요"
                  />
                  <span className="input-unit">원</span>
                </div>

                <div className="amount-buttons">
                  <div className="amount-buttons-label">빠른 증가</div>
                  <div className="amount-buttons-grid">
                    {amountButtons.map((button) => (
                      <button
                        key={button.amount}
                        className="amount-btn"
                        onClick={() => handleAmountIncrease(button.amount)}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyCmLimit
