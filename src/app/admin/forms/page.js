"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api/axios';
import toast from 'react-hot-toast';
import { Copy, Plus, X, Calendar, Link as LinkIcon, Box, Edit2, Trash2 } from 'lucide-react';
import Loader from '@/components/Loader';

export default function AdminForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormId, setEditFormId] = useState(null);
  
  const [formData, setFormData] = useState({
    formName: '',
    formSlug: '',
    startDate: '',
    endDate: '',
    createdBy: '',
    customFields: []
  });

  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    fetchForms();
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const res = await api.get('/admin/me');
      setCurrentAdmin(res.data);
      setFormData(prev => ({ ...prev, createdBy: res.data.name }));
    } catch (err) {
      console.error('Failed to fetch admin profile');
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/forms');
      setForms(res.data);
    } catch (err) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.customFields.some(f => !f.label.trim())) {
      return toast.error('All custom fields must have a label');
    }
    try {
      await api.post('/forms', formData);
      toast.success('Form created successfully');
      setIsModalOpen(false);
      setFormData({ 
        formName: '', 
        formSlug: '', 
        startDate: '', 
        endDate: '', 
        createdBy: currentAdmin?.name || '',
        customFields: [] 
      });
      fetchForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create form');
    }
  };

  const openEditModal = (form) => {
    setEditFormId(form._id);
    setFormData({
      formName: form.formName,
      formSlug: form.formSlug,
      startDate: form.startDate ? form.startDate.split('T')[0] : '',
      endDate: form.endDate ? form.endDate.split('T')[0] : '',
      createdBy: form.createdBy || '',
      customFields: form.customFields || []
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (formData.customFields.some(f => !f.label.trim())) {
      return toast.error('All custom fields must have a label');
    }
    try {
      await api.put(`/forms/edit/${editFormId}`, formData);
      toast.success('Form updated successfully');
      setIsEditModalOpen(false);
      setEditFormId(null);
      setFormData({ formName: '', formSlug: '', startDate: '', endDate: '', customFields: [] });
      fetchForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update form');
    }
  };

  const toggleStatus = async (form) => {
    try {
      await api.put(`/forms/edit/${form._id}`, { isClosed: !form.isClosed });
      toast.success('Status updated');
      fetchForms();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form? This will permanently delete the form and ALL associated student submissions.')) {
      return;
    }
    try {
      await api.delete(`/forms/${id}`);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (err) {
      toast.error('Failed to delete form');
    }
  };

  const copyToClipboard = async (slug) => {
    const url = `${window.location.origin}/form/${slug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-HTTPS environments (like local IP testing)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      customFields: [...formData.customFields, { label: '', type: 'text', placeholder: '', required: false }]
    });
  };

  const removeCustomField = (index) => {
    const newFields = formData.customFields.filter((_, i) => i !== index);
    setFormData({ ...formData, customFields: newFields });
  };

  const updateCustomField = (index, updates) => {
    const newFields = formData.customFields.map((field, i) => i === index ? { ...field, ...updates } : field);
    setFormData({ ...formData, customFields: newFields });
  };

  const renderFormModal = (isEdit = false) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)}></div>
      <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-white/50">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</h2>
          <button onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 rounded-full p-2 transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={isEdit ? handleEdit : handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
            <input
              type="text" required placeholder="e.g. Week 1 React Challenges"
              className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all sm:text-sm"
              value={formData.formName}
              onChange={e => setFormData({...formData, formName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL Slug</label>
            <div className="flex rounded-lg shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                /form/
              </span>
              <input
                type="text" required placeholder="react-week1"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all sm:text-sm"
                value={formData.formSlug}
                onChange={e => setFormData({...formData, formSlug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name (Created By)</label>
            <input
              type="text" required placeholder="Your Name"
              className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all sm:text-sm"
              value={formData.createdBy}
              onChange={e => setFormData({...formData, createdBy: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date" required
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all sm:text-sm"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date" required
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all sm:text-sm"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Custom Fields (Optional)</label>
              <button 
                type="button" onClick={addCustomField}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Field
              </button>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {formData.customFields.map((field, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative group">
                  <button 
                    type="button" onClick={() => removeCustomField(index)}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" placeholder="Field Label (e.g. Github Link)"
                      className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={field.label} onChange={e => updateCustomField(index, { label: e.target.value })}
                    />
                    <select
                      className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                      value={field.type} onChange={e => updateCustomField(index, { type: e.target.value })}
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="number">Number</option>
                    </select>
                    <input
                      type="text" placeholder="Placeholder (optional)"
                      className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none col-span-2"
                      value={field.placeholder} onChange={e => updateCustomField(index, { placeholder: e.target.value })}
                    />
                    <label className="flex items-center text-[10px] text-gray-500 col-span-2">
                      <input 
                        type="checkbox" className="mr-1.5" 
                        checked={field.required} onChange={e => updateCustomField(index, { required: e.target.checked })}
                      />
                      Mark as required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)}
              className="px-5 py-3 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 rounded-xl text-sm font-bold transition-all"
            >
              {isEdit ? 'Save Changes' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 relative z-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800 tracking-tight">
            Form Campaigns
          </h1>
          <p className="text-slate-500 font-medium mt-1">Create and manage your student tracking forms</p>
        </div>
        <button
          onClick={() => {
            setFormData({ 
              formName: '', 
              formSlug: '', 
              startDate: '', 
              endDate: '', 
              createdBy: currentAdmin?.name || '',
              customFields: [] 
            });
            setIsModalOpen(true);
          }}
          className="mt-4 sm:mt-0 flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Forms List Section */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Identity</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Share Link</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {forms.map(form => (
                <tr key={form._id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-sm ${form.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                        <Box className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-base">{form.formName}</p>
                        <p className="text-xs font-semibold text-slate-400">By {form.createdBy || 'Admin'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm w-fit group-hover:border-indigo-100 transition-colors">
                      <LinkIcon className="w-4 h-4 text-indigo-400" />
                      <a href={`/form/${form.formSlug}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors font-bold">
                        /{form.formSlug}
                      </a>
                      <div className="w-px h-4 bg-slate-200 mx-2"></div>
                      <button onClick={() => copyToClipboard(form.formSlug)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center text-sm font-semibold text-slate-600 bg-slate-50/50 px-4 py-2 rounded-xl w-fit">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                      {new Date(form.startDate).toLocaleDateString()} <span className="mx-2 text-slate-300">-</span> {new Date(form.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleStatus(form)}
                      className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        form.isClosed 
                        ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      {form.isClosed ? 'Closed' : 'Active'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(form)}
                        className="p-2.5 text-indigo-400 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                        title="Edit Form"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form._id)}
                        className="p-2.5 text-rose-400 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                        title="Delete Form"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 p-4">
          {forms.map(form => (
            <div key={form._id} className="py-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-sm ${form.isClosed ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{form.formName}</p>
                    <button 
                      onClick={() => toggleStatus(form)}
                      className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        form.isClosed ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}
                    >
                      {form.isClosed ? 'Closed' : 'Active'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => openEditModal(form)} className="p-2.5 text-indigo-400 bg-indigo-50 rounded-xl">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteForm(form._id)} className="p-2.5 text-rose-400 bg-rose-50 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center text-sm font-bold text-indigo-600">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    /{form.formSlug}
                  </div>
                  <button onClick={() => copyToClipboard(form.formSlug)} className="text-slate-400 hover:text-indigo-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm font-semibold text-slate-500 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                  {new Date(form.startDate).toLocaleDateString()} - {new Date(form.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {forms.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No campaigns found. Create your first form to get started.
          </div>
        )}
      </div>

      {isModalOpen && renderFormModal(false)}
      {isEditModalOpen && renderFormModal(true)}
    </div>
  );
}
