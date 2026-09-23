import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Upload, FileText, Trash2, ChevronDown, ChevronUp, Loader, ScanLine } from 'lucide-react';

export default function PDFUploadModal({ token, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  // [{file, facultyName, subjectCode, programme, semester, scanned, scanning}]
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const inputRef = useRef();

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  async function addFiles(newFiles) {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfs.length === 0) return toast.error('Only PDF files are accepted');
    if (files.length + pdfs.length > 50) return toast.error('Maximum 50 PDFs at a time');

    // Add with placeholder metadata first
    const entries = pdfs.map(f => ({
      file: f,
      facultyName: f.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim(),
      subjectCode: '',
      programme: '',
      semester: '',
      driveLink: '',
      scanned: false,
    }));

    setFiles(prev => {
      const updated = [...prev, ...entries];
      // Auto-scan the new files
      scanFiles(pdfs, prev.length, updated);
      return updated;
    });
  }

  // Send PDFs to backend to extract metadata
  async function scanFiles(pdfFiles, startIdx, currentFiles) {
    setScanning(true);
    try {
      const formData = new FormData();
      pdfFiles.forEach(f => formData.append('pdfs', f));

      const { data } = await api.post('/api/process/scan-pdfs', formData);

      setFiles(prev => {
        const updated = [...prev];
        data.results.forEach((result, i) => {
          const idx = startIdx + i;
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx],
              facultyName: result.facultyName || updated[idx].facultyName,
              subjectCode: result.subjectCode || '',
              programme: result.programme || '',
              semester: result.semester || '',
              scanned: true,
              scanning: false
            };
          }
        });
        return updated;
      });
    } catch {
      // On scan failure, just mark as done — user can fill manually
      setFiles(prev => prev.map((f, i) =>
        i >= startIdx ? { ...f, scanning: false, scanned: false } : f
      ));
    } finally {
      setScanning(false);
    }
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function updateMeta(idx, field, value) {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [files]);

  async function handleUpload() {
    if (files.length === 0) return toast.error('Add at least one PDF');
    if (files.some(f => f.scanning)) return toast.error('Please wait — still scanning PDFs');
    setUploading(true);

    const formData = new FormData();
    files.forEach(entry => formData.append('pdfs', entry.file));

    const metadata = files.map(({ facultyName, subjectCode, programme, semester }) => ({
      facultyName, subjectCode, programme, semester
    }));
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const { data } = await axios.post('/api/process/upload-pdfs', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${data.total} PDF(s) uploaded — analyzing now`);
      onUploaded(data.reportIds);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const totalSizeMB = (files.reduce((s, f) => s + f.file.size, 0) / (1024 * 1024)).toFixed(1);
  const stillScanning = files.some(f => f.scanning);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !uploading) onClose && onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, uploading]);

  const modalJSX = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Upload Feedback PDFs</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fields are auto-filled by reading the PDF content
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="px-6 pt-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
              ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-600">Drag & drop PDFs here, or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Fields auto-filled from PDF content · Up to 50 PDFs · Max 20MB each</p>
            <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden"
              onChange={e => addFiles(e.target.files)} />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {files.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No files added yet</p>
          ) : (
            files.map((entry, idx) => (
              <div key={idx} className="border rounded-xl overflow-hidden">
                {/* File row */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                  <FileText size={18} className="text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{entry.file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.scanning ? (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                          <Loader size={11} className="animate-spin" /> Scanning PDF...
                        </span>
                      ) : entry.scanned ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <ScanLine size={11} /> Auto-filled from PDF
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Fill manually</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                    {expandedIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => removeFile(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Quick preview of extracted data (always visible) */}
                {!entry.scanning && (
                  <div className="px-4 py-2 bg-white border-t flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span><span className="text-gray-400">Faculty:</span> {entry.facultyName || <em className="text-gray-300">not found</em>}</span>
                    <span><span className="text-gray-400">Code:</span> {entry.subjectCode || <em className="text-gray-300">not found</em>}</span>
                    <span><span className="text-gray-400">Course Name:</span> {entry.programme || <em className="text-gray-300">not found</em>}</span>
                    <span><span className="text-gray-400">Sem:</span> {entry.semester || <em className="text-gray-300">not found</em>}</span>
                  </div>
                )}

                {/* Editable metadata form */}
                {expandedIdx === idx && (
                  <div className="px-4 py-3 bg-indigo-50 border-t grid grid-cols-2 gap-3">
                    {[
                      { label: 'Faculty Name', field: 'facultyName', placeholder: 'Dr. John Smith' },
                      { label: 'Subject Code', field: 'subjectCode', placeholder: 'CS101' },
                      { label: 'Course Name', field: 'programme', placeholder: 'B.Tech CSE' },
                      { label: 'Semester', field: 'semester', placeholder: '3' },
                    ].map(({ label, field, placeholder }) => (
                      <div key={field}>
                        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                        <input
                          type="text"
                          className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                          value={entry[field]}
                          onChange={e => updateMeta(idx, field, e.target.value)}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <div className="text-sm text-gray-500">
            {files.length > 0
              ? <span>{files.length} file{files.length > 1 ? 's' : ''} · {totalSizeMB} MB</span>
              : <span>No files selected</span>}
            {stillScanning && <span className="ml-2 text-amber-500 text-xs">· scanning...</span>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={uploading}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={uploading || files.length === 0 || stillScanning}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
              {uploading
                ? <><Loader size={15} className="animate-spin" /> Uploading...</>
                : <><Upload size={15} /> Analyze {files.length > 0 ? `${files.length} PDF${files.length > 1 ? 's' : ''}` : ''}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : modalJSX;
}
