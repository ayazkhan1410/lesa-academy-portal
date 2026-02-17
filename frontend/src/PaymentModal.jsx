import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, CreditCard, CheckCircle, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, studentId, studentName, currentAmount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const getCurrentMonthFirstDate = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().slice(0, 10);
  };

  const [formData, setFormData] = useState({
    amount: currentAmount || '', // ✅ PRE-FILL with existing amount
    month_paid_for: getCurrentMonthFirstDate(),
    status: 'paid',
    screenshot: null
  });

  // Sync amount if it changes in the parent component
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: currentAmount || '',
        month_paid_for: getCurrentMonthFirstDate(),
        status: 'paid',
        screenshot: null
      });
      setPreview(null);
    }
  }, [isOpen, currentAmount]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large (Max 5MB)");
        return;
      }
      setFormData({ ...formData, screenshot: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VISUAL FEEDBACK: Immediate toast to let the user know something is happening
    const loadingToast = toast.loading("Processing transaction...");

    if (!studentId) {
      toast.error("Student ID missing. Please refresh.", { id: loadingToast });
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('student', studentId);
    data.append('month_paid_for', formData.month_paid_for);
    data.append('status', formData.status);

    // ✅ LOGIC: Only send amount if the user changed it or if it's new
    if (formData.amount) {
      data.append('amount', formData.amount);
    }

    if (formData.screenshot) {
      data.append('screenshot', formData.screenshot);
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('http://127.0.0.1:8000/api/payments/', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // ✅ SUCCESS NOTIFICATION
      toast.success(response.data.message || "Record updated successfully!", { id: loadingToast });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ API Error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || "Failed to save record.";
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-emerald-500/20 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-emerald-500/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Record Payment</h2>
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Student: {studentName}</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                  Amount (Rs)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 font-mono font-bold"
                />
              </div>
              <div>
                <label htmlFor="status" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 font-bold text-sm"
                >
                  <option value="paid">✅ Paid</option>
                  <option value="pending">⚠️ Pending</option>
                  <option value="late">⏰ Late</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="month_paid_for" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">For Month</label>
              <input
                id="month_paid_for"
                name="month_paid_for"
                type="date"
                value={formData.month_paid_for}
                onChange={handleChange}
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50 font-medium"
              />
            </div>

            <div>
              <label htmlFor="screenshot-upload" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Payment Screenshot</label>
              <div className="relative w-full">
                <input
                  type="file"
                  id="screenshot-upload"
                  name="screenshot"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="screenshot-upload" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${preview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-950 hover:bg-slate-800'}`}>
                  {preview ? (
                    <div className="relative h-full w-full p-2">
                      <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="text-slate-500 mb-2" size={24} />
                      <p className="text-xs text-slate-400 font-bold">Upload Screenshot</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl bg-emerald-600 text-white font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Update Record</>}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
