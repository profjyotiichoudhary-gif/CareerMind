/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  ChevronRight, 
  Target, 
  Map, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Plus,
  X,
  Send,
  Loader2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { 
  extractSkills, 
  recommendCareers, 
  analyzeSkillGap, 
  generateRoadmap, 
  getResumeTips, 
  careerChat,
  generateInterviewQuestions
} from './lib/gemini';
import { 
  SkillExtraction, 
  CareerRecommendation, 
  SkillGap, 
  RoadmapItem, 
  ResumeData,
  InterviewQuestion
} from './types';

// --- Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium mb-6">
        <TrendingUp size={16} />
        <span>Your AI-Powered Career Intelligence Engine</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-display font-bold text-text-primary mb-6 leading-tight">
        Master Your <span className="text-accent-blue">Career Journey</span> <br /> with Precision
      </h1>
      <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
        From resume analysis to personalized learning roadmaps, CareerMind uses advanced AI to guide you through every step of your professional growth.
      </p>
      <button 
        onClick={onStart}
        className="btn-primary-gradient px-10 py-4 text-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
      >
        Start Your Journey
        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
      className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg bg-secondary border border-white/10 flex items-center justify-center">
          <FileText size={24} className="text-accent-cyan" />
        </div>
        <span className="text-xs uppercase tracking-widest font-mono">Expert Analysis</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg bg-secondary border border-white/10 flex items-center justify-center">
          <Target size={24} className="text-accent-purple" />
        </div>
        <span className="text-xs uppercase tracking-widest font-mono">Precision Gap</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg bg-secondary border border-white/10 flex items-center justify-center">
          <Map size={24} className="text-success" />
        </div>
        <span className="text-xs uppercase tracking-widest font-mono">AI Roadmaps</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-lg bg-secondary border border-white/10 flex items-center justify-center">
          <MessageSquare size={24} className="text-accent-blue" />
        </div>
        <span className="text-xs uppercase tracking-widest font-mono">Smart Mentor</span>
      </div>
    </motion.div>
  </div>
);

