import React, { useMemo, useState, useRef } from 'react';
import { Database, Users, Landmark, Plus, X, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { REAL_FUNDING_LOOKUP } from './realFunding';
import IndustryHeatmap from './IndustryHeatmap';
import BatchSuccessScorecard from './BatchSuccessScorecard';
import GeographicDistribution from './GeographicDistribution';
import HotRightNow from './HotRightNow';

// Pre-defined batch years range
const YEARS = Array.from({ length: 23 }, (_, i) => 2005 + i);

const INDUSTRY_COLORS = {
  'B2B': '#00d2ff', // Cyan
  'Consumer': '#ff007f', // Magenta
  'Healthcare': '#00ff9d', // Emerald
  'Fintech': '#ffaa00', // Orange
  'Industrials': '#a855f7', // Purple
  'Real Estate and Construction': '#ec4899', // Pink
  'Education': '#3b82f6', // Blue
  'Government': '#eab308', // Yellow
  'Unspecified': '#64748b' // Slate
};

const KEYWORD_COLORS = {
  'generative ai': '#f43f5e', // Rose
  'web3/crypto': '#10b981', // Emerald
  'saas': '#3b82f6', // Blue
  'custom': '#eab308' // Gold for user search terms
};

export default function TrendsDashboard({ companies }) {
  const [activeMetric, setActiveMetric] = useState('count'); // 'count' | 'team_size' | 'funding'
  const [selectedIndustries, setSelectedIndustries] = useState(['B2B', 'Consumer', 'Healthcare', 'Fintech']);
  const [selectedKeywords, setSelectedKeywords] = useState(['generative ai', 'web3/crypto']);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  
  // Hover state for Chart 1 tooltip
  const [hoveredYearIndex, setHoveredYearIndex] = useState(null);
  const chart1Ref = useRef(null);

  // 1. Funding Calculation Function (Hybrid: Real where available, Estimated fallback)
  const getCompanyFunding = (c) => {
    const slug = c.slug || c.id?.toString();
    const nameLower = c.name ? c.name.toLowerCase().trim() : '';

    // Check if we have a real funding entry
    if (REAL_FUNDING_LOOKUP[nameLower] !== undefined) {
      return REAL_FUNDING_LOOKUP[nameLower];
    }
    if (REAL_FUNDING_LOOKUP[slug] !== undefined) {
      return REAL_FUNDING_LOOKUP[slug];
    }

    // Fallback to estimation formula
    let batchYear = 2015;
    if (c.batch) {
      const yearMatch = c.batch.match(/\d+/);
      if (yearMatch) {
        batchYear = parseInt(yearMatch[0]);
      }
    }

    let baseCheck = 100000;
    if (batchYear >= 2022) baseCheck = 500000;
    else if (batchYear >= 2018) baseCheck = 150000;
    else if (batchYear >= 2014) baseCheck = 120000;
    else if (batchYear >= 2011) baseCheck = 100000;
    else baseCheck = 20000;

    const teamSize = c.team_size || 0;
    const scaleFactor = teamSize * 150000;

    let multiplier = 1.0;
    if (c.top_company) multiplier *= 15.0;

    if (c.status === 'Public') {
      multiplier *= 50.0;
    } else if (c.status === 'Acquired') {
      multiplier *= 5.0;
    } else if (c.status === 'Inactive') {
      multiplier *= 0.8;
    }

    let estimated = (baseCheck + scaleFactor) * multiplier;

    if (c.status === 'Public' && estimated < 100000000) {
      estimated = 100000000; // Floor of $100M for public companies
    }

    return Math.round(estimated);
  };

  // Helper: check if company matches search keyword
  const matchesKeyword = (c, kw) => {
    if (!kw) return false;
    const q = kw.toLowerCase().trim();
    if (!q) return false;

    const name = c.name ? c.name.toLowerCase() : '';
    const oneLiner = c.one_liner ? c.one_liner.toLowerCase() : '';
    const desc = c.long_description ? c.long_description.toLowerCase() : '';
    const tags = c.tags ? c.tags.map(t => t.toLowerCase()) : [];
    const ind = c.industry ? c.industry.toLowerCase() : '';
    const subind = c.subindustry ? c.subindustry.toLowerCase() : '';

    if (q === 'web3/crypto') {
      return (
        name.includes('web3') || name.includes('crypto') || name.includes('blockchain') ||
        oneLiner.includes('web3') || oneLiner.includes('crypto') || oneLiner.includes('blockchain') ||
        tags.some(t => t.includes('web3') || t.includes('crypto') || t.includes('blockchain'))
      );
    }
    if (q === 'generative ai') {
      return (
        name.includes('generative ai') || name.includes('genai') ||
        oneLiner.includes('generative ai') || oneLiner.includes('genai') ||
        desc.includes('generative ai') || desc.includes('genai') ||
        tags.some(t => t.includes('generative ai') || t.includes('genai') || t.includes('llm') || t.includes('gpt'))
      );
    }

    return (
      name.includes(q) ||
      oneLiner.includes(q) ||
      desc.includes(q) ||
      tags.some(t => t.includes(q)) ||
      ind.includes(q) ||
      subind.includes(q)
    );
  };

  // Helper: Get company year
  const getCompanyYear = (c) => {
    if (!c.batch) return null;
    const m = c.batch.match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  };

  // 2. Data aggregation by Year & Category
  const timeSeriesData = useMemo(() => {
    const yearGroups = {};
    YEARS.forEach(y => {
      yearGroups[y] = [];
    });
    
    companies.forEach(c => {
      const y = getCompanyYear(c);
      if (y && yearGroups[y]) {
        yearGroups[y].push(c);
      }
    });

    const seriesList = [];

    // Industries
    selectedIndustries.forEach(ind => {
      const points = YEARS.map(year => {
        const matching = yearGroups[year].filter(c => c.industry === ind);
        const count = matching.length;
        
        let sumTeam = 0;
        let sumFunding = 0;
        matching.forEach(c => {
          sumTeam += (c.team_size || 0);
          sumFunding += getCompanyFunding(c);
        });

        return {
          year,
          count,
          team_size: count > 0 ? Math.round(sumTeam / count) : 0,
          funding: count > 0 ? Math.round(sumFunding / count) : 0
        };
      });

      seriesList.push({
        id: ind,
        name: ind,
        type: 'industry',
        color: INDUSTRY_COLORS[ind] || '#cbd5e1',
        points
      });
    });

    // Keywords
    const allKeywords = [...selectedKeywords, ...customKeywords];
    allKeywords.forEach(kw => {
      const points = YEARS.map(year => {
        const matching = yearGroups[year].filter(c => matchesKeyword(c, kw));
        const count = matching.length;

        let sumTeam = 0;
        let sumFunding = 0;
        matching.forEach(c => {
          sumTeam += (c.team_size || 0);
          sumFunding += getCompanyFunding(c);
        });

        return {
          year,
          count,
          team_size: count > 0 ? Math.round(sumTeam / count) : 0,
          funding: count > 0 ? Math.round(sumFunding / count) : 0
        };
      });

      let color = KEYWORD_COLORS[kw.toLowerCase()];
      if (!color) color = KEYWORD_COLORS['custom'];

      seriesList.push({
        id: `kw-${kw}`,
        name: kw.toUpperCase(),
        type: 'keyword',
        color,
        points
      });
    });

    return seriesList;
  }, [companies, selectedIndustries, selectedKeywords, customKeywords]);

  // Find max value in timeSeriesData to scale the chart Y-axis
  const chartMaxY = useMemo(() => {
    let max = 1;
    timeSeriesData.forEach(series => {
      series.points.forEach(pt => {
        const val = pt[activeMetric] || 0;
        if (val > max) max = val;
      });
    });
    return Math.max(1, Math.round(max * 1.08));
  }, [timeSeriesData, activeMetric]);

  // 3. Chart 2: Status Breakdown by Industry
  const statusData = useMemo(() => {
    const industries = Object.keys(INDUSTRY_COLORS).filter(k => k !== 'Unspecified');
    return industries.map(ind => {
      const matching = companies.filter(c => c.industry === ind);
      const total = matching.length;
      
      let active = 0, acquired = 0, publicCount = 0, inactive = 0;
      matching.forEach(c => {
        if (c.status === 'Active') active++;
        else if (c.status === 'Acquired') acquired++;
        else if (c.status === 'Public') publicCount++;
        else if (c.status === 'Inactive') inactive++;
      });

      return {
        industry: ind,
        total,
        active: total > 0 ? Math.round((active / total) * 100) : 0,
        acquired: total > 0 ? Math.round((acquired / total) * 100) : 0,
        public: total > 0 ? Math.round((publicCount / total) * 100) : 0,
        inactive: total > 0 ? Math.round((inactive / total) * 100) : 0,
        counts: { active, acquired, public: publicCount, inactive }
      };
    }).sort((a, b) => b.total - a.total);
  }, [companies]);

  // 4. Chart 3: Team Size Distribution (Histogram)
  const distributionData = useMemo(() => {
    const brackets = [
      { label: '1-10', min: 0, max: 10 },
      { label: '11-50', min: 11, max: 50 },
      { label: '51-200', min: 51, max: 200 },
      { label: '201-500', min: 201, max: 500 },
      { label: '500+', min: 501, max: Infinity }
    ];

    const counts = brackets.map(b => {
      const match = companies.filter(c => {
        const size = c.team_size || 0;
        return size >= b.min && size <= b.max;
      });
      return {
        label: b.label,
        count: match.length,
        percent: companies.length > 0 ? ((match.length / companies.length) * 100).toFixed(1) : 0
      };
    });

    const maxCount = Math.max(...counts.map(d => d.count), 1);
    return { counts, maxCount };
  }, [companies]);

  // Keyword controller handlers
  const handleAddCustomKeyword = (e) => {
    e.preventDefault();
    if (newKeywordInput.trim() !== '') {
      const kw = newKeywordInput.trim().toLowerCase();
      if (!customKeywords.includes(kw) && !selectedKeywords.includes(kw)) {
        setCustomKeywords([...customKeywords, kw]);
      }
      setNewKeywordInput('');
    }
  };

  const handleRemoveCustomKeyword = (kw) => {
    setCustomKeywords(customKeywords.filter(k => k !== kw));
  };

  const handleToggleIndustry = (ind) => {
    if (selectedIndustries.includes(ind)) {
      if (selectedIndustries.length > 1) {
        setSelectedIndustries(selectedIndustries.filter(i => i !== ind));
      }
    } else {
      setSelectedIndustries([...selectedIndustries, ind]);
    }
  };

  const handleToggleKeyword = (kw) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  // Mouse tracker for Chart 1 Y-axis tracking
  const handleMouseMove = (e) => {
    if (!chart1Ref.current) return;
    const rect = chart1Ref.current.getBoundingClientRect();
    const paddingLeftVal = 60;
    const pWidth = rect.width * (plotWidth / chartWidth);
    const offsetLeft = rect.width * (paddingLeftVal / chartWidth);
    const mouseX = e.clientX - rect.left - offsetLeft;

    if (mouseX >= 0 && mouseX <= pWidth) {
      const ratio = mouseX / pWidth;
      const idx = Math.min(
        YEARS.length - 1,
        Math.max(0, Math.round(ratio * (YEARS.length - 1)))
      );
      setHoveredYearIndex(idx);
    } else {
      setHoveredYearIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredYearIndex(null);
  };

  // SVG dimensions for Chart 1
  const chartWidth = 700;
  const chartHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 45;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Format Helper for large currency/amounts
  const formatValue = (val) => {
    if (activeMetric === 'funding') {
      if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
      if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
      return `$${val}`;
    }
    return val.toLocaleString();
  };

  // Compute tooltip summary data for hovered year
  const tooltipData = useMemo(() => {
    if (hoveredYearIndex === null) return null;
    const year = YEARS[hoveredYearIndex];
    const items = timeSeriesData.map(series => {
      const pt = series.points[hoveredYearIndex];
      return {
        name: series.name,
        color: series.color,
        value: pt ? pt[activeMetric] : 0
      };
    }).sort((a, b) => b.value - a.value);

    return { year, items };
  }, [hoveredYearIndex, timeSeriesData, activeMetric]);

  return (
    <div className="space-y-6">
      
      {/* Chart 1: Sector saturation over years (Line/Area chart) */}
      <div className="brutal-card p-5 select-none bg-white relative overflow-hidden group/card">
        
        {/* Neon Tech Header -> Neo-Brutalist Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-black pb-4 mb-5 gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded bg-neon-cyan border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-mono-tech text-sm font-extrabold text-black uppercase tracking-widest leading-none">
                SECTOR_SATURATION_TRENDS
              </h2>
              <span className="text-[9px] font-mono-code text-slate-700 block mt-1 uppercase font-bold">
                Macro-economic founder density // funding trajectories // 2005 - 2027
              </span>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex space-x-1.5 bg-white p-1 border-2 border-black rounded">
            {[
              { id: 'count', label: 'STARTUPS COUNT', icon: Database },
              { id: 'team_size', label: 'AVG TEAM SIZE', icon: Users },
              { id: 'funding', label: 'EST FUNDING', icon: Landmark }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMetric(m.id);
                    setHoveredYearIndex(null);
                  }}
                  className={`flex items-center space-x-1.5 font-mono-tech text-[10px] px-3.5 py-1.5 rounded transition-all cursor-pointer border ${
                    activeMetric === m.id
                      ? 'bg-neon-cyan text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold -translate-x-[0.5px] -translate-y-[0.5px]'
                      : 'text-slate-800 hover:bg-slate-50 border-2 border-transparent font-bold'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset Selector Checkboxes & Add Custom Keywords bar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-5 p-4 bg-obsidian-dark border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          
          {/* YC Primary Industries checkable pills */}
          <div className="xl:col-span-6 space-y-2">
            <span className="block font-mono-code text-[9px] text-slate-800 font-extrabold uppercase tracking-widest">
              SELECT_YC_SECTORS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(INDUSTRY_COLORS).filter(k => k !== 'Unspecified').map(ind => {
                const isActive = selectedIndustries.includes(ind);
                const color = INDUSTRY_COLORS[ind];
                return (
                  <button
                    key={ind}
                    onClick={() => handleToggleIndustry(ind)}
                    style={{ 
                      borderColor: '#000000',
                      backgroundColor: isActive ? color : '#FFFFFF',
                      boxShadow: isActive ? '2px 2px 0px 0px #000000' : '1px 1px 0px 0px #000000',
                      transform: isActive ? 'translate(-1.5px, -1.5px)' : 'none'
                    }}
                    className="font-mono-tech text-[9px] px-2.5 py-1 rounded border-2 transition-all cursor-pointer select-none uppercase tracking-wider text-black font-bold"
                  >
                    <span 
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 border border-black" 
                      style={{ backgroundColor: color }}
                    />
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Hot keywords and Custom keyword inputs */}
          <div className="xl:col-span-6 space-y-2">
            <span className="block font-mono-code text-[9px] text-slate-800 font-extrabold uppercase tracking-widest">
              HOT_TOPICS_FILTERS
            </span>
            
            <div className="flex flex-wrap gap-1.5 items-center font-mono-code">
              {/* Presets */}
              {['generative ai', 'web3/crypto', 'saas'].map(kw => {
                const isActive = selectedKeywords.includes(kw);
                const color = KEYWORD_COLORS[kw];
                return (
                  <button
                    key={kw}
                    onClick={() => handleToggleKeyword(kw)}
                    style={{ 
                      borderColor: '#000000',
                      backgroundColor: isActive ? color : '#FFFFFF',
                      boxShadow: isActive ? '2px 2px 0px 0px #000000' : '1px 1px 0px 0px #000000',
                      transform: isActive ? 'translate(-1.5px, -1.5px)' : 'none'
                    }}
                    className="font-mono-tech text-[9px] px-2.5 py-1 rounded border-2 transition-all cursor-pointer select-none uppercase tracking-wider text-black font-bold"
                  >
                    <span 
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 border border-black" 
                      style={{ backgroundColor: color }}
                    />
                    {kw}
                  </button>
                );
              })}

              {/* User custom typed tags */}
              {customKeywords.map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center font-mono-tech text-[9px] bg-neon-orange text-white px-2.5 py-1 rounded border-2 border-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 border border-black" />
                  {kw}
                  <button
                    onClick={() => handleRemoveCustomKeyword(kw)}
                    className="ml-1.5 text-white hover:text-black cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {/* Add Input form styled like a terminal prompt */}
              <form onSubmit={handleAddCustomKeyword} className="inline-flex items-center relative group">
                <span className="absolute left-2.5 text-black text-[9px] font-bold font-mono-code select-none">
                  &gt;
                </span>
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  placeholder="ADD_KEYWORD..."
                  className="bg-white border-2 border-black focus:outline-none text-[9px] font-mono-code pl-6 pr-8 py-1 rounded w-[160px] text-black placeholder-slate-500 shadow-[1px_1px_0px_0px_#000000]"
                />
                <button
                  type="submit"
                  className="absolute right-1 text-slate-500 hover:text-black cursor-pointer p-0.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Canvas Chart layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* SVG Graph View */}
          <div className="lg:col-span-3 bg-white p-3 border-2 border-black rounded relative overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
            <svg
              ref={chart1Ref}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto cursor-crosshair overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Grid Dots Pattern */}
              <defs>
                <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.8" fill="#000000" opacity="0.12" />
                </pattern>
              </defs>

              {/* Grid dots background pattern */}
              <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="url(#dot-grid)" />

              {/* Horizontal Gridlines */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const ratio = idx / 4;
                const y = paddingTop + plotHeight * (1 - ratio);
                const value = Math.round(chartMaxY * ratio);
                return (
                  <g key={`grid-y-${idx}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#e8e5db"
                      strokeWidth="1.5"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 3}
                      textAnchor="end"
                      fill="#000000"
                      className="font-mono-code text-[9px] font-bold"
                    >
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Gridlines & X-Axis Labels */}
              {YEARS.map((year, idx) => {
                const x = paddingLeft + (idx / (YEARS.length - 1)) * plotWidth;
                const isMajor = year % 5 === 0 || year === 2005 || year === 2027;
                return (
                  <g key={`grid-x-${idx}`}>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + plotHeight}
                      stroke={isMajor ? "#e8e5db" : "#f1efea"}
                      strokeWidth={isMajor ? "1.5" : "1"}
                    />
                    {isMajor && (
                      <text
                        x={x}
                        y={chartHeight - paddingBottom + 18}
                        textAnchor="middle"
                        fill="#000000"
                        className="font-mono-tech text-[9px] font-extrabold"
                      >
                        {year}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Render Series Lines and Gradients */}
              {timeSeriesData.map((series) => {
                const points = series.points;
                
                // Map coordinates
                const svgPoints = points.map((pt, idx) => {
                  const x = paddingLeft + (idx / (points.length - 1)) * plotWidth;
                  const y = paddingTop + plotHeight - ((pt[activeMetric] || 0) / chartMaxY) * plotHeight;
                  return { x, y };
                });

                // Generate SVG Path commands
                const pathD = svgPoints.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');

                const firstX = svgPoints[0]?.x || paddingLeft;
                const lastX = svgPoints[svgPoints.length - 1]?.x || (chartWidth - paddingRight);
                const areaD = `${pathD} L ${lastX} ${paddingTop + plotHeight} L ${firstX} ${paddingTop + plotHeight} Z`;

                const gradientId = `grad-${series.id}`;



                return (
                  <g key={series.id}>
                    {/* Linear Gradient definition for area filling */}
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={series.color} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={series.color} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area Under Curve */}
                    <path d={areaD} fill={`url(#${gradientId})`} />

                    {/* Line path with distinct color filters */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={series.color}
                      strokeWidth="3.5"
                      className="transition-all duration-300"
                    />

                    {/* Interactive dots with halo overlays on hover */}
                    {svgPoints.map((pt, pIdx) => {
                      const isHovered = hoveredYearIndex === pIdx;
                      return (
                        <g key={`g-dot-${series.id}-${pIdx}`}>
                          {isHovered && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8"
                              fill="none"
                              stroke={series.color}
                              strokeWidth="1.5"
                              opacity="0.4"
                              className="animate-ping"
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 4.5 : 2}
                            fill={isHovered ? '#ffffff' : series.color}
                            stroke={series.color}
                            strokeWidth={isHovered ? 2 : 0}
                            className="transition-all duration-150"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Vertical Snapping Crosshair line */}
              {hoveredYearIndex !== null && (
                <g>
                  <line
                    x1={paddingLeft + (hoveredYearIndex / (YEARS.length - 1)) * plotWidth}
                    y1={paddingTop}
                    x2={paddingLeft + (hoveredYearIndex / (YEARS.length - 1)) * plotWidth}
                    y2={paddingTop + plotHeight}
                    stroke="#00d2ff"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="opacity-60"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Interactive Tooltip / Console readout */}
          <div className="lg:col-span-1 brutal-card p-4 h-full flex flex-col justify-between min-h-[300px] bg-white group/console">
            
            {tooltipData ? (
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                  <span className="font-mono-tech text-xs text-black font-extrabold tracking-widest">
                    BATCH: {tooltipData.year}
                  </span>
                  <span className="font-mono-code text-[8px] bg-neon-cyan border border-black px-1.5 py-0.2 rounded shadow-[1px_1px_0px_0px_#000000] text-black font-bold">
                    ONLINE
                  </span>
                </div>
                
                <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1 flex-grow scrollbar-thin">
                  {tooltipData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200 pb-1.5">
                      <div className="flex items-center space-x-2 max-w-[130px] truncate">
                        <span 
                          className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="font-mono-tech text-[10px] text-slate-800 uppercase truncate font-bold">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono-code font-bold text-black text-[11px]">
                        {formatValue(item.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-black pt-3 text-[9px] font-mono-code text-slate-700 uppercase leading-normal font-bold">
                  Reflecting {activeMetric === 'funding' ? 'actual/estimated round funding totals' : activeMetric === 'team_size' ? 'average employee team sizes' : 'startup counts'} for this batch.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
                <div className="w-11 h-11 rounded border-2 border-black bg-neon-cyan flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono-tech text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                    CONSOLE_READOUT
                  </h4>
                  <p className="font-mono-code text-[9px] text-slate-700 leading-normal max-w-[160px] mx-auto mt-2.5 font-bold">
                    Hover mouse pointer over the graph area to display batch breakdowns
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Grid below: Chart 2 (Industry exit rates) & Chart 3 (Employee Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 2: Survival Stacked Bar Chart */}
        <div className="brutal-card p-5 flex flex-col justify-between bg-white relative group/survival">
          
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded border-2 border-black bg-neon-emerald flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
                SURVIVAL_&_EXIT_RATIOS_BY_SECTOR
              </h3>
            </div>
            <span className="font-mono-code text-[9px] text-slate-800 font-extrabold">
              OPERATING RATIOS (%)
            </span>
          </div>

          {/* Stacked Bars layout */}
          <div className="space-y-4">
            {statusData.map((item) => (
              <div key={item.industry} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono-tech font-bold text-slate-350 uppercase">
                    {item.industry}
                  </span>
                  <span className="font-mono-code text-[9px] text-slate-500">
                    {item.total.toLocaleString()} Startups
                  </span>
                </div>
                
                {/* Horizontal Stacked Bar */}
                <div className="h-4.5 w-full rounded-md bg-slate-950 overflow-hidden flex border border-slate-900/80 shadow-inner">
                  {item.active > 0 && (
                    <div 
                      style={{ width: `${item.active}%` }} 
                      className="bg-neon-emerald h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      title={`Active: ${item.counts.active} companies (${item.active}%)`}
                    >
                      {item.active > 12 && (
                        <span className="text-[8px] font-bold font-mono-code text-slate-950 pointer-events-none select-none">
                          {item.active}%
                        </span>
                      )}
                    </div>
                  )}
                  {item.acquired > 0 && (
                    <div 
                      style={{ width: `${item.acquired}%` }} 
                      className="bg-neon-cyan h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      title={`Acquired: ${item.counts.acquired} companies (${item.acquired}%)`}
                    >
                      {item.acquired > 12 && (
                        <span className="text-[8px] font-bold font-mono-code text-slate-950 pointer-events-none select-none">
                          {item.acquired}%
                        </span>
                      )}
                    </div>
                  )}
                  {item.public > 0 && (
                    <div 
                      style={{ width: `${item.public}%` }} 
                      className="bg-neon-magenta h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      title={`Public: ${item.counts.public} companies (${item.public}%)`}
                    >
                      {item.public > 12 && (
                        <span className="text-[8px] font-bold font-mono-code text-slate-950 pointer-events-none select-none">
                          {item.public}%
                        </span>
                      )}
                    </div>
                  )}
                  {item.inactive > 0 && (
                    <div 
                      style={{ width: `${item.inactive}%` }} 
                      className="bg-slate-700 h-full flex items-center justify-center cursor-pointer hover:brightness-110 transition-all"
                      title={`Inactive: ${item.counts.inactive} companies (${item.inactive}%)`}
                    >
                      {item.inactive > 12 && (
                        <span className="text-[8px] font-bold font-mono-code text-slate-400 pointer-events-none select-none">
                          {item.inactive}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legends */}
          <div className="flex justify-between items-center border-t-2 border-black pt-3 mt-5 text-[9px] font-mono-code text-slate-800 font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 border border-black bg-neon-emerald" />
              <span>ACTIVE</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 border border-black bg-neon-cyan" />
              <span>ACQUIRED</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 border border-black bg-neon-magenta" />
              <span>PUBLIC (IPO)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-1.5 border border-black bg-slate-400" />
              <span>INACTIVE</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Employee size distribution */}
        <div className="brutal-card p-5 flex flex-col justify-between bg-white relative group/team">
          
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded border-2 border-black bg-neon-magenta flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-extrabold text-black uppercase tracking-widest">
                EMPLOYEE_TEAM_SIZE_DISTRIBUTION
              </h3>
            </div>
            <span className="font-mono-code text-[9px] text-slate-800 font-extrabold">
              COMPANY RATIO (%)
            </span>
          </div>

          {/* SVG Column Chart with Overlapping Density Curve */}
          <div className="bg-white p-2.5 border-2 border-black rounded relative shadow-[2px_2px_0px_0px_#000000]">
            <svg
              viewBox="0 0 450 220"
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff007f" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ff007f" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                const y = 20 + 160 * (1 - ratio);
                return (
                  <line
                    key={idx}
                    x1="40"
                    y1={y}
                    x2="430"
                    y2={y}
                    stroke="#e8e5db"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Bar render with neon styling */}
              {distributionData.counts.map((item, idx) => {
                const x = 50 + idx * 75;
                const barHeight = (item.count / distributionData.maxCount) * 150;
                const y = 180 - barHeight;
                return (
                  <g key={item.label} className="group/bar">
                    {/* Glowing background bar fill */}
                    <rect
                      x={x + 10}
                      y={y}
                      width="40"
                      height={barHeight}
                      fill="url(#bar-grad)"
                      stroke="#000000"
                      strokeWidth="2"
                      rx="2"
                      className="transition-all duration-300"
                    />
                    
                    {/* X-axis labels */}
                    <text
                      x={x + 30}
                      y="200"
                      textAnchor="middle"
                      fill="#000000"
                      className="font-mono-tech text-[10px] font-extrabold"
                    >
                      {item.label}
                    </text>
                    
                    {/* Percentage label on top of bar */}
                    <text
                      x={x + 30}
                      y={y - 6}
                      textAnchor="middle"
                      fill="#000000"
                      className="font-mono-code text-[9px] font-bold"
                    >
                      {item.percent}%
                    </text>
                  </g>
                );
              })}

              {/* Overlay distribution spline path */}
              {(() => {
                const coords = distributionData.counts.map((item, idx) => {
                  const x = 50 + idx * 75 + 30;
                  const barHeight = (item.count / distributionData.maxCount) * 150;
                  const y = 180 - barHeight;
                  return { x, y };
                });

                let d = `M ${coords[0].x} ${coords[0].y}`;
                for (let i = 0; i < coords.length - 1; i++) {
                  const p0 = coords[i];
                  const p1 = coords[i + 1];
                  const cpX1 = p0.x + 30;
                  const cpY1 = p0.y;
                  const cpX2 = p1.x - 30;
                  const cpY2 = p1.y;
                  d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
                }

                return (
                  <path
                    d={d}
                    fill="none"
                    stroke="#ff007f"
                    strokeWidth="3.5"
                    strokeDasharray="5 3"
                  />
                );
              })()}

              {/* Y-axis baseline */}
              <line x1="40" y1="180" x2="430" y2="180" stroke="#000000" strokeWidth="2.5" />
            </svg>
          </div>

          <div className="text-[9px] font-mono-code text-slate-800 font-bold uppercase leading-normal border-t-2 border-black pt-3 mt-4">
            Analysis demonstrates that the majority of YC startups reside within early incubation brackets (1-10 employees), reflecting high post-incubation survival ratios.
          </div>
        </div>

      </div>

      {/* NEW: Industry Heatmap Section */}
      <div className="w-full">
        <IndustryHeatmap companies={companies} />
      </div>

      {/* NEW: Batch Success Scorecard & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BatchSuccessScorecard companies={companies} />
        <GeographicDistribution companies={companies} />
      </div>

      {/* NEW: Hot Right Now Widget */}
      <div className="w-full">
        <HotRightNow companies={companies} />
      </div>

    </div>
  );
}
