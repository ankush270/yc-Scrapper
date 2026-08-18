import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  X, Settings, Key, Database, Download, Upload,
  Trash2, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  getSetting, setSetting, 
  exportWorkspaceData, importWorkspaceData, clearWorkspaceData 
} from '../lib/storage';

gsap.registerPlugin(useGSAP);

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-3.6-flash' },
  { id: 'openai', name: 'OpenAI GPT', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20241022' },
  { id: 'groq', name: 'Groq (Llama)', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'grok', name: 'Grok / xAI', defaultModel: 'grok-2-1212' },
  { id: 'sarvam', name: 'Sarvam AI', defaultModel: 'sarvam-2b-v0.5' },
];

export default function SettingsModal({ isOpen, onClose, onDataReset }) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [modelName, setModelName] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  // Load key and provider configuration from storage
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        getSetting('yc_llm_provider'),
        getSetting('yc_llm_model'),
        getSetting('yc_llm_api_key'),
        getSetting('gemini_api_key')
      ]).then(([prov, mod, key, legacyKey]) => {
        if (prov) setProvider(prov);
        else setProvider('gemini');

        if (mod) setModelName(mod);
        else setModelName('');

        if (key) setApiKey(key);
        else if (legacyKey) setApiKey(legacyKey);
        else setApiKey('');
      });
    }
  }, [isOpen]);

  useGSAP(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  const handleSaveKey = async (e) => {
    e.preventDefault();
    try {
      await Promise.all([
        setSetting('yc_llm_provider', provider),
        setSetting('yc_llm_model', modelName.trim()),
        setSetting('yc_llm_api_key', apiKey.trim()),
        provider === 'gemini' ? setSetting('gemini_api_key', apiKey.trim()) : Promise.resolve()
      ]);
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Failed to save settings.');
    }
  };

  const handleExportData = async () => {
    try {
      const exportObject = await exportWorkspaceData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `yc_explorer_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to export data.');
    }
  };

  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await importWorkspaceData(backup);

      alert('Data imported successfully!');
      if (onDataReset) onDataReset();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to import backup: ${err.message}`);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('WARNING: This will delete all your favorites, collections, and sandbox projects. This action cannot be undone! Are you sure?')) {
      return;
    }

    try {
      await clearWorkspaceData();
      alert('All workspace data cleared.');
      if (onDataReset) onDataReset();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to clear data.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div
        ref={modalRef}
        className="brutal-card p-6 w-full max-w-md bg-white relative shadow-[6px_6px_0px_0px_#000000]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-black" />
            <span className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
              CONSOLE_SETTINGS
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-700 hover:text-black cursor-pointer p-1 hover:bg-slate-100 border border-transparent hover:border-black rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {/* LLM Provider Configuration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-black" />
              <span className="font-mono-tech text-[10px] text-black font-extrabold uppercase tracking-wider">
                LLM Provider Settings
              </span>
            </div>
            
            <p className="font-mono-code text-[9px] text-slate-650 leading-relaxed font-bold">
              Choose your AI provider, model name, and enter your developer API key. These keys are stored safely inside your browser's local storage.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-3">
              {/* Provider Selection */}
              <div className="space-y-1">
                <label className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase tracking-wider block">
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    setProvider(newProvider);
                    // Reset model name to default when changing provider
                    const def = PROVIDERS.find(p => p.id === newProvider)?.defaultModel || '';
                    setModelName(def);
                  }}
                  className="w-full brutal-input px-3 py-1.5 text-xs font-mono-tech uppercase font-bold text-black"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Model Name */}
              <div className="space-y-1">
                <label className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase tracking-wider block">
                  Model Name
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder={PROVIDERS.find(p => p.id === provider)?.defaultModel || "Enter model name..."}
                  className="w-full brutal-input px-3 py-1.5 text-xs font-mono-code text-black"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className="font-mono-tech text-[9px] text-slate-700 font-bold uppercase tracking-wider block">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Paste ${PROVIDERS.find(p => p.id === provider)?.name || ""} API Key...`}
                  className="w-full brutal-input px-3 py-1.5 text-xs font-mono-code text-black placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {saved ? (
                  <span className="inline-flex items-center space-x-1 font-mono-code text-[9px] text-neon-emerald font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Settings saved successfully!</span>
                  </span>
                ) : error ? (
                  <span className="inline-flex items-center space-x-1 font-mono-code text-[9px] text-neon-magenta font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="brutal-btn px-4 py-1.5 text-[10px] font-mono-tech uppercase bg-neon-cyan"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          <hr className="border-slate-200 border-t-2" />

          {/* Backup / Export / Import / Clear Data */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-black" />
              <span className="font-mono-tech text-[10px] text-black font-extrabold uppercase tracking-wider">
                Workspace Backup & Data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportData}
                className="brutal-btn p-2.5 flex items-center justify-center space-x-2 text-[10px] font-mono-tech uppercase hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>

              <label className="brutal-btn p-2.5 flex items-center justify-center space-x-2 text-[10px] font-mono-tech uppercase hover:bg-slate-50 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleClearAllData}
              className="w-full brutal-btn p-2.5 flex items-center justify-center space-x-2 text-[10px] font-mono-tech uppercase hover:bg-neon-magenta/10 text-neon-magenta border-neon-magenta"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Workspace Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
