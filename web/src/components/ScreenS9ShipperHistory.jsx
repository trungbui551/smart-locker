import { useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  KeyRound,
  Plus,
  Search,
  User,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'READY', label: 'Chờ nhận' },
  { key: 'PICKED_UP', label: 'Đã nhận' },
  { key: 'EXPIRED', label: 'Quá hạn 72h' },
];

/**
 * Màn hình S9 — Lịch sử đơn đã gửi (dành cho Shipper)
 */
export default function ScreenS9ShipperHistory({ theme: t, deliveries, onGoToS6, onGoToS7 }) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const filtered = deliveries.filter((d) => {
    const matchStatus = filter === 'ALL' || d.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      d.id.toLowerCase().includes(q) ||
      d.recipientName.toLowerCase().includes(q) ||
      d.recipientContact.toLowerCase().includes(q) ||
      d.lockerId.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const countByStatus = (st) => deliveries.filter((d) => d.status === st).length;

  return (
    <div className="space-y-5">
      {/* Thẻ thống kê nhanh */}
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
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">{countByStatus('PICKED_UP')}</div>
        </div>
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-medium ${t.mutedText}`}>Quá hạn 72 giờ</div>
          <div className="text-2xl font-extrabold text-rose-500 mt-1">{countByStatus('EXPIRED')}</div>
        </div>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <div className={`${t.card} p-4 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-3`}>
        <div className="relative flex-1 max-w-md">
          <Search
            className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`}
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, tên người nhận, mã tủ..."
            aria-label="Tìm kiếm đơn hàng"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active ? t.navActive : `${t.subtleBtn}`
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onGoToS7}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${t.primaryBtn}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Gửi đơn mới
          </button>
        </div>
      </div>

      {/* Danh sách đơn hàng */}
      {filtered.length === 0 ? (
        <div className={`${t.card} p-8 text-center text-sm ${t.mutedText}`}>
          Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const statusStyle =
              d.status === 'READY'
                ? { badge: t.badgeReady, label: 'Chờ nhận', Icon: Clock }
                : d.status === 'PICKED_UP'
                ? { badge: t.badgeSuccess, label: 'Đã nhận', Icon: CheckCircle2 }
                : { badge: t.badgeError, label: 'Quá hạn 72h', Icon: AlertTriangle };

            const StatusIcon = statusStyle.Icon;

            return (
              <div
                key={d.id}
                className={`${t.card} ${t.cardHover} p-4 @2xl:p-5 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4 transition-colors`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono-code font-bold text-sm ${t.heading}`}>{d.id}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.badge}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      {statusStyle.label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                      {d.lockerId} · Ngăn #{d.compartmentNumber} · Cỡ {getSizeLabel(d.packageSize)}
                    </span>
                  </div>

                  <div className={`text-sm font-semibold ${t.bodyText} flex items-center gap-1.5`}>
                    <User className={`w-4 h-4 ${t.mutedText}`} aria-hidden="true" />
                    {d.recipientName}
                    <span className={`text-xs font-normal ${t.mutedText}`}>({d.recipientContact})</span>
                  </div>

                  <div className={`text-xs ${t.mutedText} flex flex-wrap items-center gap-3`}>
                    <span className="inline-flex items-center gap-1">
                      <Box className="w-3.5 h-3.5" aria-hidden="true" />
                      Gửi lúc: {d.createdAt}
                    </span>
                    <span>•</span>
                    <span>{d.storageRemaining}</span>
                  </div>
                </div>

                {d.status === 'READY' && (
                  <button
                    type="button"
                    onClick={() => onGoToS6(d.id)}
                    className={`min-h-[44px] px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${t.softActionBtn}`}
                  >
                    <KeyRound className="w-4 h-4" aria-hidden="true" />
                    Thử mở bằng OTP (S6)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
