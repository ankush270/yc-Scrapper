import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Hammer, Plus, X, GripVertical, ChevronRight, Trash2,
  Edit2, Check, Lightbulb, Search, Beaker, Rocket,
  Flag, FileText, Users, DollarSign, Layers, ExternalLink, Sparkles
} from 'lucide-react';
import AIIdeaGenerator from './AIIdeaGenerator';
import {
  getAllSandboxProjects,
  createSandboxProject,
  updateSandboxProject,
  deleteSandboxProject
} from '../lib/storage';
import { trackUserAction } from '../lib/achievements';

gsap.registerPlugin(useGSAP);

// Kanban column definitions
const COLUMNS = [
  { id: 'idea', label: 'IDEA_DRAFT', icon: Lightbulb, color: '#fbbf24' },
  { id: 'research', label: 'RESEARCH', icon: Search, color: '#00bce6' },
  { id: 'validating', label: 'VALIDATING', icon: Beaker, color: '#a855f7' },
  { id: 'building', label: 'BUILDING', icon: Hammer, color: '#00d37e' },
  { id: 'launched', label: 'LAUNCHED', icon: Rocket, color: '#e60073' }
];

// Editable card modal for project details
function ProjectEditor({ project, onSave, onClose, allCompanies, onSelectCompany }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    oneLiner: project?.oneLiner || '',
    targetAudience: project?.targetAudience || '',
    revenueModel: project?.revenueModel || '',
    notes: project?.notes || '',
    features: project?.features || [],
    referenceCompanyIds: project?.referenceCompanyIds || [],
    status: project?.status || 'idea'
  });
  const [newFeature, setNewFeature] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const modalRef = useRef(null);

  useGSAP(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, { scope: modalRef });

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (!newFeature.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, { text: newFeature.trim(), done: false }] }));
    setNewFeature('');
  };

  const toggleFeature = (idx) => {
    setForm(f => ({
      ...f,
      features: f.features.map((ft, i) => i === idx ? { ...ft, done: !ft.done } : ft)
    }));
  };

  const removeFeature = (idx) => {
    setForm(f => ({
      ...f,
      features: f.features.filter((_, i) => i !== idx)
    }));
  };

  // Search for reference companies
  const searchResults = refSearch.trim().length >= 2
    ? allCompanies
        .filter(c => c.name.toLowerCase().includes(refSearch.toLowerCase()))
        .filter(c => !form.referenceCompanyIds.includes(c.id))
        .slice(0, 5)
    : [];

  const addReference = (company) => {
    setForm(f => ({ ...f, referenceCompanyIds: [...f.referenceCompanyIds, company.id] }));
    setRefSearch('');
  };

  const removeReference = (companyId) => {
    setForm(f => ({ ...f, referenceCompanyIds: f.referenceCompanyIds.filter(id => id !== companyId) }));
  };

  const handleSave = () => {
    onSave({ ...form, id: project?.id });
  };

  const getCompanyById = (id) => allCompanies.find(c => c.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div ref={modalRef} className="brutal-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
          <span className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest">
            {project?.id ? 'EDIT_PROJECT' : 'NEW_PROJECT'}
          </span>
          <button onClick={onClose} className="text-slate-700 hover:text-black cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
              Project Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., AutoDraft — AI-powered legal assistant"
              className="w-full brutal-input px-3 py-2 text-sm font-sans-body text-black placeholder-slate-400"
            />
          </div>

          {/* One-liner */}
          <div className="space-y-1.5">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
              One-Liner Pitch
            </label>
            <input
              type="text"
              value={form.oneLiner}
              onChange={(e) => setForm(f => ({ ...f, oneLiner: e.target.value }))}
              placeholder="Describe your idea in one sentence..."
              className="w-full brutal-input px-3 py-2 text-sm font-sans-body text-black placeholder-slate-400"
            />
          </div>

          {/* Two columns: Audience + Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Target Audience</span>
              </label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                placeholder="Who is this for?"
                className="w-full brutal-input px-3 py-2 text-xs font-sans-body text-black placeholder-slate-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>Revenue Model</span>
              </label>
              <input
                type="text"
                value={form.revenueModel}
                onChange={(e) => setForm(f => ({ ...f, revenueModel: e.target.value }))}
                placeholder="SaaS, Marketplace, etc."
                className="w-full brutal-input px-3 py-2 text-xs font-sans-body text-black placeholder-slate-400"
              />
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
              Stage
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.map(col => {
                const Icon = col.icon;
                const isActive = form.status === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => setForm(f => ({ ...f, status: col.id }))}
                    style={{
                      backgroundColor: isActive ? col.color : '#FFFFFF',
                      boxShadow: isActive ? '2px 2px 0px 0px #000000' : '1px 1px 0px 0px #000000',
                      transform: isActive ? 'translate(-1px, -1px)' : 'none'
                    }}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded border-2 border-black text-black font-mono-tech text-[9px] font-bold uppercase cursor-pointer transition-all"
                  >
                    <Icon className="w-3 h-3" />
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature checklist */}
          <div className="space-y-2">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>Feature Checklist</span>
            </label>
            <div className="space-y-1.5">
              {form.features.map((ft, idx) => (
                <div key={idx} className="flex items-center space-x-2 group">
                  <button
                    onClick={() => toggleFeature(idx)}
                    className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center shrink-0 cursor-pointer transition-colors ${ft.done ? 'bg-neon-emerald' : 'bg-white'}`}
                  >
                    {ft.done && <Check className="w-3 h-3 stroke-[3px]" />}
                  </button>
                  <span className={`font-sans-body text-xs flex-grow ${ft.done ? 'line-through text-slate-400' : 'text-black'}`}>
                    {ft.text}
                  </span>
                  <button
                    onClick={() => removeFeature(idx)}
                    className="text-slate-400 hover:text-neon-magenta cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddFeature} className="flex items-center space-x-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                className="flex-grow brutal-input px-2.5 py-1.5 text-xs font-sans-body text-black placeholder-slate-400"
              />
              <button type="submit" className="brutal-btn p-1.5 hover:bg-neon-emerald">
                <Plus className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* Reference companies (inspiration board) */}
          <div className="space-y-2">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center space-x-1">
              <Flag className="w-3 h-3" />
              <span>Inspiration Board — YC References</span>
            </label>

            {/* Current references */}
            <div className="flex flex-wrap gap-1.5">
              {form.referenceCompanyIds.map(id => {
                const c = getCompanyById(id);
                if (!c) return null;
                return (
                  <span key={id} className="inline-flex items-center space-x-1 bg-neon-cyan/10 border-2 border-black rounded px-2 py-1 font-mono-tech text-[9px] font-bold text-black shadow-[1px_1px_0px_0px_#000000]">
                    <span>{c.name}</span>
                    <button onClick={() => removeReference(id)} className="text-slate-500 hover:text-neon-magenta cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Search to add references */}
            <div className="relative">
              <input
                type="text"
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                placeholder="Search YC startups to add as inspiration..."
                className="w-full brutal-input px-3 py-1.5 text-xs font-mono-code text-black placeholder-slate-400"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 brutal-card p-1.5 z-10 max-h-[150px] overflow-y-auto">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => addReference(c)}
                      className="w-full flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-neon-cyan/10 transition-colors text-left"
                    >
                      <span className="font-mono-tech text-[10px] font-bold text-black">{c.name}</span>
                      <span className="font-mono-code text-[8px] text-slate-500">{c.batch}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-mono-tech text-[10px] text-slate-700 font-bold uppercase tracking-wider flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>Notes & Competitive Analysis</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Competitive advantages, market analysis, key differentiators..."
              className="w-full brutal-input p-3 text-xs font-sans-body text-black placeholder-slate-400 resize-none h-24"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t-2 border-black">
          <button onClick={onClose} className="brutal-btn px-4 py-2 text-xs font-mono-tech uppercase hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="brutal-btn px-5 py-2 text-xs font-mono-tech uppercase bg-neon-emerald hover:bg-neon-emerald/80"
          >
            {project?.id ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SandboxTab({ allCompanies, onSelectCompany, onOpenSettings }) {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null); // null | 'new' | project object
  const [draggedId, setDraggedId] = useState(null);
  const [subTab, setSubTab] = useState('kanban'); // 'kanban' | 'ai-generator'
  const gridRef = useRef(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const all = await getAllSandboxProjects();
    setProjects(all);
  };

  // GSAP stagger animation
  useGSAP(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.sandbox-card');
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: 'power2.out' }
        );
      }
    }
  }, { dependencies: [projects], scope: gridRef });

  // Save handler (create or update)
  const handleSave = async (formData) => {
    if (formData.id) {
      await updateSandboxProject(formData.id, formData);
    } else {
      await createSandboxProject(formData);
      await trackUserAction('sandbox_projects_created');
    }
    setEditingProject(null);
    await loadProjects();
  };

  // Delete handler
  const handleDelete = async (id) => {
    await deleteSandboxProject(id);
    await loadProjects();
  };

  // Move project to a different column/status
  const handleMoveProject = async (projectId, newStatus) => {
    await updateSandboxProject(projectId, { status: newStatus });
    await loadProjects();
  };

  // Simple drag and drop via status change
  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDropOnColumn = async (columnId) => {
    if (draggedId) {
      await handleMoveProject(draggedId, columnId);
      setDraggedId(null);
    }
  };

  const getCompanyById = (id) => allCompanies.find(c => c.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutal-card p-5 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-4 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded bg-neon-orange border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Hammer className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
                BUILDER_SANDBOX
              </h2>
              <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
                Plan your own startup ideas // drag YC companies as inspiration
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Kanban / AI Generator Sub Tab Toggles */}
            <button
              onClick={() => setSubTab('kanban')}
              className={`brutal-btn px-4 py-2 font-mono-tech text-[10px] uppercase ${
                subTab === 'kanban' ? 'bg-neon-cyan text-black' : 'bg-white text-black'
              }`}
            >
              📋 Kanban Board
            </button>
            <button
              onClick={() => setSubTab('ai-generator')}
              className={`brutal-btn px-4 py-2 font-mono-tech text-[10px] uppercase ${
                subTab === 'ai-generator' ? 'bg-neon-orange text-white' : 'bg-white text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              AI Generator
            </button>
            
            {subTab === 'kanban' && (
              <button
                onClick={() => setEditingProject('new')}
                className="brutal-btn flex items-center space-x-1.5 px-4 py-2 font-mono-tech text-[10px] uppercase bg-neon-emerald hover:bg-neon-emerald/80"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Idea</span>
              </button>
            )}
          </div>
        </div>

        {subTab === 'kanban' ? (
          /* Kanban Board */
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {COLUMNS.map(col => {
              const Icon = col.icon;
              const columnProjects = projects.filter(p => p.status === col.id);
              return (
                <div
                  key={col.id}
                  className="space-y-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnColumn(col.id)}
                >
                  {/* Column header */}
                  <div
                    className="flex items-center space-x-2 p-2.5 rounded border-2 border-black"
                    style={{ backgroundColor: col.color }}
                  >
                    <Icon className="w-3.5 h-3.5 text-black" />
                    <span className="font-mono-tech text-[10px] font-extrabold text-black uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="font-mono-code text-[9px] font-bold text-black/60 ml-auto">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {columnProjects.map(proj => (
                    <div
                      key={proj.id}
                      draggable
                      onDragStart={() => handleDragStart(proj.id)}
                      className="sandbox-card brutal-card p-3 cursor-grab active:cursor-grabbing hover:bg-obsidian-dark transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono-tech text-[11px] font-extrabold text-black leading-tight flex-grow">
                          {proj.name}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="text-slate-500 hover:text-black cursor-pointer p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(proj.id)}
                            className="text-slate-500 hover:text-neon-magenta cursor-pointer p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {proj.oneLiner && (
                        <p className="font-sans-body text-[10px] text-slate-600 mb-2 line-clamp-2 leading-snug">
                          {proj.oneLiner}
                        </p>
                      )}

                      {/* Feature progress */}
                      {proj.features && proj.features.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono-code text-[8px] text-slate-500 font-bold uppercase">Features</span>
                            <span className="font-mono-code text-[8px] text-slate-500 font-bold">
                              {proj.features.filter(f => f.done).length}/{proj.features.length}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full border border-black overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(proj.features.filter(f => f.done).length / proj.features.length) * 100}%`,
                                backgroundColor: col.color
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Reference count */}
                      {proj.referenceCompanyIds && proj.referenceCompanyIds.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Flag className="w-2.5 h-2.5 text-slate-500" />
                          <span className="font-mono-code text-[8px] text-slate-500 font-bold">
                            {proj.referenceCompanyIds.length} YC references
                          </span>
                        </div>
                      )}

                      {/* Last edited */}
                      <div className="mt-2 font-mono-code text-[7px] text-slate-400 font-bold">
                        Updated {new Date(proj.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                  {/* Empty column */}
                  {columnProjects.length === 0 && (
                    <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center">
                      <span className="font-mono-code text-[9px] text-slate-400 font-bold">
                        Drag ideas here
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* AI Idea Generator */
          <AIIdeaGenerator
            allCompanies={allCompanies}
            onSaveSuccess={loadProjects}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>

      {/* Project Editor Modal */}
      {editingProject && (
        <ProjectEditor
          project={editingProject === 'new' ? null : editingProject}
          onSave={handleSave}
          onClose={() => setEditingProject(null)}
          allCompanies={allCompanies}
          onSelectCompany={onSelectCompany}
        />
      )}
    </div>
  );
}
