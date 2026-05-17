"use client";

import React, { useState, useEffect, use } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Edit2, Check, X, Eye, EyeOff, Copy, BarChart3, Users, Clock, AlertCircle, Link as LinkIcon, Upload } from 'lucide-react';
import Loader from '@/components/Loader';

// Dynamically import heavy chart components to reduce initial bundle size
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

export default function AdminSubmissions({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { formId } = params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [enrollmentResults, setEnrollmentResults] = useState(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);
  const [editContext, setEditContext] = useState({ id: null, field: null, customKey: null });
  const [editValue, setEditValue] = useState('');
  const [pdfDays, setPdfDays] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [formSlug, setFormSlug] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPendingGuidelines: 0,
    highestModule: 0,
    moduleDistribution: []
  });
  const [formConfig, setFormConfig] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, [formId]);

  const fetchSubmissions = async () => {
    try {
      const [subRes, statsRes, formRes] = await Promise.all([
        api.get(`/submissions/structured/${formId}`),
        api.get(`/submissions/stats/${formId}`),
        api.get(`/forms/id/${formId}`)
      ]);
      setData(subRes.data);
      setStats(statsRes.data);
      setFormConfig(formRes.data);
      setFormSlug(formRes.data.formSlug);

      if (formRes.data.enrolledEmails && formRes.data.enrolledEmails.length > 0) {
        const submittedEmails = new Set();
        subRes.data.forEach(student => {
          if (student.submissions && student.submissions.length > 0) {
            submittedEmails.add(student.email.toLowerCase());
          }
        });

        const results = formRes.data.enrolledEmails.map(email => ({
          email,
          hasSubmitted: submittedEmails.has(email.toLowerCase())
        }));
        setEnrollmentResults(results);
      }
    } catch (err) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCheckingEnrollment(true);
    const reader = new FileReader();

    const processEmails = async (data) => {
      try {
        const emails = data.map(row => {
          const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
          return row[emailKey];
        }).filter(email => email && email.includes('@'));

        if (emails.length === 0) {
          toast.error('No emails found in file. Ensure there is an "email" column.');
          setIsCheckingEnrollment(false);
          return;
        }

        const res = await api.post(`/submissions/check-emails/${formId}`, { emails });
        setEnrollmentResults(res.data);
        setView('enrollment');
        toast.success(`Checked ${res.data.length} students from file`);
      } catch (err) {
        toast.error('Failed to verify enrollment');
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      import('papaparse').then(Papa => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => processEmails(results.data)
        });
      });
    } else {
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        import('xlsx').then(XLSX => {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processEmails(data);
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    let pdfDates = sortedDates;
    if (pdfDays !== 'all') {
      const days = parseInt(pdfDays);
      pdfDates = sortedDates.slice(-days);
    }

    const doc = new jsPDF({
      orientation: pdfDates.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    doc.text('Student Daily Task Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Range: ${pdfDays === 'all' ? 'All Data' : `Last ${pdfDays} Days`}`, 14, 22);
    
    const head = [['Name', ...pdfDates, 'Assigned Next']];
    const body = data.map(student => {
      const row = [student.name];
      pdfDates.forEach(date => {
        const sub = student.submissions.find(s => s.date === date);
        let cellText = sub ? sub.currentModule : '-';
        if (sub?.customData && Object.keys(sub.customData).length > 0) {
          const custom = Object.entries(sub.customData)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          cellText += `\n(${custom})`;
        }
        row.push(cellText);
      });
      const latestSub = student.submissions[student.submissions.length - 1];
      row.push(student.assignedModule || (latestSub ? latestSub.assignedModule : '-'));
      return row;
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 28,
      styles: { fontSize: pdfDates.length > 10 ? 6 : 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 'auto' } },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`report-${formId}-${pdfDays}-days.pdf`);
  };

  const resolveGuideline = async (submissionId) => {
    try {
      await api.put(`/submissions/${submissionId}`, { resolveGuideline: true });
      toast.success('Guideline marked as resolved');
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to resolve guideline');
    }
  };

  const startEdit = (submission, field, customKey = null) => {
    setEditContext({ id: submission._id, field, customKey });
    if (field === 'custom' && customKey) {
      setEditValue(submission.customData[customKey] || '');
    } else {
      setEditValue(submission[field] || '');
    }
  };

  const saveEdit = async (item) => {
    try {
      const updateData = {};
      if (editContext.field === 'custom' && editContext.customKey) {
        updateData.customData = { ...item.customData, [editContext.customKey]: editValue };
      } else {
        updateData[editContext.field] = editValue;
      }

      if (editContext.field === 'studentAssignedModule') {
        await api.put(`/submissions/students/${item._id}`, { assignedModule: editValue });
      } else {
        await api.put(`/submissions/${item._id}`, updateData);
      }
      
      toast.success('Updated successfully');
      setEditContext({ id: null, field: null, customKey: null });
      fetchSubmissions();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getSortedDates = () => {
    if (!formConfig) return [];
    const dates = [];
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    let current = new Date(formConfig.startDate);
    current.setHours(0, 0, 0, 0);
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(formConfig.endDate);
    endDate.setHours(0, 0, 0, 0);
    const stopDate = today < endDate ? today : endDate;
    if (current > stopDate) return [formatDate(current)];
    while (current <= stopDate) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const sortedDates = React.useMemo(() => getSortedDates(), [formConfig]);
  const chartData = React.useMemo(() => data.map(student => ({ 
    name: student.name.split(' ')[0], 
    fullName: student.name,
    submissions: student.submissions.length 
  })).sort((a, b) => b.submissions - a.submissions), [data]);

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {isCheckingEnrollment && <Loader />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Form Insights</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button onClick={() => setView('table')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Table</button>
            <button onClick={() => setView('analytics')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Analytics</button>
            <button onClick={() => setView('enrollment')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'enrollment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Master List Check</button>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/form/${formSlug}`;
              navigator.clipboard.writeText(url);
              toast.success('Share link copied!');
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-md"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Share Form
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <select value={pdfDays} onChange={(e) => setPdfDays(e.target.value)} className="pl-3 pr-8 py-2 text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none">
              <option value="all">All Days</option>
              <option value="3">Last 3 Days</option>
              <option value="7">Last 7 Days</option>
              <option value="15">Last 15 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <button onClick={handleExportPDF} className="flex items-center text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2 text-indigo-600" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {view === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-gray-500">Total Students</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2"><AlertCircle className="w-5 h-5 text-amber-600" /><span className="text-sm font-medium text-gray-500">Pending Help</span></div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPendingGuidelines}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2"><BarChart3 className="w-5 h-5 text-green-600" /><span className="text-sm font-medium text-gray-500">Highest Module</span></div>
              <p className="text-2xl font-bold text-gray-900">Module {stats.highestModule}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Bar dataKey="submissions" radius={[6, 6, 0, 0]} barSize={30}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[0]} fillOpacity={0.4 + (index * 0.05)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10">Student Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Group/Batch</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  {sortedDates.map(date => <th key={date} className="px-8 py-5 text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">{date}</th>)}
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Assign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(student => {
                  const latestSub = student.submissions[student.submissions.length - 1];
                  const pendingGuideline = student.submissions.find(s => s.needGuideline && !s.guidelineResolved);
                  return (
                    <tr key={student._id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4 font-medium text-gray-900 text-sm sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100 align-top">
                        <div className="flex items-center space-x-2">
                          <span>{student.name}</span>
                          <button onClick={() => setExpandedStudentId(expandedStudentId === student._id ? null : student._id)} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600">
                            {expandedStudentId === student._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {expandedStudentId === student._id && (
                          <div className="mt-3 bg-[#1e293b] rounded-xl p-4 shadow-sm border border-gray-700 w-72 text-white">
                            <div className="flex justify-between items-center mb-3"><span className="text-gray-400 text-sm">Email:</span><div className="flex items-center space-x-3"><span className="text-gray-100 text-sm truncate max-w-[150px]">{student.email}</span><button onClick={() => navigator.clipboard.writeText(student.email)} className="text-cyan-400"><Copy className="w-4 h-4" /></button></div></div>
                            <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Phone:</span><div className="flex items-center space-x-3"><span className="text-gray-100 text-sm">{student.phone}</span><button onClick={() => navigator.clipboard.writeText(student.phone)} className="text-cyan-400"><Copy className="w-4 h-4" /></button></div></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{student.batch || 'N/A'}</span></td>
                      <td className="px-8 py-5 text-center">
                        {pendingGuideline ? (
                          <div className="flex flex-col items-center space-y-2"><span className="h-3 w-3 bg-rose-500 rounded-full animate-ping"></span><button onClick={() => resolveGuideline(pendingGuideline._id)} className="text-[9px] font-black uppercase bg-rose-500 text-white px-3 py-1.5 rounded-full">Resolve</button></div>
                        ) : <div className="flex justify-center"><span className="h-3 w-3 bg-emerald-500 rounded-full"></span></div>}
                      </td>
                      {sortedDates.map(date => {
                        const sub = student.submissions.find(s => s.date === date);
                        return (
                          <td key={date} className="px-6 py-4 text-sm text-gray-600 align-top">
                            {sub ? (
                              <div className="space-y-2">
                                <div className="font-semibold text-gray-900">{sub.currentModule}</div>
                                {sub.customData && Object.entries(sub.customData).map(([key, value]) => (
                                  <div key={key} className="text-[10px] text-gray-400"><span className="font-bold text-gray-300 uppercase">{key}:</span> {value}</div>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {student.assignedModule && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500 text-white mb-1 w-fit">Next: {student.assignedModule}</span>}
                          <span className="text-sm font-bold">{student.assignedModule || latestSub?.assignedModule || 'Not Assigned'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
