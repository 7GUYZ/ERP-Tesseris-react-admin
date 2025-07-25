"use client"
import { DataGrid } from "@mui/x-data-grid"

const columns = [
  { field: "issuanceUserRole", headerName: "발행자 구분", width: 120 },
  { field: "issuanceUser", headerName: "발행자 ID", width: 120 },
  { field: "couponPrice", headerName: "쿠폰 가격", width: 100 },
  { field: "couponLimit", headerName: "쿠폰 한도", width: 100 },
  { field: "couponName", headerName: "쿠폰명", width: 150 },
  { field: "couponIssuanceStatus", headerName: "발행 상태", width: 120 },
  { field: "couponIssuanceTime", headerName: "발행일", width: 160 },
  { field: "providedUserRole", headerName: "지급자 구분", width: 120 },
  { field: "providedUser", headerName: "지급자 ID", width: 120 },
  { field: "couponProvidedStatus", headerName: "지급 상태", width: 120 },
  { field: "couponProvidedTime", headerName: "지급일", width: 160 },
  { field: "couponLimitTime", headerName: "만기일", width: 160 },
]

export default function CouponDataGrid({ data }) {
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
