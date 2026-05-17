"use client";

import React, { useState, useEffect, use } from 'react';
import api from '@/lib/api/axios';
import toast from 'react-hot-toast';
import { CheckCircle2, Globe, Send, MessageCircle, Share2 } from 'lucide-react';
import Image from 'next/image';
import illustration from '@/assets/illustration.png';
import Loader from '@/components/Loader';

export default function StudentForm({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { slug } = params;
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    batch: '',
    currentModule: '',
    tomorrowTask: '',
    needGuideline: false,
    customData: {}
  });

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await api.get(`/forms/${slug}`);
      setFormConfig(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Form not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        formId: formConfig._id
      };
      
      await api.post('/submissions/submit', payload);
      toast.success('Task submitted successfully!');
      setSubmitted(true);
      setFormData(prev => ({
        ...prev,
        currentModule: '',
        tomorrowTask: '',
        needGuideline: false,
        customData: {}
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit task');
    }
  };

  if (loading) return <Loader />;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f6f8fd] via-white to-[#f1f5f9] text-slate-800 p-8 relative overflow-hidden font-sans selection:bg-indigo-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[100px] animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center max-w-2xl text-center">
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-indigo-200/50 blur-2xl rounded-full animate-pulse"></div>
          <div className="w-32 h-32 bg-white/80 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative z-10 group hover:scale-110 transition-transform duration-500">
            <Globe className="w-12 h-12 text-indigo-500 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-indigo-900 to-purple-800">
          CLOSED<span className="text-indigo-500">.</span>
        </h1>
        <div className="space-y-4">
          <p className="text-xl md:text-2xl font-bold text-slate-600">
            {error === 'Form not found' ? 'Page Not Found' : 'Submission Cycle Ended'}
          </p>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md mx-auto font-medium">
            {error === 'Form not found' 
              ? "The link you followed might be broken or the form has been removed from our servers." 
              : "This journey has reached its destination. This form is no longer accepting new submissions."}
          </p>
        </div>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6f8fd] via-white to-[#f1f5f9] p-6 relative overflow-hidden selection:bg-indigo-100">
      <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white max-w-lg w-full text-center relative z-10 animate-in zoom-in-95 duration-500">
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle2 className="w-14 h-14 text-indigo-600 drop-shadow-md" />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Great Job!</h2>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">Your progress has been tracked. Keep up the amazing work on your journey!</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 w-full"
        >
          Submit Another
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8fd] via-white to-[#f1f5f9] flex flex-col md:items-center md:justify-center p-0 md:p-6 relative overflow-hidden font-sans w-full max-w-[100vw] selection:bg-indigo-100">
      
      {/* Mobile Top Nav */}
      <div className="md:hidden w-full p-6 bg-white/80 backdrop-blur-2xl border-b border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <span className="font-black tracking-tight text-xl text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-900">Incubator.</span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl rounded-none md:rounded-[3rem] shadow-none md:shadow-[0_8px_40px_rgb(0,0,0,0.06)] max-w-5xl w-full flex flex-col md:flex-row overflow-hidden relative z-10 border-0 md:border border-white animate-in slide-in-from-bottom-4 duration-700">
        
        {/* Form Section */}
        <div className="w-full md:w-[60%] p-6 md:p-12 relative">
          <div className="mb-10">
            <div className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
              {formConfig.formName}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3 tracking-tight leading-tight">
              Let's track <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">.</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed font-medium">
              Share your daily progress and let us know your goals for <span className="text-indigo-600 font-bold">{formConfig.formName}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Name</label>
                <input
                  type="text" required placeholder="John Doe"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Email</label>
                <input
                  type="email" required placeholder="john@example.com"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Phone</label>
                <input
                  type="tel" required placeholder="+1 (234) 567"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Current Module</label>
                <input
                  type="text" required placeholder="Which module?"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
                  value={formData.currentModule} onChange={e => setFormData({...formData, currentModule: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">Tomorrow's Plan</label>
              <textarea
                required rows="2" placeholder="What are your next steps?"
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-sm font-bold text-slate-700 placeholder-slate-400"
                value={formData.tomorrowTask} onChange={e => setFormData({...formData, tomorrowTask: e.target.value})}
              ></textarea>
            </div>

            {formConfig.customFields && formConfig.customFields.map((field, index) => (
              <div key={index} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest flex items-center">
                  {field.label} {field.required && <span className="text-rose-400 ml-1 text-sm leading-none">*</span>}
                </label>
                <input
                  type={field.type === 'textarea' ? 'text' : field.type}
                  required={field.required}
                  placeholder={field.placeholder || "Enter details..."}
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
                  value={formData.customData[field.label] || ''}
                  onChange={e => setFormData({
                    ...formData,
                    customData: { ...formData.customData, [field.label]: e.target.value }
                  })}
                />
              </div>
            ))}
            
            <div className="flex items-center space-x-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-5 rounded-2xl border border-indigo-100/50 mt-6">
              <input
                type="checkbox" id="guideline"
                className="w-5 h-5 rounded-lg border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                checked={formData.needGuideline} onChange={e => setFormData({...formData, needGuideline: e.target.checked})}
              />
              <label htmlFor="guideline" className="text-sm font-bold text-indigo-900/70 cursor-pointer select-none">
                I need a guideline for my next steps
              </label>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-black text-base hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center space-x-2 mt-4">
              <span>Submit Progress</span>
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>

        {/* Illustration Section */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-indigo-50/50 to-purple-50/50 p-12 flex-col justify-between border-l border-white relative overflow-hidden">
          {/* Decorative blur blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-[60px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-[320px] mb-12 transform hover:scale-105 transition-transform duration-700">
              <Image src={illustration} alt="Illustration" className="w-full h-auto drop-shadow-2xl" priority />
            </div>
            
            <div className="p-8 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl text-center w-full relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg text-white">
                <span className="text-xl leading-none font-serif">"</span>
              </div>
              <p className="text-lg font-black text-slate-700 leading-relaxed bg-clip-text">
                Move ahead, don't look behind, <br/>
                <span className="text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Learn, grow, and clear your mind.</span> 🚀
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
