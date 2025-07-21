import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField,  Grid, Box,MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


import '../../../styles/deokkyu/StoreList.css'; 
import { getStoreList } from '../../../api/auth/DeokkyuAuth';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import RealTimeChat from '../../../components/chat/RealTimeChat';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';


const columns = [
  { field: 'businessUserId', headerName: '사업자 ID', width: 120 },
  { field: 'businessUserName', headerName: '사업자 이름', width: 120 },
  { field: 'businessGradeName', headerName: '사업자 등급', width: 120 },
  { field: 'userId', headerName: '가맹점 ID', width: 120 },
  { field: 'userName', headerName: '이름', width: 100 },
  { field: 'userPhone', headerName: '핸드폰 번호', width: 140 },
  { field: 'storeBossName', headerName: '대표자 이름', width: 140 },
  { field: 'storeRegistrationNum', headerName: '사업자 등록번호', width: 160 },
  { field: 'storeTypeTaxation', headerName: '세금 유형', width: 160 },
  { field: 'storeCorporateName', headerName: '상호명', width: 160 },
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'storeCategoryName', headerName: '가맹점 유형', width: 160 }, 
  { field: 'storePhone', headerName: '대표 번호', width: 160 },
  { field: 'storeRequestStatusName', headerName: '승인 여부', width: 100 },
  { field: 'storeTransactionStatus', headerName: '거래 상태', width: 100 },
  { field: 'userCmpInit', headerName: '초기지급 CMP', width: 100 },
  { field: 'totalCM', headerName: '보유 CM', width: 100 },
  { field: 'storeCreateDate', headerName: '신청일', width: 120 },
];

function StoreList() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filter, setFilter] = useState({
    userId: '',
    userName: '', // 
    userPhone: '', // 가맹점 번호
    storeBossName: '', // 대표자이름
    storeRequestStatusName: '전체', // 승인여부 - 라디오
    storeTransactionStatus: '전체',// 거래상태 - 라디오
    storeCorporateName: '', // 상호명
    storeName: '', // 가맹점 명
    businessUserName: '', // 사업자 이름
    storeCreateDateStart: null, 
    storeCreateDateEnd: null,
  });

