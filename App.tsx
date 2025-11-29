import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { MyFlowsScreen } from './screens/MyFlowsScreen';
import { FlowDetailScreen } from './screens/FlowDetailScreen';
import { BottomNav } from './components/BottomNav';
import { Flow, FlowNode, FlowEdge } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate the Boiler Flow Data
const generateBoilerFlow = (): Flow => {
  const steps = [
    { label: "壹. 起爐前檢查及通知", type: "milestone" },
    { label: "1. Email 通知清潔 CEMS 偵測器（需提前 3 天通知 Y9 郭光釗）。", type: "task" },
    { label: "2. 檢查鍋爐本體、爐膛、節熱器、BFG 加熱器、燃料管線等設備及耐火材是否良好可用。", type: "task" },
    { label: "3. 檢查風道、煙道各人孔封閉是否良好。", type: "task" },
    { label: "4. 確認所有管線盲封（氮氣、燃氣管線）已拆除完畢。", type: "task" },
    { label: "5. 確認鍋爐各安全閥是否設定安裝完成，且 GAG 治具已取下。", type: "task" },
    { label: "6. 檢查 ERV 前關斷閥（MS-VB12、14）是否為開啟狀態。", type: "task" },
    { label: "7. 將 BLR-4 MS 緊急排放控制閥 PCV-MS51-D 擺手動並關閉。", type: "task" },
    { label: "8. 檢查空氣預熱器軸承潤滑油泵、驅動減速機、各燃燒器的 BTV、火燄偵測器是否良好可用。", type: "task" },
    { label: "9. 檢查 MS 及 TG 各洩水氣動閥、TRAP 作動是否正常，前後關斷閥是否開啟（包含 DP001~003 的液位控制閥、MS DP001 底排開啟等）。", type: "task" },
    { label: "10. 檢查 AC 管線進出口閥皆開啟，管線暢通無阻塞。", type: "task" },
    { label: "11. 檢查 PA、IA、N2 供應正常，各氣動閥 IA 關斷閥開啟。", type: "task" },
    { label: "12. 檢查引風機、送風機、火焰偵測器冷卻風扇系統是否良好可用。", type: "task" },
    { label: "13. 檢查各控制系統安全連鎖裝置及其他儀錶設備功能是否良好可用。", type: "task" },
    { label: "14. 檢查各 Wind box、空氣調節裝置及風門是否定位，且作動正常。", type: "task" },
    { label: "15. 各輔機設備（如 GAH、IDF、FDF 等）進行回復並送電。", type: "task" },
    { label: "16. 通知 UDC、主變電預訂起爐時間。", type: "task" },
    
    { label: "貳. 起爐前之準備", type: "milestone" },
    { label: "17. 汽鼓氮封二道關斷閥全關，兩關斷閥中間之洩放閥全開。", type: "task" },
    { label: "18. 鍋爐補水：以 CD 水逆洗沖放兩次，加水至汽鼓液位計第一顆中間，並加入起爐用藥。", type: "task" },
    { label: "19. AS 暖管作業：利用另一鍋爐 AS 系統進行暖管作業至 BFG-HTR、SJAE 等前。", type: "task" },
    { label: "20. BFG-HTR 以 CD 進行加水作業，確認各級溢流閥皆有水滿出後關閉閥件。", type: "task" },
    { label: "21. BFG-HTR 五道抽真空，真空壓力須達 -0.75 kg/cm2。", type: "task" },
    { label: "22. Deaerator 補水及加藥作業：進行 Rinse 沖放二次，補 DMW 水至 Normal 水位，並添加中和胺與脫氧劑。", type: "task" },
    { label: "23. 測試主蒸汽洩水馬達閥作動，將 MS 管線洩水前馬達閥全開、後馬達閥保持 10~20% 開度。", type: "task" },
    { label: "24. 關閉所有非必要的鍋爐通氣閥，僅保留汽鼓 vent 閥、第二道過熱器後 MS 管線 vent 等特定閥件。", type: "task" },
    { label: "25. 所有燃氣管線皆已使用 N2 purge。", type: "task" },
    { label: "26. 啟動空氣預熱器（GAH），檢查油位並進行電、氣動馬達連鎖測試。", type: "task" },

    { label: "參. 送風", type: "milestone" },
    { label: "27. 啟動引風機（IDF）並確認各運轉數據正常。", type: "task" },
    { label: "28. 啟動送風機（FDF）並確認各運轉數據正常。", type: "task" },
    { label: "29. 調整送風機及引風機進口風門，使爐膛空氣流量保持為全載之 30% 以上，爐膛壓力維持在 -15mmWc 左右。", type: "task" },
    { label: "30. 啟動火焰偵測器冷卻風扇（FDCF）並確認運轉正常。", type: "task" },

    { label: "肆. 點火起爐升壓", type: "milestone" },
    { label: "31. 確定 MFT 條件及爐膛 Purge 條件成立後，進行吹清 5 分鐘。", type: "task" },
    { label: "32. 燃料管線（NG、M-COG、STBL-COG 及 BFG）持續進行啟用 purge，監測氧氣含量直到 O2 < 1%。", type: "task" },
    { label: "33. 進行 M-COG U 型水封卸除。", type: "task" },
    { label: "34. 請 UDC 進行燃料總閥解鎖，依序導入 NG (IGN-NG)、STBL-COG、STBL-NG、Main-COG 及 BFG 至 HTV 前備用。", type: "task" },
    { label: "35. 點燃 IGN-NG，進行功能測試。", type: "task" },
    { label: "36. 點燃 STBL-COG，進行功能測試。", type: "task" },
    { label: "37. 繼續點燃 STBL-COG，按升溫曲線升壓（平均升溫速率控制在 45~55℃/h，總時程控制於 8 小時上下）。", type: "task" },
    { label: "38. 持續排放取樣點及洩水閥 6 小時（除了 LP 取樣點及洩水閥以外）。", type: "task" },
    { label: "39. 須注意起爐過程中汽鼓上下金屬溫差不可超過 55℃。", type: "task" },
    { label: "40. 汽鼓壓力達 1.5kg/cm2G 時，關閉汽鼓 vent 閥及過熱器 vent。", type: "task" },
    { label: "41. 汽鼓壓力達 5kg/cm2，啟用 CBD 系統並將流量調整至 5t/h。", type: "task" },
    { label: "42. 汽鼓壓力達 10kg/cm2 時，進行東西側汽鼓玻璃液位計沖放。", type: "task" },
    { label: "43. BFP 啟動後，依據爐水或冷凝水 pH 值進行清罐劑、中和胺或脫氧劑的添加調整。", type: "task" },

    { label: "伍. 發電機併聯、鍋爐升載", type: "milestone" },
    { label: "44. 通知主變電，預計發電機併聯時間。", type: "task" },
    { label: "45. 配合發電機併聯，漸將 MS drain 全關。", type: "task" },
    { label: "46. 於蒸汽輸出達 20 T/H 以上時，開啟噴水控制閥 Block-Valve。", type: "task" },
    { label: "47. 點燃 BFG，進行功能測試。", type: "task" },
    { label: "48. 配合 TG 升載，加點燃燒器及燃料。", type: "task" },
    { label: "49. 當 CEMS O2 數值低於 8% 以下，需將 CEMS 切換為正常運轉狀態。", type: "task" },
  ];

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let currentY = 50;
  const startX = 60; 

  steps.forEach((step, index) => {
    const id = `node-${index}`;
    // Using a consistent height and tighter spacing
    const nodeHeight = 100;
    
    nodes.push({
      id,
      label: step.label,
      type: step.type as any,
      x: startX,
      y: currentY,
      width: 250,
      height: nodeHeight, 
      status: 'pending'
    });

    if (index > 0) {
      edges.push({
        id: `edge-${index}`,
        source: `node-${index - 1}`,
        target: id
      });
    }

    // REDUCED SPACING:
    // Was 150, now 130. Since height is 100, gap is 30px.
    currentY += 130; 
  });

  return {
    id: 'boiler-sop',
    title: '鍋爐起爐標準作業程序',
    description: 'Boiler Start-up Standard Operating Procedure',
    updatedAt: new Date(),
    nodes,
    edges
  };
};

