"use client"
import { DataGrid } from "@mui/x-data-grid"

const columns = [
  { field: "businessUserId", headerName: "사업자 ID", width: 120 },
  { field: "businessGradeName", headerName: "사업자 등급", width: 120 },
  { field: "businessAreaName", headerName: "사업자 담당구역", width: 150 },
  { field: "businessUserName", headerName: "사업자 이름", width: 120 },
  { field: "businessManDistributionFlag", headerName: "사업자 상태", width: 120 },
  { field: "storeUserId", headerName: "가맹점 ID", width: 120 },
  { field: "storeName", headerName: "가맹점 명", width: 150 },
  { field: "storeRequestStatusName", headerName: "가맹점 승인 여부", width: 150 },
  { field: "storeTransactionStatus", headerName: "가맹점 상태", width: 120 },
  { field: "cmrockStatus", headerName: "가맹점 CM락", width: 120 },
  { field: "sellrockStatus", headerName: "가맹점 판매락", width: 120 },
  { field: "storeRegistrationDate", headerName: "가맹점 등록일", width: 165 },
]

export default function SalesPerformanceDataGrid({ data }) {
  return (
    <div style={{ height: 600, width: "100%", backgroundColor: "white" }}>
      <DataGrid
        rows={data}
        columns={columns}
        hideFooter={false}
        pageSize={100}
        rowsPerPageOptions={[100, 200, 500, 1000, data.length]}
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f0f0f0",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: "#ffffff",
          },
        }}
      />
    </div>
  )
} 