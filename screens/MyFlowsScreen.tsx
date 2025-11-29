import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flow, FlowNode, FlowEdge } from '../types';
import { Search, ChevronRight, Plus, Sparkles, Check, Upload, LayoutTemplate, Edit2 } from '../components/Icons';
import { generateFlowFromPrompt } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface MyFlowsScreenProps {
  flows: Flow[];
  setFlows: React.Dispatch<React.SetStateAction<Flow[]>>;
  templates: Flow[];
}

export const MyFlowsScreen: React.FC<MyFlowsScreenProps> = ({ flows, setFlows, templates }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'template' | 'upload'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Renaming State
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const calculateProgress = (flow: Flow) => {
    if (flow.nodes.length === 0) return 0;
    const completed = flow.nodes.filter(n => n.status === 'completed').length;
    return Math.round((completed / flow.nodes.length) * 100);
  };

  const calculateCompletedSteps = (flow: Flow) => {
    return flow.nodes.filter(n => n.status === 'completed').length;
  };

  const getNextTask = (flow: Flow) => {
    const next = flow.nodes.find(n => n.status === 'pending');
    return next ? next.label : 'All steps completed';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const result = await generateFlowFromPrompt(prompt);
    if (result) {
      const newFlow: Flow = {
        id: uuidv4(),
        title: prompt,
        nodes: result.nodes,
        edges: result.edges,
        updatedAt: new Date()
      };
      setFlows(prev => [newFlow, ...prev]);
      setShowAddMenu(false);
      setPrompt('');
    } else {
        alert("Failed to generate flow. Please check your API key or try again.");
    }
    setIsGenerating(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        alert("The uploaded file is empty.");
        return;
      }

      const newNodes: FlowNode[] = [];
      const newEdges: FlowEdge[] = [];
      
      lines.forEach((line, index) => {
        const nodeId = uuidv4();
        newNodes.push({
          id: nodeId,
          label: line,
          type: index === 0 ? 'start' : 'task',
          x: 60, 
          y: 50 + (index * 130), // Reduced spacing
          width: 250,
          height: 100,
          status: 'pending'
        });

        if (index > 0) {
            newEdges.push({
                id: uuidv4(),
                source: newNodes[index - 1].id,
                target: nodeId
            });
        }
      });

      const newFlow: Flow = {
          id: uuidv4(),
          title: file.name.replace('.txt', '') || 'Imported Flow',
          nodes: newNodes,
          edges: newEdges,
          updatedAt: new Date()
      };

      setFlows(prev => [newFlow, ...prev]);
      setShowAddMenu(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createFromTemplate = (template: Flow) => {
      const newFlow: Flow = {
          ...template,
          id: uuidv4(),
          title: `${template.title} (Copy)`,
          updatedAt: new Date(),
          nodes: template.nodes.map(n => ({...n, status: 'pending'})), // Reset status
      };
      setFlows(prev => [newFlow, ...prev]);
      setShowAddMenu(false);
  };

  const startRenaming = (e: React.MouseEvent, flow: Flow) => {
      e.stopPropagation();
      setEditingFlowId(flow.id);
      setTempTitle(flow.title);
  };

  const saveTitle = (flowId: string) => {
      setFlows(prev => prev.map(f => f.id === flowId ? { ...f, title: tempTitle } : f));
      setEditingFlowId(null);
  };

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      {/* Sticky Header */}
      <div className="bg-background sticky top-0 z-10 border-b border-gray-200/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto w-full px-5 pt-8 pb-4 flex justify-between items-center">
            <h1 className="text-[34px] font-bold tracking-tight text-black">My Flows</h1>
            <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${showAddMenu ? 'bg-gray-200 text-gray-700' : 'bg-primary text-white active:bg-blue-600'}`}
            >
            <Plus className={`w-6 h-6 transition-transform ${showAddMenu ? 'rotate-45' : ''}`} />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-5 pb-24 pt-4 space-y-4">
            
            {/* Add Flow Menu */}
            {showAddMenu && (
                <div className="animate-fade-in mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        {/* Tabs */}
                        <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2">
                             <button 
                                onClick={() => setActiveTab('ai')}
                                className={`text-sm font-semibold pb-1 ${activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                             >
                                 AI Generate
                             </button>
                             <button 
                                onClick={() => setActiveTab('template')}
                                className={`text-sm font-semibold pb-1 ${activeTab === 'template' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                             >
                                 Templates
                             </button>
                             <button 
                                onClick={() => setActiveTab('upload')}
                                className={`text-sm font-semibold pb-1 ${activeTab === 'upload' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
                             >
                                 Import
                             </button>
                        </div>

                        {/* AI Tab */}
                        {activeTab === 'ai' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Sparkles className="text-primary w-4 h-4" />
                                    Describe your process
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., 'Hiring Process for Engineering'"
                                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                    />
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                                    >
                                        {isGenerating ? '...' : 'Go'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Template Tab */}
                        {activeTab === 'template' && (
                            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                                {templates.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No templates saved yet.</p>
                                ) : (
                                    templates.map(temp => (
                                        <button 
                                            key={temp.id}
                                            onClick={() => createFromTemplate(temp)}
                                            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-700"
                                        >
                                            <LayoutTemplate className="w-4 h-4 text-primary" />
                                            {temp.title}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                         {/* Upload Tab */}
                         {activeTab === 'upload' && (
                            <div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium"
                                >
                                    <Upload className="w-4 h-4" />
                                    Select .txt file
                                </button>
                                <input 
                                    type="file" 
                                    hidden 
                                    ref={fileInputRef} 
                                    accept=".txt" 
                                    onChange={handleFileChange} 
                                />
                                <p className="text-[10px] text-gray-400 text-center mt-2">
                                    Each line in the file will be created as a connected step.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search flows"
                    className="w-full bg-[#7676801F] text-black placeholder-gray-500 rounded-[10px] py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-[17px]"
                />
                </div>
            </div>

            {/* Flow List */}
            <div className="space-y-4">
                {flows.map(flow => {
                    const progress = calculateProgress(flow);
                    const totalSteps = flow.nodes.length;
                    const completedSteps = calculateCompletedSteps(flow);
                    const isCompleted = progress === 100;

                    return (
                        <div 
                            key={flow.id}
                            onClick={() => navigate(`/flow/${flow.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition-colors cursor-pointer hover:shadow-md group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                {/* Title Area with Rename Logic */}
                                <div className="flex-1 pr-2">
                                    {editingFlowId === flow.id ? (
                                        <input 
                                            type="text"
                                            value={tempTitle}
                                            onChange={(e) => setTempTitle(e.target.value)}
                                            onBlur={() => saveTitle(flow.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveTitle(flow.id);
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            className="text-[17px] font-semibold text-black leading-tight border-b border-primary outline-none w-full bg-transparent"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 group-hover:gap-2">
                                            <h3 className="text-[17px] font-semibold text-black leading-tight">
                                                {flow.title}
                                            </h3>
                                            <button 
                                                onClick={(e) => startRenaming(e, flow)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                                title="Rename"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="text-gray-300 w-5 h-5 flex-shrink-0 mt-0.5" />
                            </div>

                            {isCompleted ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-[15px] text-black font-medium">{totalSteps}/{totalSteps} Steps Completed</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full bg-primary" 
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[13px] text-gray-500 whitespace-nowrap">
                                            {completedSteps}/{totalSteps} Steps Completed
                                        </span>
                                    </div>
                                    
                                    <div className="text-[15px] leading-snug">
                                        <span className="text-gray-900 font-medium">Next: </span>
                                        <span className="text-gray-600">{getNextTask(flow)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};