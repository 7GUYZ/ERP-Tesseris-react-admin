import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField,  Grid, Box,MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


import '../../../styles/deokkyu/StoreList.css'; 
import { getAllowanceList } from '../../../api/auth/DeokkyuAuth';
import NoRowsOverlay from '../../../components/ui/deokkyu/NoRowsOverlay';
import RealTimeChat from '../../../components/chat/RealTimeChat';
import { downloadExcel, downloadSelectedExcel } from '../../../components/feature/jihun/common/ExcelCommon';


const columns = [
  { field: 'businessUserId', headerName: '사업자 ID', width: 120 },
  { field: 'businessUserName', headerName: '사업자 이름', width: 120 },
  { field: 'businessGradeName', headerName: '사업자 등급', width: 120 }, 
  { field: 'businessUserPhone', headerName: '핸드폰 번호', width: 140 }, // ++ businessman 테이블
  { field: 'businessAreaName', headerName: '담당 구역', width: 140 }, // ++ businessman 테이블
  
  { field: 'storeName', headerName: '가맹점 명', width: 160 },
  { field: 'storeUserId', headerName: '가맹점 ID', width: 120 },
  { field: 'storeUserName', headerName: '회원 이름', width: 100 },

  { field: 'temporaryStoreMasterDistributionTime', headerName: '분배시간', width: 120 }, // ++ temporary_store_master 테이블
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
    businessAreaName: '', // 담당 구역
    storeName: '', // 가맹점 명
    storeUserId: '', // 가맹점 ID
    storeUserName: '', // 회원 이름
    temporaryStoreMasterDistributionTimeStart: null,  // 분배시간 시작
    temporaryStoreMasterDistributionTimeEnd: null, // 분배시간 종료
  });

const fetchAllowance = async (params = {}) => {
  try {
    setLoading(true); // 로딩 시작
    const cleanedParams = {};
    const stringFields = [
      'businessUserId', 'businessUserName', 'businessGradeName',
      'businessUserPhone', 'businessAreaName', 'storeName',
      'storeUserId', 'storeUserName'
    ];

    stringFields.forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== '전체') {
        cleanedParams[key] = params[key];
      }
    });

    if (params.temporaryStoreMasterDistributionTimeStart)
      cleanedParams.temporaryStoreMasterDistributionTimeStart = dayjs(params.temporaryStoreMasterDistributionTimeStart).format('YYYY-MM-DD');
    if (params.temporaryStoreMasterDistributionTimeEnd)
      cleanedParams.temporaryStoreMasterDistributionTimeEnd = dayjs(params.temporaryStoreMasterDistributionTimeEnd).format('YYYY-MM-DD');

    console.log('🔍 백엔드로 전송할 파라미터:', cleanedParams);
    
    const response = await getAllowanceList(
      Object.keys(cleanedParams).length > 0 ? cleanedParams : undefined
    );
    
    console.log('✅ 백엔드 응답:', response);

    const data = response.data.map((item, index) => ({
      id: index + 1,
      ...item,
    }));

    setRows(data);
  } catch (error) {
    console.error('🚨 API 호출 실패:', error);
    console.error('🚨 에러 상세 정보:', error.response?.data || error.message);
    alert(`데이터를 불러오는 데 실패했습니다: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoading(false); // 로딩 종료
  }
};


  // 페이지 진입 시 → 빈 검색 조건으로 전체 데이터 자동 조회
  useEffect(() => {
    fetchAllowance({}); // 최초 진입 시에만 로딩중 표시
  }, []);

  // 조회 버튼 클릭 시 → 현재 검색 조건으로 조회
  const handleSearch = () => {
    fetchAllowance({ ...filter }); // 검색 시에는 로딩중 표시 안 함
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
                    value={filter.businessAreaName}
                    onChange={(e) => setFilter({ ...filter, businessAreaName: e.target.value })}
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
                    value={filter.temporaryStoreMasterDistributionTimeStart}
                    onChange={(date) => setFilter({ ...filter, temporaryStoreMasterDistributionTimeStart: date })}
                  />
                </Grid>
                <Grid item xs={3}>
                  <DatePicker
                    label="분배시간 종료"
                    format="YYYY-MM-DD"
                    value={filter.temporaryStoreMasterDistributionTimeEnd}
                    onChange={(date) => setFilter({ ...filter, temporaryStoreMasterDistributionTimeEnd: date })}
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
                  console.log('🔍 선택된 항목:', newSelection, typeof newSelection);
                  
                  // MUI DataGrid 버전별 안전한 처리
                  if (Array.isArray(newSelection)) {
                    // 배열인 경우
                    setSelectedRows(new Set(newSelection));
                  } else if (newSelection && typeof newSelection === 'object' && newSelection.ids) {
                    // 객체에 ids 속성이 있는 경우
                    setSelectedRows(new Set(newSelection.ids));
                  } else if (newSelection && typeof newSelection === 'object') {
                    // 다른 객체 형태인 경우 - 빈 Set으로 초기화
                    console.warn('예상치 못한 선택 데이터 형태:', newSelection);
                    setSelectedRows(new Set());
                  } else {
                    // 그 외의 경우
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
