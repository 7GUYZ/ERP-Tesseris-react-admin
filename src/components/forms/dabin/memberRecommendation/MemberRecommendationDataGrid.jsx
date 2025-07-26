"use client"

import {
  DataGrid,
  GridToolbar,
} from "@mui/x-data-grid"
import { Box } from "@mui/material"

const MemberRecommendationDataGrid = ({ data }) => {
  const columns = [
    {
      field: "suggestionUserId",
      headerName: "추천인 아이디",
      width: 150,
      flex: 1,
    },
    {
      field: "suggestionUserName",
      headerName: "추천인 이름",
      width: 120,
      flex: 1,
    },
    {
      field: "suggestionUserRole",
      headerName: "추천인 등급",
      width: 120,
      flex: 1,
    },
    {
      field: "suggestionStoreName",
      headerName: "가맹점 이름",
      width: 150,
      flex: 1,
    },
    {
      field: "recommendationUserId",
      headerName: "아이디",
      width: 150,
      flex: 1,
    },
    {
      field: "recommendationUserName",
      headerName: "이름",
      width: 120,
      flex: 1,
    },
    {
      field: "recommendationUserRole",
      headerName: "등급",
      width: 120,
      flex: 1,
    },
    {
      field: "joinDate",
      headerName: "가입일",
      width: 130,
      flex: 1,
      valueFormatter: (params) => {
        if (!params.value) return ""
        const date = new Date(params.value)
        return date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      },
    },
  ]

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={data}
        columns={columns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        disableSelectionOnClick
        getRowId={(row) => row.id}
        components={{
          Toolbar: GridToolbar,
        }}
        componentsProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #e0e0e0",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f5f5f5",
            borderBottom: "2px solid #e0e0e0",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      />
    </Box>
  )
}

export default MemberRecommendationDataGrid 