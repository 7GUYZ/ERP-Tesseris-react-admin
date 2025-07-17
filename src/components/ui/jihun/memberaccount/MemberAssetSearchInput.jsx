import React from "react"

const MemberAssetSearchInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  return (
    <div className={`member-asset-search-field ${className}`}>
      {label && <label className="member-asset-search-label">{label}</label>}
      <input
        type={type}
        className="member-asset-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default MemberAssetSearchInput 