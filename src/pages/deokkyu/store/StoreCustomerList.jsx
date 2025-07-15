import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Grid, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { api } from '../../../api/http';
import '../../../styles/StoreList.css'; 


const columns1 = [
  { field: 'userId', headerName: '가맹점 ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'storeCorporateName', headerName: '상호명', width: 160 },
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'customerCount', headerName: '고객 수', width: 100 },
];
const columns2 = [
  { field: 'userId', headerName: 'ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'storeCustomerStatus', headerName: '고객 등급', width: 160 },
];

function StoreCustomerList() {
  const [storerows, setStoreRows] = useState([]);
  const [customerRows, setCustomerRows] = useState([]);
  const [filter, setFilter] = useState({
    userId: '',
    userName: '', // 
    storeCorporateName: '', // 상호명
    storeName: '', // 가맹점 명
  });



const fetchStores = async (params = {}) => {
  try {
    const cleanedParams = {};

    // 문자열 필드 필터링
    const stringFields1 = [
      'userId', 'userName', 'storeCorporateName', 'storeName'
    ];

    stringFields1.forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined) {
          cleanedParams[key] = params[key];
      }
    });


    const response = await api.get('/store/customerlist', {
      params: Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined,
    });

    const data = response.data.map((item, index) => ({
      id: index + 1,
      ...item,
    }));

    setStoreRows(data);
  } catch (error) {
    console.error('조회 실패:', error);
    alert('데이터를 불러오는 데 실패했습니다.');
  }
};


// 고객 리스트 불러오는 함수
const fetchCustomers = async (storeId) => {
  try {
    const response = await api.get(`/store/customerlist/${storeId}`);
    const data = response.data.map((item, index) => ({
      id: index + 1,
      ...item,
    }));
    setCustomerRows(data);
  } catch (error) {
    console.error('고객 리스트 조회 실패:', error);
    alert('고객 리스트를 불러오는 데 실패했습니다.');
  }
};

// 고객 클릭시 
const handleStoreClick = (store) => {
  if (store && store.userId) {
    fetchCustomers(store.userId); // 또는 store.storeId 등 식별자에 맞게 수정
  }
};



  // 페이지 진입 시 → 빈 검색 조건으로 전체 데이터 자동 조회
  useEffect(() => {
    fetchStores(); 
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchStores({ ...filter });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="store-list-container" >
        <div className="store-list-title">가맹점 회원 리스트</div>

        <div className="filter-card">
          <Grid container spacing={2} mb={2}>
            <Grid item xs={2}>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="가맹점 ID"
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="이름"
                value={filter.userName}
                onChange={(e) => setFilter({ ...filter, userName: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="상호명"
                value={filter.storeCorporateName}
                onChange={(e) => setFilter({ ...filter, storeCorporateName: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                size="small"
                margin="dense"
                label="가맹점 명"
                value={filter.storeName}
                onChange={(e) => setFilter({ ...filter, storeName: e.target.value })}
              />
            </Grid>

            <Grid item xs={3}>
              <Button variant="contained" onClick={handleSearch} sx={{ mt: 1 }}>
                조회
              </Button>
            </Grid>
          </Grid>
        </div>

        <div className="data-grid-container1">
          <DataGrid
            rows={storerows}
            columns={columns1}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            onRowClick={(params) => handleStoreClick(params.row)}
          />
        </div>
        <div className="data-grid-container2">
          <DataGrid
            rows={customerRows}
            columns={columns2}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </div>
      </Box>
    </LocalizationProvider>
  );
}

export default StoreCustomerList;
