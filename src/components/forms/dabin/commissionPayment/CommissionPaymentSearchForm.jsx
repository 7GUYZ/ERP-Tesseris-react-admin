"use client"

import { useState } from "react"
import { 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Typography,
  Paper
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { format } from "date-fns"
import "../../../../styles/dabin/CommissionPaymentSearchForm.css";

const CommissionPaymentSearchForm = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    userRoleIndex: "",
    paymentStatus: "",
    startDate: null,
    endDate: null,
    userName: "",
    userId: ""
  })

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = () => {
    const params = {
      ...searchParams,
      startDate: searchParams.startDate ? format(searchParams.startDate, 'yyyy-MM-dd') : "",
      endDate: searchParams.endDate ? format(searchParams.endDate, 'yyyy-MM-dd') : ""
    }
    onSearch(params)
  }

  const handleReset = () => {
    setSearchParams({
      userRoleIndex: "",
      paymentStatus: "",
      startDate: null,
      endDate: null,
      userName: "",
      userId: ""
    })
    onSearch({})
  }

  return (
    <div className="cp-searchform-paper">
      <Typography variant="h6" gutterBottom>
        수당 지급 검색
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="cp-searchform-row">
          <div style={{ flex: 1, minWidth: 120 }}>
            <FormControl fullWidth size="small">
              <InputLabel>추천인 등급</InputLabel>
              <Select
                value={searchParams.userRoleIndex}
                label="추천인 등급"
                onChange={(e) => handleInputChange('userRoleIndex', e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="1">일반</MenuItem>
                <MenuItem value="2">사업자</MenuItem>
                <MenuItem value="3">가맹점</MenuItem>
                <MenuItem value="4">관리자</MenuItem>
                <MenuItem value="5">특판부</MenuItem>
                <MenuItem value="6">가맹점 서브</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <FormControl fullWidth size="small">
              <InputLabel>지급 상태</InputLabel>
              <Select
                value={searchParams.paymentStatus}
                label="지급 상태"
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="대기">대기</MenuItem>
                <MenuItem value="지급">지급</MenuItem>
                <MenuItem value="미지급">미지급</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DatePicker
              label="시작일"
              value={searchParams.startDate}
              onChange={(date) => handleInputChange('startDate', date)}
              renderInput={(params) => <TextField {...params} size="small" fullWidth />}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DatePicker
              label="종료일"
              value={searchParams.endDate}
              onChange={(date) => handleInputChange('endDate', date)}
              renderInput={(params) => <TextField {...params} size="small" fullWidth />}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <TextField
              fullWidth
              size="small"
              label="사용자명"
              value={searchParams.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <TextField
              fullWidth
              size="small"
              label="사용자 ID"
              value={searchParams.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
            />
          </div>
          <div style={{ flexBasis: '100%', display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button 
              variant="outlined" 
              onClick={handleReset}
              sx={{ minWidth: 100 }}
            >
              초기화
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSearch}
              sx={{ minWidth: 100 }}
            >
              검색
            </Button>
          </div>
        </div>
      </LocalizationProvider>
    </div>
  );
}

export default CommissionPaymentSearchForm 