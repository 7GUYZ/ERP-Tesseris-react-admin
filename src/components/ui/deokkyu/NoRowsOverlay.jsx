
import { GridOverlay } from '@mui/x-data-grid';

function NoRowsOverlay({ loading }) {
  return (
    <GridOverlay>
      <div style={{ padding: 10 }}>
        {loading ? '로딩 중...' : '표시할 데이터가 없습니다.'}
      </div>
    </GridOverlay>
  );
}

export default NoRowsOverlay;