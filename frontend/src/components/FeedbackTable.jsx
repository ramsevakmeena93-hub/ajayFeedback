import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Eye, Trash2, Pencil, X as XIcon, Check } from "lucide-react";
import ReportDetailModal from "./ReportDetailModal";

const STATUS_CFG = {
  processed:       { cls:"badge-emerald", label:"Processed" },
  pending:         { cls:"badge-slate",   label:"Pending"   },
  error:           { cls:"badge-red",     label:"Error"     },
  sent_to_faculty: { cls:"badge-indigo",  label:"Sent"      },
  faculty_approved:{ cls:"badge-emerald", label:"Approved"  },
};

function CommentList({ items, color, commentPercentages }) {
  const isApp = color === "red";
  if (isApp) {
    const pcts = commentPercentages || {};
    const entries = Object.entries(pcts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
    const longComments = (items || []).filter(c => c.trim().split(/\s+/).length > 4);
    if (entries.length === 0 && longComments.length === 0) return <span className="text-xs text-slate-300 italic">None</span>;
    return (
      <div className="space-y-1 max-w-[200px]">
        {entries.map(([label, pct]) => (
          <span key={label} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2 py-0.5 font-semibold inline-block mr-1">
            {label} {pct}%
          </span>
        ))}
        {longComments.slice(0,2).map((t,i) => (
          <div key={i} className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-2 py-1 leading-snug">{t}</div>
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) return <span className="text-xs text-slate-300 italic">None</span>;
  return (
    <div className="space-y-1 max-w-[200px]">
      {items.map((t,i) => (
        <div key={i} className="text-xs bg-amber-50 border border-amber-100 text-amber-800 rounded-lg px-2 py-1 leading-snug">{t}</div>
      ))}
    </div>
  );
}

function EditableComments({ reportId, field, items, color, commentPercentages, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState((items || []).join('\n'));
  function save() {
    const list = val.split('\n').map(s => s.trim()).filter(Boolean);
    onSave && onSave(reportId, field, list);
    setEditing(false);
  }
  const isAtt = color === "red";
  const bg = isAtt ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (editing) return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <textarea autoFocus rows={4} className="input text-xs resize-none py-1 w-full"
        value={val} onChange={e => setVal(e.target.value)} placeholder="One comment per line..." />
      <div className="flex gap-1">
        <button onClick={save} className="btn btn-success btn-sm text-xs py-0.5">✓ Save</button>
        <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm text-xs py-0.5">✕</button>
      </div>
    </div>
  );
  const display = items && items.length > 0 ? items : null;
  const pcts = !isAtt && commentPercentages ? Object.entries(commentPercentages).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]) : [];
  return (
    <div className="group relative cursor-pointer" onClick={() => { setVal((items||[]).join('\n')); setEditing(true); }}>
      <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto scrollbar-thin pr-1">
        {!isAtt && pcts.map(([k,v],i) => (
          <div key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 text-xs font-medium">{k}: {v}%</div>
        ))}
        {display ? display.map((c,i) => (
          <div key={i} className={`border rounded px-2 py-0.5 text-xs leading-snug ${bg}`}>{c}</div>
        )) : <span className="text-slate-300 italic text-xs">-</span>}
      </div>
      <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition"><Pencil size={10} className="text-slate-400"/></span>
    </div>
  );
}

function ActionTakenCell({ reportId, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  function save() { onSave && onSave(reportId, "actionTaken", val); setEditing(false); }
  if (editing) return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <textarea autoFocus rows={3} className="input text-xs resize-none py-1.5"
        value={val} onChange={e => setVal(e.target.value)} placeholder="Describe action taken..." />
      <div className="flex gap-1">
        <button onClick={save} className="btn btn-success btn-sm text-xs py-1">Save</button>
        <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm text-xs py-1">Cancel</button>
      </div>
    </div>
  );
  return (
    <div onClick={() => { setVal(value || ""); setEditing(true); }}
      className="cursor-pointer min-w-[110px] max-w-[160px] min-h-[36px] rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 px-2.5 py-1.5 transition-all">
      {value ? <p className="text-xs text-slate-700 leading-snug">{value}</p>
              : <p className="text-xs text-slate-400 italic">Click to add...</p>}
    </div>
  );
}

function EditableCell({ reportId, field, value, onEdit, cls }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  function save() { onEdit && onEdit(reportId, field, val); setEditing(false); }
  if (editing) return (
    <div className="flex gap-1 items-center">
      <input autoFocus className="input text-xs w-28 py-1" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
      <button onClick={save} className="text-emerald-600 text-xs font-bold hover:text-emerald-700">✓</button>
      <button onClick={() => setEditing(false)} className="text-red-400 text-xs hover:text-red-600">✕</button>
    </div>
  );
  return (
    <span className={"cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 rounded-lg px-1.5 py-0.5 transition-colors text-sm " + (cls || "")}
      title="Click to edit" onClick={() => { setVal(value || ""); setEditing(true); }}>
      {value || <span className="text-slate-300 italic text-xs">—</span>}
    </span>
  );
}

const PAGE_SIZE = 10;

export default function FeedbackTable({ reports, selected, onSelect, okReviewed, onInlineOk, onSendToFaculty, onHODApprove, onFieldEdit, onDeleteReport, hodUser, vcUser, submittedIds }) {
  const reviewed = okReviewed || new Set();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewReport, setViewReport] = useState(null);

  const filtered = reports.filter(r =>
    !search || r.facultyName?.toLowerCase().includes(search.toLowerCase()) || r.subjectCode?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const isSubmitted = (reportId) => submittedIds && submittedIds.has(String(reportId));
  const selectableIds = reports.filter(r => (r.status === "processed" || r.status === "faculty_approved") && !isSubmitted(r._id)).map(r => r._id);

  function toggleAll() { onSelect(selected.length === selectableIds.length ? [] : selectableIds); }
  function toggleSelect(id) { onSelect(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function parseCodeBatch(subjectCode) {
    if (!subjectCode) return { code:"—", batch:"—" };
    const m = subjectCode.match(/^([A-Za-z0-9]+)[-\s]+(Batch[-\s]*[A-Za-z0-9]+|[A-Za-z][-\s]*[A-Za-z0-9]*)$/i);
    if (m) return { code: m[1].trim(), batch: m[2].trim() };
    const parts = subjectCode.split("-");
    if (parts.length >= 2) {
      return { code: parts[0].trim(), batch: parts.slice(1).join("-").trim() };
    }
    return { code: subjectCode.trim(), batch: "—" };
  }

  // Can delete: not faculty_approved, not submitted
  function canDelete(report) {
    if (report.status === "faculty_approved") return false;
    if (isSubmitted(report._id)) return false;
    return true;
  }

  if (reports.length === 0) return (
    <div className="card p-20 text-center animate-fade-in">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">📋</span>
      </div>
      <p className="text-slate-700 font-semibold text-base">No reports yet</p>
      <p className="text-slate-400 text-sm mt-1">Upload a CSV file to get started</p>
    </div>
  );

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Search + pagination header */}
      <div className="px-5 py-3.5 border-b bg-slate-50/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search faculty or subject..."
            className="input input-search max-w-xs text-xs py-2 pl-9"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">{filtered.length} records</span>
          <span className="text-slate-300">·</span>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-icon btn-ghost p-1 disabled:opacity-30"><ChevronLeft size={14}/></button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-icon btn-ghost p-1 disabled:opacity-30"><ChevronRight size={14}/></button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="table-header">
            <tr>
              <th className="px-3 py-3 w-8"><input type="checkbox" checked={selected.length===selectableIds.length && selectableIds.length>0} onChange={toggleAll} className="rounded accent-indigo-600" /></th>
              <th className="px-3 py-3 text-left">S.No</th>
              <th className="px-3 py-3 text-left">Faculty Name</th>
              <th className="px-3 py-3 text-left">Subject Code</th>
              <th className="px-3 py-3 text-left">Course Name</th>
              <th className="px-3 py-3 text-center">Sem</th>
              <th className="px-3 py-3 text-center">FFI</th>
              <th className="px-3 py-3 text-center">Resp. %</th>
              <th className="px-3 py-3 text-left">Needs Attention</th>
              <th className="px-3 py-3 text-left">Appreciation</th>
              <th className="px-3 py-3 text-left">Action Taken</th>
              <th className="px-3 py-3 text-center">View</th>
              {onDeleteReport && <th className="px-3 py-3 text-center">Del</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((report, idx) => {
              const { code, batch } = parseCodeBatch(report.subjectCode);
              const deletable = canDelete(report);
              return (
                <tr key={report._id} className={`table-row align-top ${selected.includes(report._id) ? "bg-indigo-50/60" : ""}`}>
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(report._id)} onChange={() => toggleSelect(report._id)} disabled={(report.status!=="processed" && report.status!=="faculty_approved") || isSubmitted(report._id)} className="rounded accent-indigo-600" /></td>
                  <td className="px-3 py-3 text-slate-400 text-xs font-medium">{(page-1)*PAGE_SIZE+idx+1}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800 whitespace-nowrap">
                    <EditableCell reportId={report._id} field="facultyName" value={report.facultyName} onEdit={onFieldEdit} cls="font-semibold" />
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                    <EditableCell reportId={report._id} field="subjectCode" value={report.subjectCode} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">
                    <EditableCell reportId={report._id} field="programme" value={report.programme} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-center text-xs">
                    <EditableCell reportId={report._id} field="semester" value={report.semester} onEdit={onFieldEdit} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    {report.ffiScore!=null ? (
                      <span className={`text-sm font-bold ${report.ffiScore>=4?"text-emerald-600":report.ffiScore>=3?"text-amber-600":"text-red-600"}`}>
                        {report.ffiScore.toFixed(2)}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-semibold text-slate-500">
                      {report.responsePercent != null ? `${Number(report.responsePercent).toFixed(2)}%` : (report.responseCount != null ? String(report.responseCount) : "-")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs max-w-[200px] whitespace-normal">
                    <EditableComments
                      reportId={report._id}
                      field="commentsNeedingAttention"
                      items={report.commentsNeedingAttention}
                      color="red"
                      onSave={onFieldEdit}
                    />
                  </td>
                  <td className="px-3 py-3 text-xs max-w-[200px] whitespace-normal">
                    <EditableComments
                      reportId={report._id}
                      field="appreciation"
                      items={report.appreciation}
                      color="green"
                      commentPercentages={report.commentPercentages}
                      onSave={onFieldEdit}
                    />
                  </td>
                  <td className="px-3 py-3"><ActionTakenCell reportId={report._id} value={report.actionTaken} onSave={onFieldEdit} /></td>
                  <td className="px-3 py-3">
                    <button onClick={() => setViewReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors border border-indigo-200">
                      <Eye size={12}/> View
                    </button>
                  </td>
                  {onDeleteReport && (
                    <td className="px-3 py-3 text-center">
                      {deletable ? (
                        <button
                          onClick={() => onDeleteReport(report._id)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors border border-red-100 mx-auto"
                          title="Delete report"
                        >
                          <Trash2 size={12}/>
                        </button>
                      ) : (
                        <span className="text-slate-200 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Signature section at bottom — HOD and VC only */}
      <div className="border-t-2 border-slate-200 bg-white mx-0">
        <div className="flex items-stretch divide-x divide-slate-200">

          {/* HOD Signature */}
          <div className="flex-1 flex flex-col items-center justify-between px-10 py-6 gap-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">HOD Signature</p>
            <div className="w-full flex items-center justify-center min-h-[56px]">
              {hodUser?.signatureImage ? (
                <img src={hodUser.signatureImage} alt="HOD Signature"
                  className="max-h-14 max-w-[180px] object-contain" />
              ) : (
                <div className="w-48 border-b-2 border-slate-400"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{hodUser?.name || "Head of Department"}</p>
              <p className="text-xs text-slate-400 mt-0.5">HOD</p>
            </div>
          </div>

          {/* VC Signature */}
          <div className="flex-1 flex flex-col items-center justify-between px-10 py-6 gap-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">VC Signature</p>
            <div className="w-full flex items-center justify-center min-h-[56px]">
              {vcUser?.signatureImage ? (
                <img src={vcUser.signatureImage} alt="VC Signature"
                  className="max-h-14 max-w-[180px] object-contain" />
              ) : (
                <div className="w-48 border-b-2 border-slate-400"></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{vcUser?.name || "Pro Vice-Chancellor"}</p>
              <p className="text-xs text-slate-400 mt-0.5">VC</p>
            </div>
          </div>

        </div>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${p===page?"bg-indigo-600 text-white shadow-sm":"hover:bg-slate-200 text-slate-600"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          onClose={() => setViewReport(null)}
          onSendToFaculty={onSendToFaculty ? (id) => { onSendToFaculty(id); } : null}
          onHODApprove={onHODApprove ? (id, reason) => { onHODApprove(id, reason); } : null}
          onFieldEdit={onFieldEdit}
        />
      )}
    </div>
  );
}
