import React, { useRef, useEffect, useState } from 'react';
import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import { getBusinessManList, setupInterceptors } from '../../../api/auth/DeokkyuAuth';
import BusinessManDetailModal from '../../../components/feature/deokkyu/dmodal/BusinessManDetailModal';
import '../../../styles/deokkyu/BusinessManOrgChart.css';

const BusinessManOrgChart = () => {
  const diagramRef = useRef();
  const [businessManData, setBusinessManData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBusinessManId, setSelectedBusinessManId] = useState(null);
  const [selectedBusinessManData, setSelectedBusinessManData] = useState(null);

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
      // 등급별 색상 설정 (거의 흰색 계열)
      const gradeColors = {
        'A등급': '#f8f9fa',   // 매우 연한 회색
        'B등급': '#f1f3f4',   // 연한 회색
        'C등급': '#e8eaed',   // 약간 진한 회색
        'D등급': '#dadce0',   // 중간 회색
        '기본': '#f8f9fa'     // 매우 연한 회색
      };

      const transformedItem = {
        // GoJS TreeModel 필수 속성
        key: item.businessManId,                     // user_index로 얻은 users_id
        parent: item.bossUserIndex || undefined,     // boss_user_index로 얻은 users_id (null/undefined면 최상위)
        
        // 노드에 표시할 기본 정보
        name: item.businessManName || '이름없음',    // users 테이블에서 얻은 name
        userId: item.businessManId || '미지정',      // 사업자 ID
        
        // 상세 정보
        grade: item.businessGradeName || '미지정',   // business_grade 테이블에서 얻은 business_grade_name
        area: item.businessAreaName || '미지정',     // business_area 테이블에서 얻은 business_area_name
        
        // 개인 실적
        currentTotalStore: item.currentTotalStore || 0,  // 본인 담당 가맹점 수
        
        // 하위 직원들 집계 (백엔드에서 계산된 값)
        totalStore: item.totalStore || 0,            // 하위 사업자들의 currentTotalStore 합계
        allowance: item.allowance || 0,              // temporary_store_detail 테이블의 temporary_store_cm_value 합계
        
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
        currentTotalStore: 5,
        totalStore: 50,
        allowance: 5000000,
        color: '#f8f9fa',
        parent: undefined  // 최상위
      },
      { 
        key: 'MGR001', 
        name: '이지역장', 
        userId: 'MGR001',
        grade: '부총재', 
        area: '서울', 
        currentTotalStore: 3,
        totalStore: 25,
        allowance: 2500000,
        color: '#f1f3f4',
        parent: 'CEO001'
      },
      { 
        key: 'MGR002', 
        name: '박지역장', 
        userId: 'MGR002',
        grade: '부총재', 
        area: '부산', 
        currentTotalStore: 2,
        totalStore: 20,
        allowance: 2000000,
        color: '#f1f3f4',
        parent: 'CEO001'
      },
      { 
        key: 'TL001', 
        name: '최팀장', 
        userId: 'TL001',
        grade: '단장', 
        area: '강남구', 
        currentTotalStore: 12,
        totalStore: 12,
        allowance: 1200000,
        color: '#e8eaed',
        parent: 'MGR001'
      },
      { 
        key: 'TL002', 
        name: '정팀장', 
        userId: 'TL002',
        grade: '단장', 
        area: '서초구', 
        currentTotalStore: 13,
        totalStore: 13,
        allowance: 1300000,
        color: '#e8eaed',
        parent: 'MGR001'
      },
      { 
        key: 'TL003', 
        name: '김팀장', 
        userId: 'TL003',
        grade: '단장', 
        area: '해운대구', 
        currentTotalStore: 20,
        totalStore: 20,
        allowance: 2000000,
        color: '#e8eaed',
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
          layerSpacing: 80,    // 레벨 간 간격 (더 넓게)
          nodeSpacing: 30,     // 노드 간 간격 (더 넓게)
          sorting: go.TreeLayout.SortingAscending  // 정렬
        }),
        
        // 자동 스케일링
        initialAutoScale: go.Diagram.Uniform,
        
        // 드래그 허용 (문제가 되던 설정 제거)
        allowDrop: false,
        hasHorizontalScrollbar: true,
        hasVerticalScrollbar: true,
        
        // CSS 스타일링을 위한 설정
        'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,  // 마우스 휠로 줌
        'animationManager.isEnabled': true,                          // 애니메이션 활성화
        'animationManager.duration': 400,                            // 애니메이션 지속시간
        'grid.visible': false,                                       // 그리드 숨김 (깔끔하게)
        

      });

    // Node template - 사업자 정보를 더 자세히 표시
    diagram.nodeTemplate =
      $(
        go.Node,
        'Auto',
        { 
          selectionAdorned: true,
          resizable: false,
          // CSS 클래스 적용
          _cssClass: 'org-chart-node',
          // 호버 효과를 위한 마우스 이벤트
          mouseEnter: function(e, node) {
            node.findObject("SHAPE").stroke = "#2196F3";
            node.findObject("SHAPE").strokeWidth = 2;
          },
          mouseLeave: function(e, node) {
            if (!node.isSelected) {
              node.findObject("SHAPE").stroke = "#e0e0e0";
              node.findObject("SHAPE").strokeWidth = 1;
            }
          }
        },
        // 배경 Shape (그림자 효과 없이)
        $(go.Shape, 'RoundedRectangle',
          {
            name: "SHAPE",
            fill: 'white',
            stroke: '#e0e0e0',
            strokeWidth: 1,
            minSize: new go.Size(140, 100)
          },
          new go.Binding('fill', 'color'),
          // 선택 시 파란색 테두리
          new go.Binding('stroke', '', function() { 
            return this.isSelected ? '#2196F3' : '#e0e0e0'; 
          }).ofObject()
        ),
        
        // 여러 줄 텍스트 정보 표시
        $(go.Panel, 'Vertical',
          { margin: 12 },
          
          // 사업자 이름 (큰 글씨)
          $(go.TextBlock,
            { 
              font: 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: new go.Margin(0, 0, 4, 0),
              editable: false,
              stroke: '#2c3e50'
            },
            new go.Binding('text', 'name')
          ),
          
          // 등급
          $(go.TextBlock,
            { 
              font: '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: new go.Margin(2, 0, 2, 0),
              stroke: '#7f8c8d'
            },
            new go.Binding('text', 'grade', (grade) => `🏅 ${grade}`)
          ),
          
          // 담당구역
          $(go.TextBlock,
            { 
              font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: new go.Margin(2, 0, 2, 0),
              stroke: '#7f8c8d'
            },
            new go.Binding('text', 'area', (area) => `📍 ${area}`)
          ),
          
          // 구분선
          $(go.Shape, 'LineH',
            { 
              stroke: '#ecf0f1', 
              strokeWidth: 1,
              margin: new go.Margin(4, 0, 4, 0)
            }
          ),
          
          // 개인 담당 가맹점 수
          $(go.TextBlock,
            { 
              font: '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              stroke: '#95a5a6',
              margin: new go.Margin(2, 0, 2, 0)
            },
            new go.Binding('text', 'currentTotalStore', (count) => `🏪 개인: ${count}개`)
          ),
          
          // 하위 직원들 집계 정보
          $(go.Panel, 'Horizontal',
            { margin: new go.Margin(2, 0, 0, 0) },
            
            $(go.TextBlock,
              { 
                font: '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                stroke: '#95a5a6',
                margin: new go.Margin(0, 8, 0, 0)
              },
              new go.Binding('text', 'totalStore', (count) => `📊 총: ${count}개`)
            ),
            
            $(go.TextBlock,
              { 
                font: '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                stroke: '#95a5a6'
              },
              new go.Binding('text', 'allowance', (allowance) => `💰 ${allowance?.toLocaleString() || 0}`)
            )
          )
        )
      );

    // Link template - 더 예쁜 연결선
    diagram.linkTemplate =
      $(
        go.Link,
        { 
          routing: go.Link.Orthogonal,
          corner: 5,
          selectionAdorned: true
        },
        $(go.Shape,
          { 
            stroke: '#bdc3c7',
            strokeWidth: 2,
            // 선택 시 색상 변경
            strokeDashArray: [0, 0]
          },
          new go.Binding('stroke', '', function() { return '#3498db'; }).ofObject('isSelected')
        ),
        $(go.Shape, 
          { 
            toArrow: 'Standard',
            fill: '#bdc3c7',
            stroke: '#bdc3c7'
          },
          new go.Binding('fill', '', function() { return '#3498db'; }).ofObject('isSelected'),
          new go.Binding('stroke', '', function() { return '#3498db'; }).ofObject('isSelected')
        )
      );

    // 실제 사업자 데이터로 모델 설정 (처음에는 빈 배열)
    diagram.model = new go.TreeModel([]);

    // Node click 이벤트 - 모달로 사업자 상세정보 표시
    diagram.addDiagramListener('ObjectSingleClicked', (e) => {
      const part = e.subject.part;
      if (!(part instanceof go.Node)) return;
      const data = part.data;
      
      setSelectedBusinessManId(data.key || data.userId);
      setSelectedBusinessManData(data);
      setModalOpen(true);
    });



    return diagram;
  };

  // 검색 기능
  const searchNode = (searchTerm) => {
    if (!diagramRef.current || !searchTerm.trim()) return;
    
    const diagram = diagramRef.current.getDiagram();
    if (!diagram) return;

    // 모든 노드에서 검색
    const foundNode = diagram.findNodeForKey(searchTerm) || 
                     diagram.findNodeByDataKey('name', searchTerm) ||
                     diagram.findNodeByDataKey('userId', searchTerm);

    if (foundNode) {
      // 해당 노드로 줌 및 하이라이트
      diagram.select(foundNode);
      diagram.scrollToRect(foundNode.actualBounds);
      
      // 하이라이트 효과
      foundNode.isSelected = true;
      setTimeout(() => {
        foundNode.isSelected = false;
      }, 2000);
      
      // 검색 성공 시 추가 처리 없음
    } else {
      alert('검색 결과가 없습니다.');
    }
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

  // 컴포넌트 마운트 시 인터셉터 설정 및 데이터 로딩
  useEffect(() => {
    // 인터셉터 설정 (인증 토큰 자동 추가)
    setupInterceptors();
    
    // 데이터 로딩
    fetchBusinessManData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 마운트 시에만 실행

  // 데이터 변경 시 다이어그램 업데이트
  useEffect(() => {
    updateDiagram();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessManData]); // businessManData 변경 시에만 실행

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      {/* 로딩 상태 표시 */}
      {loading && (
        <div className="org-chart-loading" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
      
      {/* 검색 및 컨트롤 패널 */}
      <div className="org-chart-controls" style={{
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 999,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 16px'
      }}>
        {/* 검색 입력 */}
        <input
          type="text"
          className="org-chart-search-input"
          placeholder="사업자 ID 또는 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchNode(searchTerm)}
          style={{
            padding: '10px 16px',
            width: '280px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          className="org-chart-button org-chart-search-button"
          onClick={() => searchNode(searchTerm)}
          style={{
            padding: '10px 20px',
            fontSize: '14px'
          }}
        >
          🔍 검색
        </button>
      </div>

      <ReactDiagram
        initDiagram={initDiagram}
        divClassName="org-chart-diagram"
        style={{ width: '100%', height: '100%' }}
        ref={diagramRef}
      />
      
      {/* 사업자 상세정보 모달 */}
      <BusinessManDetailModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBusinessManId(null);
          setSelectedBusinessManData(null);
        }}
        businessManId={selectedBusinessManId}
        initialData={selectedBusinessManData}
      />
    </div>
  );
};

export default BusinessManOrgChart;
