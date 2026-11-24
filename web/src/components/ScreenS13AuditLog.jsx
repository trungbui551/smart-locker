import { useState } from 'react';
import { FileText, RefreshCw, Search, ShieldCheck } from 'lucide-react';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

const ACTION_GROUPS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'OPEN', label: 'Mở tủ / MQTT' },
  { key: 'OTP', label: 'OTP' },
  { key: 'LOCKER', label: 'Tủ / Ngăn' },
  { key: 'ADMIN', label: 'Quản trị' },
];

/**
 * Màn hình S13 — Nhật ký thao tác thật (GET /api/operator/audit-logs)
 * Tuyệt đối không lưu hay hiển thị mật khẩu và mã OTP dạng chữ thường.
 */
export default function ScreenS13AuditLog({ theme: t, auditLogs, loading, onRefresh }) {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');

  const filtered = auditLogs.filter((log) => {
    const action = (log.action || '').toUpperCase();
    const matchGroup =
      groupFilter === 'ALL' ||
      (groupFilter === 'OPEN' && (action.includes('OPEN') || action.includes('DOOR') || action.includes('PICKUP') || action.includes('ALLOCATE'))) ||
      (groupFilter === 'OTP' && action.includes('OTP')) ||
      (groupFilter === 'LOCKER' && (action.includes('LOCKER') || action.includes('COMPARTMENT') || action.includes('FAULT'))) ||
      (groupFilter === 'ADMIN' && action.includes('ADMIN'));

    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.detail || '').toLowerCase().includes(q) ||
      String(log.actorId || '').includes(q);
    return matchGroup && matchQ;
  });

  return (
    <div className="space-y-4">
      <div className={`${t.otpContainer} p-4 flex flex-wrap items-center justify-between gap-2 text-xs`}>
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Chính sách bảo mật: Nhật ký CSDL tự động ẩn mọi mật khẩu và mã OTP.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-200">Tổng số bản ghi: {auditLogs.length}</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      <div className={`${t.card} p-4 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3`}>
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã hành động hoặc nội dung..."
            aria-label="Tìm kiếm nhật ký thao tác"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ACTION_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroupFilter(g.key)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer ${
                groupFilter === g.key ? t.primaryBtn : t.secondaryBtn
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={`${t.card} p-8 text-center text-sm ${t.mutedText}`}>
          Không tìm thấy bản ghi nhật ký phù hợp.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((log) => (
            <div key={log.id} className={`${t.card} p-4 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-2`}>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-md ${t.sizeTag}`}>
                    {log.action}
                  </span>
                  <span className={`text-xs font-semibold ${t.mutedText}`}>
                    {log.actorId ? `User #${log.actorId}` : 'Hệ thống (MQTT / Scheduler)'}
                  </span>
                </div>
                <p className={`text-xs ${t.bodyText} flex items-start gap-1.5`}>
                  <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${t.mutedText}`} aria-hidden="true" />
                  {log.detail}
                </p>
              </div>
              <span className={`text-xs font-mono-code shrink-0 ${t.mutedText}`}>
                {formatTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
