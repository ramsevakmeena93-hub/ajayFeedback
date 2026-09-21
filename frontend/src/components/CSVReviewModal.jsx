import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, ChevronRight, X, Loader } from "lucide-react";
import { getPdfUrl } from "../api";

export default function CSVReviewModal({ currentData, currentIdx, total, processing, onOk, onClose }) {
  const isLast = currentIdx === total - 1;
  const progress = Math.round((currentIdx / total) * 100);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const modalJSX = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-indigo-50 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-indigo-800 text-lg">Review PDF Reports</h2>
            <p className="text-xs text-indigo-500 mt-0.5">Read each report then click OK to confirm and load next</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>S.No {currentIdx + 1} of {total}</span>
            <span>{progress}% done</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {processing ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/>
              <p className="text-slate-600 text-sm font-semibold">Loading PDF {currentIdx + 1} of {total}</p>
              <p className="text-slate-400 text-xs text-center max-w-xs">Downloading and analyzing from Google Drive...</p>
            </div>
          ) : !currentData ? (
            <div className="text-center py-16 text-gray-400">Waiting...</div>
          ) : currentData.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 font-medium">Failed to load PDF {currentIdx + 1}</p>
              <p className="text-red-400 text-sm mt-1">Click OK to skip and continue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Faculty Info Card */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        S.No {currentIdx + 1}
                      </span>
                      <h3 className="font-bold text-gray-800 text-base">
                        {currentData.facultyName || "Unknown Faculty"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      {[currentData.subjectCode, currentData.programme,
                        currentData.semester ? `Sem ${currentData.semester}` : ""]
                        .filter(Boolean).join(" · ") || "No details"}
                    </p>
                  </div>
                  {currentData.ffiScore != null && (
                    <div className="flex gap-4 items-center shrink-0">
                      <div className="text-right">
                        <span className="text-xl font-bold text-slate-700">
                          {currentData.responseCount ?? currentData.totalResponses ?? "0"}
                        </span>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Responses</p>
                      </div>
                      <div className="w-px h-10 bg-slate-200"></div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${
                          currentData.ffiScore >= 4 ? "text-green-600" :
                          currentData.ffiScore >= 3 ? "text-amber-600" : "text-red-600"
                        }`}>{currentData.ffiScore.toFixed(2)}</span>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">FFI Score</p>
                      </div>
                    </div>
                  )}
                </div>
                {currentData._id && (
                  <a href={getPdfUrl(currentData)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                    <ExternalLink size={12} /> View Full PDF
                  </a>
                )}
              </div>

              {/* Yellow — Attention */}
              <div className="rounded-xl border border-yellow-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border-b border-yellow-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="text-sm font-semibold text-yellow-700">Comments Needing Attention</span>
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                    {currentData.commentsNeedingAttention?.length || 0}
                  </span>
                </div>
                <div className="p-4">
                  {!currentData.commentsNeedingAttention?.length ? (
                    <p className="text-xs text-gray-400 italic">None found</p>
                  ) : (
                    <ul className="space-y-2">
                      {currentData.commentsNeedingAttention.map((t, i) => (
                        <li key={i} className="flex gap-2 items-start text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>{t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Red — Appreciation */}
              <div className="rounded-xl border border-red-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-sm font-semibold text-red-700">Appreciation / Remark</span>
                  <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {currentData.appreciation?.length || 0}
                  </span>
                </div>
                <div className="p-4">
                  {!currentData.appreciation?.length ? (
                    <p className="text-xs text-gray-400 italic">None found</p>
                  ) : (
                    <ul className="space-y-2">
                      {currentData.appreciation.map((t, i) => (
                        <li key={i} className="flex gap-2 items-start text-sm text-gray-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></span>{t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i < currentIdx ? "bg-green-400" :
                i === currentIdx ? "bg-indigo-500" : "bg-gray-200"
              }`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const proceed = async () => {
                  for (let i = currentIdx; i < total; i++) {
                    await onOk();
                    // Small delay to let UI breathe
                    await new Promise(r => setTimeout(r, 100));
                  }
                };
                proceed();
              }}
              disabled={processing}
              className="px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition"
            >
              Process All
            </button>
            <button
              onClick={onOk}
              disabled={processing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition text-sm shadow-lg shadow-indigo-200"
            >
              {isLast ? "Done - All Reviewed" : "OK"}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : modalJSX;
}
