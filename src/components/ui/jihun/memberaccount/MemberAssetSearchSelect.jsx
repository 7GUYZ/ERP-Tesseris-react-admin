import React from "react"

const MemberAssetSearchSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
}) => {
  return (
    <div className={`member-asset-search-field ${className}`}>
      {label && <label className="member-asset-search-label">{label}</label>}
      <select
        className="member-asset-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder || "선택하세요"}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default MemberAssetSearchSelect 