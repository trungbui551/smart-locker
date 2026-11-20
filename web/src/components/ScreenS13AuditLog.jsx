import { useState } from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';

/**
 * Màn hình S13 — Nhật ký thao tác (Audit Log — Vận hành & Admin)
 * Tuyệt đối không lưu hay hiển thị mật khẩu và mã OTP dạng chữ thường.
 */
export default function ScreenS13AuditLog({ theme: t, auditLogs }) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filtered = auditLogs.filter((log) => {
    const matchRole = roleFilter === 'ALL' || log.role === roleFilter;
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q);
    return matchRole && matchQ;
  });

  return (
    <div className="space-y-4">
      <div className={`${t.otpContainer} p-4 flex flex-wrap items-center justify-between gap-2 text-xs`}>
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Chính sách bảo mật: Nhật ký tự động ẩn mọi mật khẩu và mã OTP.</span>
        </div>
        <span className="text-blue-200">Tổng số bản ghi: {auditLogs.length}</span>
      </div>

      <div className={`${t.card} p-4 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3`}>
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo người thao tác, mã hành động..."
            aria-label="Tìm kiếm nhật ký thao tác"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'OPERATOR', 'ADMIN', 'COURIER', 'RECIPIENT', 'SYSTEM'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer ${
                roleFilter === r ? t.primaryBtn : t.secondaryBtn
              }`}
            >
              {r === 'ALL' ? 'Tất cả' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((log) => (
          <div key={log.id} className={`${t.card} p-4 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-2`}>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-md ${t.sizeTag}`}>
                  {log.action}
                </span>
                <span className={`text-sm font-bold ${t.heading}`}>{log.actor}</span>
                <span className={`text-xs ${t.mutedText}`}>({log.role})</span>
              </div>
              <p className={`text-xs ${t.bodyText} flex items-start gap-1.5`}>
                <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${t.mutedText}`} aria-hidden="true" />
                {log.detail}
              </p>
            </div>
            <span className={`text-xs font-mono-code shrink-0 ${t.mutedText}`}>{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
