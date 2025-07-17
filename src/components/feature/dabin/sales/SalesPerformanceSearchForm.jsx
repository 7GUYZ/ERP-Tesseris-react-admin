"use client"

import { useState } from "react"
import { Grid, TextField, Select, MenuItem, FormControl, Typography, Paper, Box } from "@mui/material"

const SalesPerformanceSearchForm = ({ onSearch, businessGrades, storeRequestStatuses, onParamsChange }) => {
  const [form, setForm] = useState({
    businessUserId: "",
    businessGradeIndex: "",
    userName: "",
    businessManDistributionFlag: "",
    storeUserId: "",
    storeName: "",
    storeRequestStatusIndex: "",
    storeTransactionStatus: "",
  })

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value }
    setForm(newForm)
    if (onParamsChange) {
      onParamsChange(newForm)
    }
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" mb={2}>검색 조건</Typography>
      <Grid container spacing={2}>
        {/* 첫 번째 행 */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>사업자 ID</Typography>
            <TextField
              name="businessUserId"
              value={form.businessUserId}
              onChange={handleChange}
              placeholder="검색명을 입력하세요."
              size="small"
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>사업자 등급</Typography>
            <Select
              name="businessGradeIndex"
              value={form.businessGradeIndex}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              {businessGrades.map((grade) => (
                <MenuItem key={grade.businessGradeIndex} value={grade.businessGradeIndex}>
                  {grade.businessGradeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>사업자 이름</Typography>
            <TextField
              name="userName"
              value={form.userName}
              onChange={handleChange}
              placeholder="검색명을 입력하세요."
              size="small"
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>사업자 상태</Typography>
            <Select
              name="businessManDistributionFlag"
              value={form.businessManDistributionFlag}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="1">정상</MenuItem>
              <MenuItem value="0">정지</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* 두 번째 행 */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>가맹점 ID</Typography>
            <TextField
              name="storeUserId"
              value={form.storeUserId}
              onChange={handleChange}
              placeholder="검색명을 입력하세요."
              size="small"
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>가맹점 명</Typography>
            <TextField
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              placeholder="검색명을 입력하세요."
              size="small"
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>승인 여부</Typography>
            <Select
              name="storeRequestStatusIndex"
              value={form.storeRequestStatusIndex}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              {storeRequestStatuses.map((status) => (
                <MenuItem key={status.storeRequestStatusIndex} value={status.storeRequestStatusIndex}>
                  {status.storeRequestStatusName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <Typography variant="body2" mb={1}>가맹점 상태</Typography>
            <Select
              name="storeTransactionStatus"
              value={form.storeTransactionStatus}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="1">정상</MenuItem>
              <MenuItem value="0">정지</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default SalesPerformanceSearchForm 