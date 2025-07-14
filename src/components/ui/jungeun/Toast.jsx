"use client"

import { useEffect } from "react"

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onClose])

  const getTypeClass = () => {
    switch (type) {
      case "success": return "toast toast-success"
      case "error": return "toast toast-error"
      case "info": return "toast toast-info"
      default: return "toast"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )
      case "error":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )
      case "info":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <>

        <div className={getTypeClass()} >
          {getIcon()}
          <span>{message}</span>
          <button
            className="toast-close"
            onClick={onClose}
            onMouseEnter={e => (e.target.style.opacity = "1")}
            onMouseLeave={e => (e.target.style.opacity = "0.8")}
          >
            ×
          </button>
        </div>
    </>
  )
}

export default Toast 