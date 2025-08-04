"use client"

import { useState, useEffect, useRef } from "react"

const InputField = ({ type, placeholder, value, onChange, required, icon, error, errorMessage }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState(type)
  const inputRef = useRef(null)
  const iconRef = useRef(null)

  const focusStyles = {
    borderColor: error ? "#ff6b6b" : "#3b7ddd",
    backgroundColor: error ? "rgba(255, 107, 107, 0.1)" : "#ffffff",
    boxShadow: error ? "0 0 0 3px rgba(255, 107, 107, 0.1)" : "0 0 0 3px rgba(59, 125, 221, 0.2)",
    transform: "translateY(-2px)",
  }

  // 에러 상태에 따른 기본 스타일
  const getDefaultStyles = () => ({
    borderColor: error ? "#ff6b6b" : "rgba(34, 46, 60, 0.2)",
    backgroundColor: error ? "rgba(255, 107, 107, 0.05)" : "#ffffff",
    boxShadow: "none",
    transform: "none"
  })

  // 에러 상태 변경 시 스타일 업데이트
  useEffect(() => {
    if (inputRef.current) {
      const defaultStyles = getDefaultStyles()
      Object.assign(inputRef.current.style, defaultStyles)
    }
    if (iconRef.current) {
      iconRef.current.style.color = error ? "#ff6b6b" : "rgba(34, 46, 60, 0.6)"
    }
  }, [error])

  const handleFocus = (e) => {
    Object.assign(e.target.style, focusStyles)
    if (iconRef.current) {
      iconRef.current.style.color = error ? "#ff6b6b" : "#3b7ddd"
    }
  }

  const handleBlur = (e) => {
    const defaultStyles = getDefaultStyles()
    Object.assign(e.target.style, defaultStyles)
    if (iconRef.current) {
      iconRef.current.style.color = error ? "#ff6b6b" : "rgba(34, 46, 60, 0.6)"
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    setInputType(showPassword ? "password" : "text")
  }

  const getIcon = () => {
    switch (icon) {
      case "id":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
          </svg>
        )
      case "lock":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getPasswordToggleIcon = () => {
    if (type !== "password") return null
    
    return showPassword ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
      </svg>
    )
  }

  return (
    <div className={`login-input-field-container${error ? ' login-input-error' : ''}`}>
      <div ref={iconRef} className={`login-input-icon${error ? ' login-input-icon-error' : ''}`}>
        {getIcon()}
      </div>
      <input
        ref={inputRef}
        className={`login-input-field${error ? ' login-input-field-error' : ''}`}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {type === "password" && (
        <button
          type="button"
          className="login-password-toggle-btn"
          onClick={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: error ? "#ff6b6b" : "rgba(34, 46, 60, 0.6)",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.3s ease",
            zIndex: 3,
            width: "20px",
            height: "20px",
            pointerEvents: "auto"
          }}
          onMouseEnter={(e) => {
            e.target.style.color = error ? "#ff6b6b" : "#3b7ddd"
          }}
          onMouseLeave={(e) => {
            e.target.style.color = error ? "#ff6b6b" : "rgba(34, 46, 60, 0.6)"
          }}
        >
          {getPasswordToggleIcon()}
        </button>
      )}
      {errorMessage && (
        <div className="login-input-error-message" style={{
          color: "#ff6b6b",
          fontSize: "12px",
          marginTop: "4px",
          marginLeft: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {errorMessage}
        </div>
      )}
      <style>
        {`
          .login-input-field::placeholder {
            color: ${error ? "rgba(255, 107, 107, 0.7)" : "rgba(34, 46, 60, 0.5)"};
          }
        `}
      </style>
    </div>
  )
}

export default InputField
