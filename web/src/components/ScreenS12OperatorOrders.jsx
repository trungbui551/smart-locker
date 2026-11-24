import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S12 — Quản lý đơn hàng & Hỗ trợ sự cố (Nhân viên vận hành & Admin)
 */
export default function ScreenS12OperatorOrders({
  theme: t,
  deliveries,
  onOperatorResetOtp,
  onOperatorReleaseExpired,
}) {
  const [filter, setFilter] = useState('ALL');
  const [notice, setNotice] = useState('');

  const filtered = deliveries.filter((d) => {
    if (filter === 'ALL') return true;
    if (filter === 'LOCKED') return d.locked && d.status === 'READY';
    return d.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className={`${t.card} p-4 flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: `Tất cả (${deliveries.length})` },
            { key: 'LOCKED', label: `Bị khóa OTP (${deliveries.filter((d) => d.locked && d.status === 'READY').length})` },
            { key: 'EXPIRED', label: `Quá hạn 72h (${deliveries.filter((d) => d.status === 'EXPIRED').length})` },
            { key: 'READY', label: 'Chờ nhận' },
            { key: 'PICKED_UP', label: 'Đã nhận' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                filter === tab.key ? t.primaryBtn : t.secondaryBtn
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium ${t.alertSuccess}`}>
          {notice}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((d) => (
          <div
            key={d.id}
            className={`${t.card} p-4 @2xl:p-5 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono-code font-bold text-sm ${t.heading}`}>{d.id}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                  {d.lockerId} · Ngăn #{d.compartmentNumber} · Cỡ {getSizeLabel(d.packageSize)}
                </span>
                {d.locked && d.status === 'READY' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeError}`}>
                    <Lock className="w-3 h-3" aria-hidden="true" /> Khóa OTP (3/3)
                  </span>
                )}
                {d.status === 'EXPIRED' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeWarn}`}>
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Quá hạn 72h
                  </span>
                )}
                {d.status === 'PICKED_UP' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeSuccess}`}>
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Hoàn tất
                  </span>
                )}
              </div>

              <div className={`text-sm font-semibold ${t.bodyText}`}>
                Người nhận: {d.recipientName} ({d.recipientPhone}) · Shipper: {d.courierName}
              </div>
              <div className={`text-xs ${t.mutedText} flex items-center gap-2`}>
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {d.createdAt} · {d.storageRemaining}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {d.status === 'READY' && (
                <button
                  type="button"
                  onClick={() => {
                    const newCode = onOperatorResetOtp(d.id);
                    setNotice(`Đã mở khóa & cấp lại OTP mới (${newCode}) cho đơn ${d.id}, đã ghi vào Nhật ký (S13).`);
                  }}
                  className={`min-h-[42px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${t.softActionBtn}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Cấp lại OTP / Mở khóa
                </button>
              )}
              {d.status === 'EXPIRED' && (
                <button
                  type="button"
                  onClick={() => {
                    onOperatorReleaseExpired(d.id);
                    setNotice(`Đã mở ngăn thu hồi hàng quá hạn cho đơn ${d.id} và trả ngăn #${d.compartmentNumber} về Trống.`);
                  }}
                  className={`min-h-[42px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
                >
                  <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                  Mở ngăn thu hồi hàng quá hạn
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