const fetchStores = async (params = {}) => {
  try {
    setLoading(true); // 로딩 시작
    const cleanedParams = {};
    const stringFields = [
      'userId', 'userName', 'userPhone', 'storeBossName',
      'storeRequestStatusName', 'storeTransactionStatus',
      'storeCorporateName', 'storeName', 'businessUserName'
    ];

    stringFields.forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined) {
        cleanedParams[key] = params[key];
      }
    });

    if (params.storeCreateDateStart)
      cleanedParams.storeCreateDateStart = dayjs(params.storeCreateDateStart).format('YYYY-MM-DD');
    if (params.storeCreateDateEnd)
      cleanedParams.storeCreateDateEnd = dayjs(params.storeCreateDateEnd).format('YYYY-MM-DD');

    const response = await getStoreList(
      Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
    );

    const data = response.data.map((item, index) => ({
      id: index + 1,
      ...item,
    }));

    setRows(data);
  } catch (error) {
    console.error('조회 실패:', error);
    alert('데이터를 불러오는 데 실패했습니다.');
  } finally {
    setLoading(false); // 로딩 종료
  }
};


  // 페이지 진입 시 → 빈 검색 조건으로 전체 데이터 자동 조회
  useEffect(() => {
    fetchStores({}); // 최초 진입 시에만 로딩중 표시
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchStores({ ...filter }); // 검색 시에는 로딩중 표시 안 함
  };

  const handleExcelDownload = () => {
    // id 필드를 제외하고 엑셀 다운로드용 데이터 준비
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadExcel(excelData, '가맹점회원리스트', '가맹점회원정보');
  }

  const handleSelectedExcelDownload = () => {
    if (!selectedRows || selectedRows.size === 0) {
      alert('다운로드할 항목을 체크해주세요.');
      return;
    }
    
    // 선택된 행들의 실제 인덱스 계산 (id - 1)
    const selectedIndices = new Set();
    selectedRows.forEach(id => {
      selectedIndices.add(id - 1); // id는 index + 1이므로 실제 인덱스는 id - 1
    });
    
    // id 필드를 제외하고 엑셀 다운로드용 데이터 준비
    const excelData = rows.map(row => {
      const { id, ...dataWithoutId } = row;
      return dataWithoutId;
    });
    
    downloadSelectedExcel(excelData, selectedIndices, '가맹점회원리스트_선택항목', '가맹점회원정보');
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="store-list-container" >
        <div className="store-list-title">가맹점 회원 리스트</div>
        <div className="store-search-actions">
          <button 
            className="store-search-btn excel" 
            onClick={handleSelectedExcelDownload}
            disabled={selectedRows.size === 0}
          >
            선택 엑셀
          </button>
          <button 
            className="store-search-btn all-excel" 
            onClick={handleExcelDownload}
            disabled={rows.length === 0}
          >
            전체 엑셀
          </button>
          <button
            className="store-search-btn search"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
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
                    label="핸드폰 번호"
                    value={filter.userPhone}
                    onChange={(e) => setFilter({ ...filter, userPhone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    label="대표자 이름"
                    value={filter.storeBossName}
                    onChange={(e) => setFilter({ ...filter, storeBossName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={2.5}>
                  <FormControl fullWidth size="small" margin="dense" sx={{ minWidth: 120 }}>
                    <InputLabel>승인 여부</InputLabel>
                    <Select
                      label="승인 여부"
                      value={filter.storeRequestStatusName}
                      onChange={(e) => setFilter({ ...filter, storeRequestStatusName: e.target.value })}
                    >
                      <MenuItem value="전체">전체</MenuItem>
                      <MenuItem value="승인">승인</MenuItem>
                      <MenuItem value="대기">대기</MenuItem>
                      <MenuItem value="거절">거절</MenuItem>
                      <MenuItem value="보류">보류</MenuItem>
                      <MenuItem value="해지">해지</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={2.5}>
                  <FormControl fullWidth size="small" margin="dense" sx={{ minWidth: 120 }}>
                    <InputLabel>거래 상태</InputLabel>
                    <Select
                      label="거래 상태"
                      value={filter.storeTransactionStatus}
                      onChange={(e) => setFilter({ ...filter, storeTransactionStatus: e.target.value })}
                    >
                      <MenuItem value="전체">전체</MenuItem>
                      <MenuItem value="정상">정상</MenuItem>
                      <MenuItem value="정지">정지</MenuItem>
                    </Select>
                  </FormControl>
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
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    label="사업자 이름"
                    value={filter.businessUserName}
                    onChange={(e) => setFilter({ ...filter, businessUserName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <DatePicker
                    label="신청일 시작"
                    format="YYYY-MM-DD"
                    value={filter.storeCreateDateStart}
                    onChange={(date) => setFilter({ ...filter, storeCreateDateStart: date })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <DatePicker
                    label="신청일 종료"
                    format="YYYY-MM-DD"
                    value={filter.storeCreateDateEnd}
                    onChange={(date) => setFilter({ ...filter, storeCreateDateEnd: date })}
                  />
                </Grid>
              </Grid>
            </div>

            <div className="data-grid-container">
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={25}
                rowsPerPageOptions={[25, 50, 100]}
                loading={loading}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={(newSelection) => {
                  // newSelection이 객체이고 ids 속성이 있는 경우
                  if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
                    setSelectedRows(newSelection.ids);
                  } else if (Array.isArray(newSelection)) {
                    // 배열인 경우 (이전 버전 호환성)
                    setSelectedRows(new Set(newSelection));
                  } else {
                    setSelectedRows(new Set());
                  }
                }}
                slots={{
                  noRowsOverlay: () => <NoRowsOverlay loading={loading} />,
                }}
              />
            </div>
          </Box>
          <RealTimeChat />
        </LocalizationProvider>
  );
}

export default StoreList;