// Dummy Initial Data
const INITIAL_FLOWS: Flow[] = [
  generateBoilerFlow(), 
  {
    id: '1',
    title: 'Website Redesign Flow',
    description: 'Main workflow for the Q4 redesign project',
    updatedAt: new Date(),
    edges: [
        { id: 'e1', source: 'start', target: 't1' },
        { id: 'e2', source: 'start', target: 't2' },
        { id: 'e3', source: 't1', target: 't3' },
        { id: 'e4', source: 't2', target: 't4' },
        { id: 'e5', source: 't3', target: 'm1' },
        { id: 'e6', source: 't4', target: 'm1' },
    ],
    nodes: [
      { id: 'start', label: 'Start: Project Kick-off', type: 'start', x: 80, y: 40, status: 'completed' },
      { id: 't1', label: 'Task 1.1: Research Competitors', type: 'task', x: -30, y: 180, status: 'pending' },
      { id: 't2', label: 'Task 2.1: Define User Personas', type: 'task', x: 200, y: 180, status: 'completed' },
      { id: 't3', label: 'Task 1.2: Analyze Market Trends', type: 'task', x: -30, y: 320, status: 'pending' },
      { id: 't4', label: 'Task 2.2: Create Wireframes', type: 'task', x: 200, y: 320, status: 'pending' },
      { id: 'm1', label: 'Milestone: Initial Design Review', type: 'milestone', x: 80, y: 460, status: 'pending' },
    ]
  },
  {
    id: '2',
    title: 'Weekly Newsletter',
    updatedAt: new Date(),
    nodes: [
        { id: 'n1', label: 'Draft Content', type: 'start', x: 100, y: 50, status: 'completed' },
        { id: 'n2', label: 'Proofread', type: 'task', x: 100, y: 200, status: 'pending' },
        { id: 'n3', label: 'Schedule Send', type: 'task', x: 100, y: 350, status: 'pending' },
    ],
    edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
    ]
  },
];

