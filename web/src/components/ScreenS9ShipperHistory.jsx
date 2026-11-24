import { useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'READY', label: 'Chờ nhận' },
  { key: 'STORING', label: 'Đang bỏ hàng' },
  { key: 'PICKED_UP', label: 'Đã nhận' },
  { key: 'EXPIRED', label: 'Quá hạn 72h' },
];

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Màn hình S9 — Lịch sử đơn đã gửi (Shipper — dữ liệu thật từ GET /api/deliveries/my)
 */
export default function ScreenS9ShipperHistory({
  theme: t,
  deliveries,
  loading,
  onRefresh,
  onGoToS7,
}) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const filtered = deliveries.filter((d) => {
    const matchStatus = filter === 'ALL' || d.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      String(d.id).includes(q) ||
      (d.recipientFullName || '').toLowerCase().includes(q) ||
      (d.recipientUsername || '').toLowerCase().includes(q) ||
      (d.lockerId || '').toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const countByStatus = (st) => deliveries.filter((d) => d.status === st).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-3">
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-medium ${t.mutedText}`}>Tổng đơn đã gửi</div>
          <div className={`text-2xl font-extrabold ${t.heading} mt-1`}>{deliveries.length}</div>
        </div>
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-medium ${t.mutedText}`}>Đang chờ nhận</div>
          <div className={`text-2xl font-extrabold ${t.accentText} mt-1`}>{countByStatus('READY')}</div>
        </div>
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-medium ${t.mutedText}`}>Đã nhận xong</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{countByStatus('PICKED_UP')}</div>
        </div>
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-medium ${t.mutedText}`}>Quá hạn 72 giờ</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{countByStatus('EXPIRED')}</div>
        </div>
      </div>

      <div className={`${t.card} p-4 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3`}>
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, người nhận, mã tủ..."
            aria-label="Tìm kiếm đơn hàng"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                filter === tab.key ? t.navActive : t.subtleBtn
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${t.secondaryBtn}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onGoToS7}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Gửi đơn mới
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={`${t.card} p-8 text-center text-sm ${t.mutedText}`}>
          Không có đơn hàng nào khớp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const statusStyle =
              d.status === 'READY'
                ? { badge: t.badgeReady, label: 'Chờ nhận', Icon: Clock }
                : d.status === 'PICKED_UP'
                ? { badge: t.badgeSuccess, label: 'Đã nhận', Icon: CheckCircle2 }
                : d.status === 'STORING'
                ? { badge: t.badgeWarn, label: 'Đang bỏ hàng', Icon: Clock }
                : { badge: t.badgeError, label: 'Quá hạn 72h', Icon: AlertTriangle };
            const StatusIcon = statusStyle.Icon;

            return (
              <div
                key={d.id}
                className={`${t.card} ${t.cardHover} p-4 @2xl:p-5 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4 transition-colors`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono-code font-bold text-sm ${t.heading}`}>Đơn #{d.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.badge}`}>
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      {statusStyle.label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                      {d.lockerId} · Ngăn #{d.compartmentNumber} · Cỡ {getSizeLabel(d.packageSize)}
                    </span>
                  </div>

                  <div className={`text-sm font-semibold ${t.bodyText} flex items-center gap-1.5`}>
                    <User className={`w-4 h-4 ${t.mutedText}`} aria-hidden="true" />
                    {d.recipientFullName}
                    <span className={`text-xs font-normal ${t.mutedText}`}>(@{d.recipientUsername})</span>
                  </div>

                  <div className={`text-xs ${t.mutedText} flex flex-wrap items-center gap-3`}>
                    <span className="inline-flex items-center gap-1">
                      <Box className="w-3.5 h-3.5" aria-hidden="true" />
                      Tạo lúc: {formatTime(d.createdAt)}
                    </span>
                    <span>•</span>
                    <span>Hạn lưu: {formatTime(d.expiresAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
