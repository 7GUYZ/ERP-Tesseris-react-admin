"use client"
import { DataGrid } from "@mui/x-data-grid"

const columns = [
  { field: "detailIndex", headerName: "DetailIndex", width: 100 },
  { field: "userId", headerName: "사용자 ID", width: 120 },
  { field: "userName", headerName: "사용자명", width: 120 },
  { field: "userPhone", headerName: "전화번호", width: 130 },
  { field: "transactionName", headerName: "거래명", width: 150 },
  { field: "chargeTime", headerName: "충전 시간", width: 180, 
    valueFormatter: (params) => {
      if (!params.value) return "";
      if (Array.isArray(params.value)) {
        const [year, month, day, hour, minute] = params.value;
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      }
      return new Date(params.value).toLocaleString('ko-KR');
    }
  },
  { field: "cmValue", headerName: "CM 값", width: 100, 
    valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
  },
  { field: "cashValue", headerName: "캐시 값", width: 120, 
    valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
  },
  { field: "regularCashValue", headerName: "정기 캐시 값", width: 130, 
    valueFormatter: (params) => params.value ? params.value.toLocaleString() : '0'
  },
  { field: "description", headerName: "설명", width: 100 },
  { field: "paymentStatus", headerName: "지급 상태", width: 100,
    renderCell: (params) => (
      <span style={{
        color: params.value === '지급' ? '#059669' : '#dc2626',
        fontWeight: 'bold'
      }}>
        {params.value}
      </span>
    )
  },
  { field: "suggestionUserId", headerName: "추천인 ID", width: 120 },
  { field: "suggestionUserName", headerName: "추천인명", width: 120 },
  { field: "suggestionUserPhone", headerName: "추천인 전화번호", width: 140 },
  { field: "userRoleKorNm", headerName: "사용자 권한", width: 120 },
  { field: "userBankNumber", headerName: "계좌번호", width: 150 },
  { field: "userBankName", headerName: "은행명", width: 100 },
  { field: "userBankHolder", headerName: "예금주", width: 100 },
]

export default function CommissionPaymentDataGrid({ data, onSelectionChange }) {
  return (
    <div style={{ height: 600, width: "100%", backgroundColor: "white" }}>
      <DataGrid
        rows={data}
        columns={columns}
        hideFooter={false}
        pageSize={100}
        rowsPerPageOptions={[100, 200, 500, 1000, data.length]}
        checkboxSelection
        onRowSelectionModelChange={onSelectionChange}
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