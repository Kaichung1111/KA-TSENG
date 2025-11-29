import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flow, FlowNode, FlowEdge } from '../types';
import { ChevronLeft, Check, Trash, LinkIcon, SquarePlus, LayoutTemplate } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';

interface FlowDetailScreenProps {
  flows: Flow[];
  updateFlow: (updatedFlow: Flow) => void;
  onSaveTemplate: (flow: Flow) => void;
}

export const FlowDetailScreen: React.FC<FlowDetailScreenProps> = ({ flows, updateFlow, onSaveTemplate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [mode, setMode] = useState<'use' | 'edit'>('use');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Connection Mode State
  const [connectMode, setConnectMode] = useState<'idle' | 'source'>('idle');
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const nodeStartRef = useRef<{ x: number, y: number } | null>(null);
  const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    const found = flows.find(f => f.id === id);
    if (found) {
      setFlow(JSON.parse(JSON.stringify(found))); 
    }
  }, [id, flows]);

  const handleSave = () => {
    if (flow) {
      updateFlow(flow);
      setMode('use');
      setConnectMode('idle');
      setConnectSourceId(null);
      setSelectedNodeId(null);
    }
  };

  // Toggle node completion status
  const handleToggleNodeStatus = (nodeId: string) => {
    if (mode === 'edit' || !flow) return;
    
    const newNodes = flow.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, status: n.status === 'completed' ? 'pending' : 'completed' } as FlowNode;
      }
      return n;
    });
    
    const updatedFlow = { ...flow, nodes: newNodes };
    setFlow(updatedFlow);
    updateFlow(updatedFlow); 
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (mode !== 'edit' || !flow) return;
    e.stopPropagation();

    // Check if clicking resize handle
    const target = e.target as HTMLElement;
    if (target.dataset.handle === 'resize') {
        const node = flow.nodes.find(n => n.id === nodeId);
        if (node) {
            setIsResizing(true);
            setSelectedNodeId(nodeId);
            resizeStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                w: node.width || 220, // Default width
                h: node.height || 100 // Default height
            };
        }
        return;
    }

    // Handle Connection Logic
    if (connectMode === 'source') {
        if (connectSourceId && connectSourceId !== nodeId) {
            // Create Connection
            const newEdge: FlowEdge = {
                id: uuidv4(),
                source: connectSourceId,
                target: nodeId
            };
            setFlow({
                ...flow,
                edges: [...flow.edges, newEdge]
            });
            setConnectMode('idle');
            setConnectSourceId(null);
        } else {
            // Select Source (if clicking current source, maybe deselect? or just keep it)
            setConnectSourceId(nodeId);
        }
        return;
    }

    // Handle Dragging Logic
    setSelectedNodeId(nodeId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const node = flow.nodes.find(n => n.id === nodeId);
    if (node) {
        nodeStartRef.current = { x: node.x, y: node.y };
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedNodeId || !flow || mode !== 'edit') return;

    // Resizing
    if (isResizing && resizeStartRef.current) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        
        setFlow(prev => {
            if (!prev) return null;
            return {
                ...prev,
                nodes: prev.nodes.map(n => {
                    if (n.id === selectedNodeId) {
                        return {
                            ...n,
                            width: Math.max(150, resizeStartRef.current!.w + dx), // Min width 150
                            height: Math.max(80, resizeStartRef.current!.h + dy)  // Min height 80
                        };
                    }
                    return n;
                })
            };
        });
        return;
    }

    // Dragging
    if (isDragging && dragStartRef.current && nodeStartRef.current && connectMode === 'idle') {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        setFlow(prev => {
            if (!prev) return null;
            return {
                ...prev,
                nodes: prev.nodes.map(n => {
                    if (n.id === selectedNodeId) {
                        return { 
                            ...n, 
                            x: nodeStartRef.current!.x + dx, 
                            y: nodeStartRef.current!.y + dy 
                        };
                    }
                    return n;
                })
            };
        });
    }
  }, [isDragging, isResizing, selectedNodeId, flow, mode, connectMode]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragStartRef.current = null;
    nodeStartRef.current = null;
    resizeStartRef.current = null;
  };

  const deleteSelectedNode = () => {
      if(!selectedNodeId || !flow) return;
      setFlow({
          ...flow,
          nodes: flow.nodes.filter(n => n.id !== selectedNodeId),
          edges: flow.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId)
      });
      setSelectedNodeId(null);
  };

  const addNewNode = () => {
      if(!flow) return;
      
      // Calculate center of the visible area
      let startX = 100;
      let startY = 100;

      if (containerRef.current) {
          const scrollTop = containerRef.current.scrollTop;
          const clientHeight = containerRef.current.clientHeight;
          const clientWidth = containerRef.current.clientWidth;
          
          // Place in middle of screen vertically + scroll offset
          startY = scrollTop + (clientHeight / 2) - 50; 
          // Center horizontally
          startX = (clientWidth / 2) - 110; 
      }

      // If there are existing nodes, try not to overlap exactly if possible
      if (flow.nodes.length > 0) {
          const lastNode = flow.nodes[flow.nodes.length - 1];
          if (!containerRef.current) {
             startX = lastNode.x;
             // REDUCED SPACING for new nodes too (was 150)
             startY = lastNode.y + 140; 
          }
      }

      const newNode: FlowNode = {
          id: uuidv4(),
          label: 'New Step',
          type: 'task',
          x: startX,
          y: startY,
          width: 220,
          height: 100,
          status: 'pending'
      };
      setFlow({
          ...flow,
          nodes: [...flow.nodes, newNode]
      });
      setSelectedNodeId(newNode.id);
  };

  const toggleConnectMode = () => {
      if (connectMode === 'idle') {
          setConnectMode('source');
          setConnectSourceId(null);
          setSelectedNodeId(null); // Deselect for clarity
      } else {
          setConnectMode('idle');
          setConnectSourceId(null);
      }
  };

  if (!flow) return <div className="p-8 text-center text-gray-500">Flow not found</div>;

  return (
    <div className="flex flex-col h-screen bg-background relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="px-4 py-3 bg-[#F9F9FB] border-b border-gray-200 flex items-center justify-between z-20 shadow-sm gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary -ml-2 flex-shrink-0">
          <ChevronLeft className="w-7 h-7" />
        </button>
        
        {/* Editable Title */}
        <div className="flex-1 flex justify-center mx-1 overflow-hidden">
            {mode === 'edit' ? (
                <input 
                    type="text" 
                    value={flow.title}
                    onChange={(e) => setFlow({...flow, title: e.target.value})}
                    className="font-semibold text-[17px] text-black text-center bg-transparent border-b border-primary/50 outline-none w-full max-w-[240px] px-1"
                />
            ) : (
                <div className="font-semibold text-[17px] text-black truncate max-w-[240px]">
                    {flow.title}
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            {mode === 'edit' && (
                <button 
                    onClick={() => onSaveTemplate(flow)}
                    className="text-gray-500 hover:text-primary transition-colors p-1"
                    title="Save as Template"
                >
                    <LayoutTemplate className="w-6 h-6" />
                </button>
            )}
            <button 
                onClick={handleSave}
                className={`font-semibold text-[17px] text-primary flex-shrink-0 ${mode === 'edit' ? 'visible' : 'invisible'}`}
            >
            Save
            </button>
        </div>
      </div>

      {/* Guidance Banners */}
      {mode === 'edit' && connectMode !== 'idle' && (
          <div className="bg-primary text-white px-4 py-3 text-center text-sm font-semibold z-20 shadow-md animate-pulse">
              {connectSourceId 
                ? 'Select the next node to connect to.' 
                : 'Select the starting node.'}
          </div>
      )}

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className={`flex-1 relative overflow-auto ${mode === 'edit' ? 'grid-pattern bg-white' : 'bg-[#F2F2F7]'} touch-none`}
        onMouseMove={handleMouseMove}
        onClick={() => {
            if (mode === 'edit' && connectMode === 'idle' && !isDragging && !isResizing) {
                setSelectedNodeId(null);
            }
        }}
      >
        {mode === 'use' && (
             <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={() => setMode('edit')}
                    className="bg-gray-200/80 backdrop-blur-sm text-black text-[13px] font-medium px-4 py-2 rounded-lg shadow-sm border border-gray-300 active:bg-gray-300 transition-colors"
                >
                    Switch to Edit Mode
                </button>
             </div>
        )}

        <div className="min-w-full min-h-full relative">
            {/* SVG Layer for Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                {flow.edges.map(edge => {
                    const source = flow.nodes.find(n => n.id === edge.source);
                    const target = flow.nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;

                    const sourceW = source.width || 220;
                    const sourceH = source.height || (mode === 'use' ? 80 : 100);
                    const targetW = target.width || 220;

                    // Calculate connection points (bottom center to top center)
                    const startX = source.x + sourceW / 2;
                    const startY = source.y + sourceH; 
                    const endX = target.x + targetW / 2;
                    const endY = target.y;

                    let d = '';
                    const color = mode === 'use' ? '#007AFF' : '#C7C7CC';
                    
                    if (mode === 'use') {
                        // Orthogonal routing for Use Mode
                        const midY = startY + (endY - startY) / 2;
                        d = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                        
                        return (
                            <g key={edge.id}>
                                <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
                                <polygon points={`${endX},${endY} ${endX-5},${endY-8} ${endX+5},${endY-8}`} fill={color} />
                            </g>
                        );
                    } else {
                        // Curved routing for Edit Mode
                        // Adjust control points based on distance to avoid huge loops if nodes are close
                        const distance = Math.abs(endY - startY);
                        const controlOffset = Math.min(50, distance / 2);

                        const controlY1 = startY + controlOffset;
                        const controlY2 = endY - controlOffset;
                        d = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

                        return (
                            <g key={edge.id}>
                                <path d={d} stroke={color} strokeWidth="2" strokeDasharray="5,5" fill="none" />
                                <polygon points={`${endX},${endY} ${endX-5},${endY-5} ${endX+5},${endY-5}`} fill={color} />
                            </g>
                        );
                    }
                })}
            </svg>

            {/* Nodes Layer */}
            {flow.nodes.map(node => {
                const width = node.width || 220;
                const heightStyle = mode === 'edit' ? (node.height || 100) + 'px' : 'auto';

                return (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{
                            transform: `translate(${node.x}px, ${node.y}px)`,
                            width: `${width}px`,
                            height: heightStyle
                        }}
                        className={`
                            absolute top-0 left-0
                            flex flex-col transition-shadow
                            ${mode === 'edit' ? 'cursor-move' : ''}
                        `}
                    >
                        {mode === 'use' ? (
                            // USE MODE CARD
                            <div 
                                onClick={() => handleToggleNodeStatus(node.id)}
                                className={`
                                    rounded-xl p-4 shadow-sm border border-gray-200/50 relative 
                                    transition-all active:scale-[0.98] cursor-pointer h-full flex items-center
                                    ${node.status === 'completed' 
                                        ? 'bg-success text-white' 
                                        : 'bg-white text-black'}
                                `}
                            >
                                <div className="flex items-start gap-3 w-full h-full">
                                    <div className={`
                                        w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2
                                        ${node.status === 'completed' 
                                            ? 'bg-transparent border-white' 
                                            : 'bg-white border-gray-300'}
                                    `}>
                                        {node.status === 'completed' && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="text-[17px] font-medium leading-snug whitespace-pre-wrap break-words w-full">
                                        {node.label}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // EDIT MODE CARD
                            <div 
                                className={`
                                    rounded-xl p-2 bg-white shadow-sm border-2 h-full flex flex-col relative group
                                    ${selectedNodeId === node.id ? 'border-primary z-30 ring-4 ring-primary/10' : 'border-primary/40 z-10'}
                                    ${connectSourceId === node.id ? 'ring-4 ring-primary border-primary' : ''}
                                `}
                            >
                                {/* Connection Ports - Visual Only */}
                                {connectMode !== 'idle' && (
                                    <>
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm z-40 animate-pulse" />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm z-40 animate-pulse" />
                                    </>
                                )}

                                <textarea
                                    value={node.label}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFlow(prev => prev ? ({...prev, nodes: prev.nodes.map(n => n.id === node.id ? {...n, label: val} : n)}) : null);
                                    }}
                                    className="w-full h-full bg-transparent outline-none text-black font-medium text-center resize-none p-1 whitespace-pre-wrap break-words"
                                    onMouseDown={(e) => e.stopPropagation()} 
                                    placeholder="Enter text..."
                                />
                                
                                {/* Resize Handle */}
                                {selectedNodeId === node.id && (
                                    <div 
                                        data-handle="resize"
                                        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1 z-50"
                                    >
                                        <div className="w-4 h-4 border-r-2 border-b-2 border-primary pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
      
      {/* Edit Mode Toolbar */}
      {mode === 'edit' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-2 flex gap-6 z-30 px-6">
              <button 
                onClick={addNewNode} 
                className="flex flex-col items-center gap-1 p-2 text-primary hover:bg-blue-50/50 rounded-xl min-w-[60px] active:scale-95 transition-transform"
              >
                  <SquarePlus className="w-7 h-7" />
                  <span className="text-[11px] font-semibold">Add Step</span>
              </button>
              
              <button 
                onClick={toggleConnectMode} 
                className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[60px] transition-all active:scale-95
                    ${connectMode !== 'idle' 
                        ? 'bg-primary text-white shadow-lg scale-105' 
                        : 'text-primary hover:bg-blue-50/50'}
                `}
              >
                  <LinkIcon className="w-7 h-7" />
                  <span className="text-[11px] font-semibold">
                      {connectMode === 'idle' ? 'Connect' : 'Done'}
                  </span>
              </button>

              <button 
                onClick={deleteSelectedNode} 
                disabled={!selectedNodeId}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[60px] transition-all active:scale-95 ${!selectedNodeId ? 'text-gray-300' : 'text-red-500 hover:bg-red-50/50'}`}
              >
                  <Trash className="w-7 h-7" />
                  <span className="text-[11px] font-semibold">Delete</span>
              </button>
          </div>
      )}
    </div>
  );
};