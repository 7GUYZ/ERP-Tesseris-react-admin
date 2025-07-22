import React, { useRef, useEffect, useState } from 'react';
import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { getBusinessManList } from '../../../api/auth/DeokkyuAuth';

const BusinessManOrgChart = () => {
  const diagramRef = useRef();
  const [businessManData, setBusinessManData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 백엔드에서 사업자 데이터 가져오기
  const fetchBusinessManData = async () => {
    try {
      setLoading(true);
      console.log('🔍 사업자 조직도 데이터 요청 중...');
      
      // params 없이 전체 사업자 데이터 조회
      const response = await getBusinessManList();
      console.log('✅ 사업자 데이터 응답:', response);
      
      const transformedData = transformDataForOrgChart(response.data);
      setBusinessManData(transformedData);
      
    } catch (error) {
      console.error('🚨 사업자 데이터 로딩 실패:', error);
      console.error('🚨 에러 상세:', error.response?.data || error.message);
      
      // 에러 시 샘플 데이터 사용
      const sampleData = getSampleData();
      setBusinessManData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 데이터를 GoJS TreeModel 형태로 변환
  const transformDataForOrgChart = (apiData) => {
    if (!Array.isArray(apiData)) {
      console.warn('API 데이터가 배열이 아닙니다:', apiData);
      return getSampleData();
    }

    console.log('🔄 원본 백엔드 데이터:', apiData);

    return apiData.map((item, index) => {
      // 등급별 색상 설정
      const gradeColors = {
        'A등급': '#f9c74f',   // 노란색 (최고 등급)
        'B등급': '#90be6d',   // 초록색 
        'C등급': '#f94144',   // 빨간색
        'D등급': '#577590',   // 파란색
        '기본': '#43aa8b'     // 청록색
      };

      const transformedItem = {
        // GoJS TreeModel 필수 속성
        key: item.BusinessUserId,                    // 고유 ID
        parent: item.bossUserId || undefined,        // 상급자 ID (null/undefined면 최상위)
        
        // 노드에 표시할 기본 정보
        name: item.BusinessUsername || '이름없음',   // 사업자 이름
        userId: item.BusinessUserId || '미지정',     // 사업자 ID
        
        // 상세 정보
        grade: item.businessGradeName || '미지정',   // 등급
        area: item.businessAreaName || '미지정',     // 담당구역  
        totalStore: item.totalStore || 0,            // 가맹점 수
        totalCm: item.totalCm || 0,                  // 수당
        
        // 스타일
        color: gradeColors[item.businessGradeName] || gradeColors['기본']
      };

      console.log(`🔄 변환된 아이템 ${index + 1}:`, transformedItem);
      return transformedItem;
    });
  };

  // 샘플 데이터 (API 실패 시 또는 개발용)
  const getSampleData = () => {
    return [
      { 
        key: 'CEO001', 
        name: '김대표', 
        userId: 'CEO001',
        grade: '총재', 
        area: '전국', 
        totalStore: 50,
        totalCm: 5000000,
        color: '#f9c74f',
        parent: undefined  // 최상위
      },
      { 
        key: 'MGR001', 
        name: '이지역장', 
        userId: 'MGR001',
        grade: '부총재', 
        area: '서울', 
        totalStore: 25,
        totalCm: 2500000,
        color: '#90be6d',
        parent: 'CEO001'
      },
      { 
        key: 'MGR002', 
        name: '박지역장', 
        userId: 'MGR002',
        grade: '부총재', 
        area: '부산', 
        totalStore: 20,
        totalCm: 2000000,
        color: '#90be6d',
        parent: 'CEO001'
      },
      { 
        key: 'TL001', 
        name: '최팀장', 
        userId: 'TL001',
        grade: '단장', 
        area: '강남구', 
        totalStore: 12,
        totalCm: 1200000,
        color: '#f94144',
        parent: 'MGR001'
      },
      { 
        key: 'TL002', 
        name: '정팀장', 
        userId: 'TL002',
        grade: '단장', 
        area: '서초구', 
        totalStore: 13,
        totalCm: 1300000,
        color: '#f94144',
        parent: 'MGR001'
      },
      { 
        key: 'TL003', 
        name: '김팀장', 
        userId: 'TL003',
        grade: '단장', 
        area: '해운대구', 
        totalStore: 20,
        totalCm: 2000000,
        color: '#f94144',
        parent: 'MGR002'
      },
    ];
  };

  const initDiagram = () => {
    const $ = go.GraphObject.make;

    const diagram =
      $(go.Diagram, {
        // 기본 다이어그램 설정
        'undoManager.isEnabled': true,
        
        // 트리 레이아웃 (위에서 아래로)
        layout: $(go.TreeLayout, {
          angle: 90,           // 90도 = 위에서 아래로 (피라미드 형태)
          layerSpacing: 60,    // 레벨 간 간격
          nodeSpacing: 20,     // 노드 간 간격
          sorting: go.TreeLayout.SortingAscending  // 정렬
        }),
        
        // 자동 스케일링
        initialAutoScale: go.Diagram.Uniform,
        
        // 드래그 허용 (문제가 되던 설정 제거)
        allowDrop: false,
        hasHorizontalScrollbar: true,
        hasVerticalScrollbar: true
      });

    // Node template - 사업자 정보를 더 자세히 표시
    diagram.nodeTemplate =
      $(
        go.Node,
        'Auto',
        { 
          selectionAdorned: true,
          // 노드 크기 자동 조절
          resizable: false 
        },
        $(go.Shape, 'RoundedRectangle',
          {
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 2,
            minSize: new go.Size(120, 80)
          },
          new go.Binding('fill', 'color')
        ),
        
        // 여러 줄 텍스트 정보 표시
        $(go.Panel, 'Vertical',
          { margin: 8 },
          
          // 사업자 이름 (큰 글씨)
          $(go.TextBlock,
            { 
              font: 'bold 14px sans-serif',
              margin: new go.Margin(2, 0, 2, 0),
              editable: false 
            },
            new go.Binding('text', 'name')
          ),
          
          // 등급
          $(go.TextBlock,
            { 
              font: '11px sans-serif',
              margin: new go.Margin(1, 0, 1, 0),
              stroke: '#666'
            },
            new go.Binding('text', 'grade', (grade) => `🏅 ${grade}`)
          ),
          
          // 담당구역
          $(go.TextBlock,
            { 
              font: '10px sans-serif',
              margin: new go.Margin(1, 0, 1, 0),
              stroke: '#666'
            },
            new go.Binding('text', 'area', (area) => `📍 ${area}`)
          ),
          
          // 가맹점 수와 수당
          $(go.Panel, 'Horizontal',
            { margin: new go.Margin(2, 0, 0, 0) },
            
            $(go.TextBlock,
              { 
                font: '9px sans-serif',
                stroke: '#888',
                margin: new go.Margin(0, 4, 0, 0)
              },
              new go.Binding('text', 'totalStore', (count) => `🏪 ${count}개`)
            ),
            
            $(go.TextBlock,
              { 
                font: '9px sans-serif',
                stroke: '#888'
              },
              new go.Binding('text', 'totalCm', (cm) => `💰 ${cm?.toLocaleString() || 0}`)
            )
          )
        )
      );

    // Link template
    diagram.linkTemplate =
      $(
        go.Link,
        { routing: go.Link.Orthogonal },
        $(go.Shape),
        $(go.Shape, { toArrow: 'Standard' })
      );

    // 실제 사업자 데이터로 모델 설정 (처음에는 빈 배열)
    diagram.model = new go.TreeModel([]);

    // Node click 이벤트 - 사업자 상세정보 표시
    diagram.addDiagramListener('ObjectSingleClicked', (e) => {
      const part = e.subject.part;
      if (!(part instanceof go.Node)) return;
      const data = part.data;
      
      const detailInfo = `
📋 사업자 상세 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 이름: ${data.name}
🆔 사업자 ID: ${data.userId}
🏅 등급: ${data.grade}
📍 담당구역: ${data.area}
🏪 담당 가맹점 수: ${data.totalStore}개
💰 총 수당: ${data.totalCm?.toLocaleString() || 0}원
${data.parent ? `👔 상급자 ID: ${data.parent}` : '🔝 최고 책임자'}
      `.trim();
      
      alert(detailInfo);
    });

    return diagram;
  };

  // 데이터가 변경될 때 다이어그램 업데이트
  const updateDiagram = () => {
    if (diagramRef.current && businessManData.length > 0) {
      const diagram = diagramRef.current.getDiagram();
      if (diagram) {
        console.log('🔄 조직도 데이터 업데이트:', businessManData);
        diagram.model = new go.TreeModel(businessManData);
      }
    }
  };

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    fetchBusinessManData();
  }, []);

  // 데이터 변경 시 다이어그램 업데이트
  useEffect(() => {
    updateDiagram();
  }, [businessManData]);

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      {/* 로딩 상태 표시 */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🔄 사업자 조직도 로딩 중...
        </div>
      )}
      
      {/* 새로고침 버튼 */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 999
      }}>
        <button
          onClick={fetchBusinessManData}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '로딩중...' : '🔄 새로고침'}
        </button>
      </div>

      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="diagram-component"
        style={{ width: '100%', height: '100%' }}
        ref={diagramRef}
      />
    </div>
  );
};

export default BusinessManOrgChart;