const MainLayout = () => (
  <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
    <Outlet />
    <BottomNav />
  </div>
);

const DetailLayout = () => (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      <Outlet />
    </div>
);

export default function App() {
  const [flows, setFlows] = useState<Flow[]>(INITIAL_FLOWS);
  const [templates, setTemplates] = useState<Flow[]>([]);

  const updateFlow = (updatedFlow: Flow) => {
    setFlows(prev => prev.map(f => f.id === updatedFlow.id ? updatedFlow : f));
  };

  const saveAsTemplate = (flowToSave: Flow) => {
      // Create a copy as template, reset status and IDs if you want, 
      // but for simplicity we keep structure.
      const newTemplate: Flow = {
          ...flowToSave,
          id: uuidv4(), // New ID for the template itself
          title: `${flowToSave.title} (Template)`,
          nodes: flowToSave.nodes.map(n => ({...n, status: 'pending'})), // Reset status
          updatedAt: new Date()
      };
      setTemplates(prev => [...prev, newTemplate]);
      alert("Flow saved as Template!");
  };

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={
            <MyFlowsScreen 
                flows={flows} 
                setFlows={setFlows} 
                templates={templates}
            />
          } />
        </Route>
        <Route element={<DetailLayout />}>
           <Route path="/flow/:id" element={
               <FlowDetailScreen 
                    flows={flows} 
                    updateFlow={updateFlow} 
                    onSaveTemplate={saveAsTemplate}
                />
            } />
        </Route>
      </Routes>
    </HashRouter>
  );
}