const ResumeUpload = ({ onUploadFinish }: { onUploadFinish: (data: any) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      // AI Analysis
      const extraction = await extractSkills(data.raw_text);
      const tips = await getResumeTips(data.raw_text, [...extraction.technical_skills, ...extraction.soft_skills]);

      // Save tips and extraction back to server
      await fetch(`/api/resume/${data.resume_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: [...extraction.technical_skills, ...extraction.soft_skills] }),
      });

      onUploadFinish({ ...data, extraction, tips });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-secondary border border-white/10 rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-display font-semibold mb-6">Upload Your Resume</h2>
        <p className="text-text-secondary mb-10">We'll analyze your skills and matching careers. PDF files only.</p>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${isUploading ? 'border-accent-blue/50 bg-accent-blue/5' : 'border-white/10 hover:border-accent-blue/50 hover:bg-white/5'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-accent-blue" size={48} />
              <p className="text-accent-blue font-medium">Analyzing your potential...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center">
                <Upload className="text-accent-blue" size={32} />
              </div>
              <p className="text-text-primary font-medium">Click to select or drag and drop</p>
              <p className="text-text-secondary text-sm">PDF (max. 10MB)</p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error flex items-center gap-2 justify-center">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SkillsReview = ({ extraction, tips, onConfirm }: { extraction: SkillExtraction, tips: string[], onConfirm: (skills: string[], exp: number) => void }) => {
  const [techSkills, setTechSkills] = useState(extraction?.technical_skills || []);
  const [softSkills, setSoftSkills] = useState(extraction?.soft_skills || []);
  const [exp, setExp] = useState(extraction?.experience_years || 0);
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setTechSkills([...techSkills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (skill: string, type: 'tech' | 'soft') => {
    if (type === 'tech') setTechSkills(techSkills.filter(s => s !== skill));
    else setSoftSkills(softSkills.filter(s => s !== skill));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-secondary border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-success" />
            Extracted Skills
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-text-secondary mb-3">Technical Skills</p>
              <div className="flex flex-wrap gap-2">
                {techSkills?.map(skill => (
                  <span key={skill} className="bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {skill}
                    <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill, 'tech')} />
                  </span>
                ))}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add skill..." 
                    className="bg-transparent border border-white/10 rounded-full px-4 py-1 text-sm focus:border-accent-cyan outline-none"
                  />
                  <button onClick={addSkill} className="p-1 rounded-full bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm uppercase tracking-widest text-text-secondary mb-3">Soft Skills</p>
              <div className="flex flex-wrap gap-2">
                {softSkills?.map(skill => (
                  <span key={skill} className="bg-accent-purple/10 border border-accent-purple/30 text-accent-purple px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {skill}
                    <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill, 'soft')} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
            <Briefcase className="text-accent-blue" />
            Experience & Education
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Years of Experience</label>
              <input 
                type="number" 
                value={exp} 
                onChange={(e) => setExp(Number(e.target.value))}
                className="w-full bg-primary border border-white/10 rounded-xl px-4 py-3 focus:border-accent-blue outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Education</label>
              <div className="w-full bg-primary/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary flex items-center gap-2">
                <GraduationCap size={18} className="text-accent-cyan" />
                {extraction.education}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-secondary border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="text-accent-cyan" />
            Resume Improvement
          </h2>
          <ul className="space-y-4">
            {tips?.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                <div className="mt-1 w-5 h-5 flex-shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center text-[10px] text-accent-cyan border border-accent-cyan/20">
                  {i + 1}
                </div>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        
        <button 
          onClick={() => onConfirm([...techSkills, ...softSkills], exp)}
          className="w-full btn-primary-gradient py-4 flex items-center justify-center gap-2"
        >
          Find My Career Matches
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const Recommendations = ({ recommendations, onSelectRole }: { recommendations: CareerRecommendation[], onSelectRole: (role: string) => void }) => {
  return (
    <div className="max-w-6xl mx-auto w-full px-4">
      <h2 className="text-3xl font-display font-bold mb-2">Recommended Career Paths</h2>
      <p className="text-text-secondary mb-10">Based on your unique skill profile and experience level.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations?.map((rec, i) => (
          <motion.div 
            key={rec.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-secondary border border-white/10 rounded-2xl p-6 career-card-hover group flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-text-primary group-hover:text-accent-blue transition-colors">{rec.role}</h3>
              <div className="bg-accent-blue/10 text-accent-blue text-xs font-mono px-2 py-1 rounded">
                {(rec.match_score * 100).toFixed(0)}% MATCH
              </div>
            </div>
            
            <p className="text-sm text-text-secondary mb-6 line-clamp-3 leading-relaxed">
              {rec.description}
            </p>

            <div className="space-y-4 mb-8 flex-grow">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">Top Companies</p>
                <div className="flex flex-wrap gap-2">
                  {rec.companies?.map(c => (
                    <span key={c} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">Avg. Salary</p>
                <p className="text-sm font-stats text-accent-cyan">{rec.avg_salary}</p>
              </div>
            </div>

            <button 
              onClick={() => onSelectRole(rec.role)}
              className="w-full bg-white/5 border border-white/10 hover:bg-accent-blue hover:text-white hover:border-accent-blue rounded-xl py-3 text-sm font-semibold transition-all"
            >
              Select Target Role
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SkillGapAnalysis = ({ gap, targetRole, onContinue }: { gap: SkillGap, targetRole: string, onContinue: () => void }) => {
  return (
    <div className="max-w-6xl mx-auto w-full px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Skill Gap Analysis</h2>
          <p className="text-text-secondary">Path to <span className="text-accent-blue font-semibold">{targetRole}</span></p>
        </div>
        <div className="flex items-center gap-4 bg-secondary p-4 rounded-2xl border border-white/10">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - gap.match_percentage / 100)} className="text-accent-blue" strokeLinecap="round" />
            </svg>
            <span className="absolute font-stats text-sm">{gap.match_percentage}%</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-text-secondary">Ready Score</p>
            <p className="text-text-primary font-medium">Estimated {gap.estimated_gap_months} months away</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-secondary border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-success" />
              Your Strong Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {gap?.strong_skills?.map(s => (
                <span key={s} className="bg-success/10 border border-success/30 text-success px-3 py-1 rounded-full text-xs">{s}</span>
              ))}
            </div>
          </div>
 
          <div className="bg-secondary border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="text-warning" />
              Skills to Improve
            </h3>
            <div className="flex flex-wrap gap-2">
              {gap?.partial_skills?.map(s => (
                <span key={s} className="bg-warning/10 border border-warning/30 text-warning px-3 py-1 rounded-full text-xs">{s}</span>
              ))}
            </div>
          </div>
 
          <div className="bg-secondary border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="text-error" />
              Missing Critical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {gap?.missing_skills?.map(s => (
                <span key={s} className="bg-error/10 border border-error/30 text-error px-3 py-1 rounded-full text-xs">{s}</span>
              ))}
            </div>
          </div>
        </div>
 
        <div className="space-y-6">
          <div className="bg-secondary border border-white/10 rounded-2xl p-8 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-6">Learning Priority</h3>
            <div className="space-y-4 flex-grow">
              {gap?.priority_to_learn?.map((s, i) => (
                <div key={s} className="flex items-center gap-4 bg-primary/50 p-4 rounded-xl border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue font-stats">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">{s}</h4>
                    <p className="text-xs text-text-secondary">High Impact for {targetRole}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={onContinue}
              className="mt-10 btn-primary-gradient w-full flex items-center justify-center gap-2"
            >
              Build My Personalized Roadmap
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoadmapTimeline = ({ roadmap, targetRole, onReset }: { roadmap: RoadmapItem[], targetRole: string, onReset: () => void }) => {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(1);

  return (
    <div className="max-w-4xl mx-auto w-full px-4">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Personalized Roadmap</h2>
          <p className="text-text-secondary">Step-by-step master plan for <span className="text-accent-blue">{targetRole}</span></p>
        </div>
        <button 
          onClick={onReset}
          className="text-sm text-text-secondary hover:text-white transition-colors underline"
        >
          Analysis Complete. Close.
        </button>
      </div>

      <div className="relative pl-10 space-y-8 before:content-[''] before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-accent-blue before:to-accent-purple">
        {roadmap?.map((item) => (
          <div key={item.month} className="relative">
            <div 
              className={`absolute -left-[30px] top-4 w-6 h-6 rounded-full border-4 border-primary z-10 transition-colors ${expandedMonth === item.month ? 'bg-accent-blue' : 'bg-secondary'}`}
            />
            <div 
              onClick={() => setExpandedMonth(expandedMonth === item.month ? null : item.month)}
              className={`bg-secondary border transition-all rounded-2xl overflow-hidden cursor-pointer ${expandedMonth === item.month ? 'border-accent-blue ring-1 ring-accent-blue/30' : 'border-white/10 hover:border-white/30'}`}
            >
              <div className="p-6 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <span className="font-stats text-2xl text-accent-blue opacity-50">0{item.month}</span>
                  <div>
                    <h3 className="text-xl font-bold">{item.focus}</h3>
                    <p className="text-xs text-text-secondary uppercase tracking-widest">{item.skills.join(" • ")}</p>
                  </div>
                </div>
                <ChevronRight className={`transition-transform duration-300 ${expandedMonth === item.month ? 'rotate-90' : ''}`} />
              </div>

              <AnimatePresence>
                {expandedMonth === item.month && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 bg-white/2"
                  >
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-accent-cyan font-bold mb-3">Key Milestones</h4>
                          <ul className="space-y-2">
                            {item.milestones?.map(m => (
                              <li key={m} className="flex items-center gap-2 text-sm text-text-secondary">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-success font-bold mb-3">Project Idea</h4>
                          <div className="bg-primary/30 rounded-xl p-4 border border-white/5 text-sm text-text-secondary italic">
                            "{item.project_idea}"
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs uppercase tracking-widest text-accent-purple font-bold mb-3">Recommended Resources</h4>
                        <div className="space-y-3">
                          {item.resources?.map(r => (
                            <div key={r} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors">
                              <Calendar size={16} className="text-accent-purple" />
                              <span className="text-sm">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('career_session_id') || uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('career_session_id', sessionId);
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`);
      const data = await response.json();
      if (data && data.messages) {
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      }
    } catch (e) {
      console.error('Failed to fetch chat history');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Save user message to backend
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, role: 'user', content: userMessage }),
      });

      // Get AI response - Pass existing messages (history) and the new user message
      const reply = await careerChat(messages, userMessage);

      // Save model reply to backend
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, role: 'model', content: reply }),
      });

      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[380px] h-[550px] bg-secondary border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-accent-blue/10 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center">
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Career Mentor</h3>
                  <p className="text-[10px] text-accent-blue animate-pulse">Now Active</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-primary/20">
              {messages.length === 0 && (
                <div className="text-center mt-10">
                  <p className="text-text-secondary text-sm px-4">Hello! I'm CareerMind. Ask me anything about your career path, interview prep, or resume!</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2 px-4">
                    {['Review my resume', 'Interview tips', 'Career change advice'].map(q => (
                      <button 
                        key={q} 
                        onClick={() => setInput(q)}
                        className="text-[10px] bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages?.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-accent-blue text-white rounded-tr-none' : 'bg-secondary border border-white/10 text-text-primary rounded-tl-none'}`}>
                    <div className="prose prose-invert prose-sm">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary border border-white/10 rounded-2xl p-4 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-secondary">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your career mentor..."
                  className="flex-grow bg-primary/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-blue outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-accent-blue text-white rounded-xl px-4 py-3 hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-accent-blue text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-accent-blue/90"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}
    </div>
  );
};

// --- Main App ---

enum Step {
  LANDING,
  UPLOAD,
  REVIEW,
  RECOMMEND,
  GAP,
  ROADMAP
}

export default function App() {
  const [step, setStep] = useState<Step>(Step.LANDING);
  const [resumeData, setResumeData] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [gapData, setGapData] = useState<SkillGap | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadFinish = (data: any) => {
    setResumeData(data);
    setStep(Step.REVIEW);
  };

  const handleSkillsConfirm = async (skills: string[], exp: number) => {
    setIsLoading(true);
    try {
      const recs = await recommendCareers(skills, exp);
      setResumeData((prev: any) => ({ ...prev, recommendations: recs, skills }));
      setStep(Step.RECOMMEND);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (role: string) => {
    setIsLoading(true);
    setSelectedRole(role);
    try {
      const gap = await analyzeSkillGap(resumeData.skills, role);
      setGapData(gap);
      setStep(Step.GAP);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildRoadmap = async () => {
    if (!gapData || !selectedRole) return;
    setIsLoading(true);
    try {
      const rm = await generateRoadmap(gapData.missing_skills, selectedRole, 6);
      setRoadmap(rm);
      setStep(Step.ROADMAP);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep(Step.LANDING);
    setResumeData(null);
    setSelectedRole(null);
    setGapData(null);
    setRoadmap(null);
  };

  return (
    <div className="min-h-screen">
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-blue to-accent-cyan flex items-center justify-center">
            <Target size={24} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">CareerMind</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={reset} className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Home</button>
          <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Dashboard</button>
          <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Community</button>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-text-secondary">
          AI v1.5 Flash
        </div>
      </nav>

      <main className="py-12 md:py-20 px-8 md:px-12">
        {isLoading && (
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-accent-blue" size={64} />
            <p className="text-xl font-display font-medium text-text-primary">Generating Intelligence...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            {step === Step.LANDING && <LandingPage onStart={() => setStep(Step.UPLOAD)} />}
            {step === Step.UPLOAD && <ResumeUpload onUploadFinish={handleUploadFinish} />}
            {step === Step.REVIEW && <SkillsReview extraction={resumeData.extraction} tips={resumeData.tips} onConfirm={handleSkillsConfirm} />}
            {step === Step.RECOMMEND && <Recommendations recommendations={resumeData.recommendations} onSelectRole={handleSelectRole} />}
            {step === Step.GAP && gapData && selectedRole && <SkillGapAnalysis gap={gapData} targetRole={selectedRole} onContinue={handleBuildRoadmap} />}
            {step === Step.ROADMAP && roadmap && selectedRole && <RoadmapTimeline roadmap={roadmap} targetRole={selectedRole} onReset={reset} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Chatbot />

      <footer className="py-20 border-t border-white/5 px-8 md:px-12 opacity-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
                <Target size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg">CareerMind</span>
            </div>
            <p className="text-sm text-text-secondary">Navigating professional growth through artificial intelligence and semantic career mapping.</p>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-4">Features</h4>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>Skill Extraction</li>
                <li>Gap Analysis</li>
                <li>Learning Paths</li>
                <li>Interview Prep</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-4">Legal</h4>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Data Security</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
