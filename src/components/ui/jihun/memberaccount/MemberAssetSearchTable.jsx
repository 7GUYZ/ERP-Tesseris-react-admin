import React from "react"

const MemberAssetSearchTable = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="member-asset-search-table-container">
        <div className="member-asset-search-empty">
          검색 결과가 없습니다. 검색 조건을 입력하고 조회 버튼을 클릭해주세요.
        </div>
      </div>
    )
  }

  return (
    <div className="member-asset-search-table-container">
      <table className="member-asset-search-table">
        <thead>
          <tr>
            <th>FROM 등급</th>
            <th>FROM ID</th>
            <th>TO 등급</th>
            <th>TO ID</th>
            <th>TO 이름</th>
            <th>거래 유형</th>
            <th>금액</th>
            <th>단위</th>
            <th>사용 금액</th>
            <th>쿠폰 사용 금액</th>
            <th>사유</th>
            <th>발생일</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.fromGrade}</td>
              <td>{item.fromId}</td>
              <td>{item.toGrade}</td>
              <td>{item.toId}</td>
              <td>{item.toName}</td>
              <td>{item.transactionType}</td>
              <td>{item.amount}</td>
              <td>{item.unit}</td>
              <td>{item.usedValue}</td>
              <td>{item.couponUsedValue}</td>
              <td>{item.reason}</td>
              <td>{item.occurredDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MemberAssetSearchTable 