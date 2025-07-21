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
  { field: 'businessUserPhone', headerName: '핸드폰 번호', width: 140 }, // ++ businessman 테이블
  { field: 'businessAreaIndex', headerName: '담당 구역', width: 140 }, // ++ businessman 테이블
  
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'userId', headerName: '가맹점 ID', width: 120 },
  { field: 'userName', headerName: '회원 이름', width: 100 },

  { field: 'temporaryStoreMasterChargeTime', headerName: '분배시간', width: 120 }, // ++ temporary_store_master 테이블
  { field: 'temporaryStoreCmValue', headerName: '중개수수료 CM', width: 120 }, // ++ temporary_store_master 테이블
  { field: 'temporaryStoreCashValue', headerName: '중개수수료 Cash', width: 120 }, // ++ temporary_store_master 테이블
  { field: 'temporaryStoreTotalValue', headerName: '중개수수료 합계', width: 120 }, // ++ temporary_store_master 테이블
];

function BusinessManAllowanceDetails() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filter, setFilter] = useState({
    businessUserId: '', // 사업자 ID
    businessUserName: '', // 사업자 이름
    businessGradeName: '전체', // 사업자 등급
    businessUserPhone: '', // 사업자 핸드폰 번호
    businessAreaIndex: '', // 담당 구역
    storeName: '', // 가맹점 명
    userId: '', // 가맹점 ID
    userName: '', // 회원 이름
    temporaryStoreMasterChargeTimeStart: null, // 분배시간 시작
    temporaryStoreMasterChargeTimeEnd: null, // 분배시간 종료
  });

const fetchStores = async (params = {}) => {
  try {
    setLoading(true); // 로딩 시작
    const cleanedParams = {};
    const stringFields = [
      'businessUserId', 'businessUserName', 'businessGradeName',
      'businessUserPhone', 'businessAreaIndex', 'storeName',
      'userId', 'userName'
    ];

    stringFields.forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== '전체') {
        cleanedParams[key] = params[key];
      }
    });

    if (params.temporaryStoreMasterChargeTimeStart)
      cleanedParams.temporaryStoreMasterChargeTimeStart = dayjs(params.temporaryStoreMasterChargeTimeStart).format('YYYY-MM-DD');
    if (params.temporaryStoreMasterChargeTimeEnd)
      cleanedParams.temporaryStoreMasterChargeTimeEnd = dayjs(params.temporaryStoreMasterChargeTimeEnd).format('YYYY-MM-DD');

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
    
    downloadExcel(excelData, '사업자수당상세리스트', '사업자수당상세정보');
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
    
    downloadSelectedExcel(excelData, selectedIndices, '사업자수당상세리스트_선택항목', '사업자수당상세정보');
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="store-list-container" >
        <div className="store-list-title">사업자 수당 내역</div>
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
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    label="사업자 ID"
                    value={filter.businessUserId}
                    onChange={(e) => setFilter({ ...filter, businessUserId: e.target.value })}
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
                  <FormControl fullWidth size="small" margin="dense" sx={{ minWidth: 120 }}>
                    <InputLabel>사업자 등급</InputLabel>
                    <Select
                      label="사업자 등급"
                      value={filter.businessGradeName}
                      onChange={(e) => setFilter({ ...filter, businessGradeName: e.target.value })}
                    >
                      <MenuItem value="전체">전체</MenuItem>
                      <MenuItem value="A등급">A등급</MenuItem>
                      <MenuItem value="B등급">B등급</MenuItem>
                      <MenuItem value="C등급">C등급</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    label="사업자 핸드폰 번호"
                    value={filter.businessUserPhone}
                    onChange={(e) => setFilter({ ...filter, businessUserPhone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    size="small"
                    margin="dense"
                    label="담당 구역"
                    value={filter.businessAreaIndex}
                    onChange={(e) => setFilter({ ...filter, businessAreaIndex: e.target.value })}
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
                    label="회원 이름"
                    value={filter.userName}
                    onChange={(e) => setFilter({ ...filter, userName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <DatePicker
                    label="분배시간 시작"
                    format="YYYY-MM-DD"
                    value={filter.temporaryStoreMasterChargeTimeStart}
                    onChange={(date) => setFilter({ ...filter, temporaryStoreMasterChargeTimeStart: date })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <DatePicker
                    label="분배시간 종료"
                    format="YYYY-MM-DD"
                    value={filter.temporaryStoreMasterChargeTimeEnd}
                    onChange={(date) => setFilter({ ...filter, temporaryStoreMasterChargeTimeEnd: date })}
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

export default BusinessManAllowanceDetails;
