import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { deliveryApi, operatorApi } from '../api/client';
import { getSizeLabel } from '../data/mockData';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Màn hình S12 — Quản lý đơn hàng & Hỗ trợ sự cố (dữ liệu thật từ GET /api/deliveries/my)
 * Hỗ trợ cấp lại OTP mới (POST /api/deliveries/{id}/otp/resend) và mở ngăn thu hồi hàng quá hạn 72h qua MQTT.
 */
export default function ScreenS12OperatorOrders({
  theme: t,
  deliveries,
  loading,
  onRefresh,
}) {
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const filtered = deliveries.filter((d) => {
    if (filter === 'ALL') return true;
    return d.status === filter;
  });

  const handleResetOtp = async (d) => {
    setBusyId(d.id);
    setNotice(null);
    try {
      await deliveryApi.resendOtp(d.id);
      setNotice({
        type: 'success',
        text: `Đã mở khóa & cấp lại mã OTP mới cho đơn #${d.id} (đã gửi lại qua kênh thông báo và ghi Nhật ký S13).`,
      });
      onRefresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleReleaseExpired = async (d) => {
    setBusyId(d.id);
    setNotice(null);
    try {
      await operatorApi.manualOpen(
        d.lockerId,
        d.compartmentNumber,
        `Thu hồi hàng quá hạn 72h cho đơn #${d.id}`
      );
      setNotice({
        type: 'success',
        text: `Đã gửi lệnh mở ${d.lockerId} · Ngăn #${d.compartmentNumber} tới tủ Wokwi để thu hồi hàng quá hạn (đơn #${d.id}).`,
      });
      onRefresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${t.card} p-4 flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: `Tất cả (${deliveries.length})` },
            { key: 'READY', label: `Chờ nhận (${deliveries.filter((d) => d.status === 'READY').length})` },
            { key: 'STORING', label: `Đang bỏ hàng (${deliveries.filter((d) => d.status === 'STORING').length})` },
            { key: 'EXPIRED', label: `Quá hạn 72h (${deliveries.filter((d) => d.status === 'EXPIRED').length})` },
            { key: 'PICKED_UP', label: `Đã nhận (${deliveries.filter((d) => d.status === 'PICKED_UP').length})` },
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

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.subtleBtn}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            notice.type === 'error' ? t.alertError : t.alertSuccess
          }`}
        >
          {notice.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={`${t.card} p-8 text-center text-sm ${t.mutedText}`}>
          Chưa có đơn hàng nào ở trạng thái này.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={`${t.card} p-4 @2xl:p-5 flex flex-col @3xl:flex-row @3xl:items-center justify-between gap-4`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-mono-code font-bold text-sm ${t.heading}`}>Đơn #{d.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                    {d.lockerId} · Ngăn #{d.compartmentNumber} · Cỡ {getSizeLabel(d.packageSize)}
                  </span>
                  {d.status === 'READY' && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeInfo}`}>
                      Chờ lấy hàng
                    </span>
                  )}
                  {d.status === 'STORING' && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeWarn}`}>
                      Đang bỏ hàng
                    </span>
                  )}
                  {d.status === 'EXPIRED' && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${t.badgeError}`}>
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
                  Người nhận: {d.recipientName} ({d.recipientUsername}) · Shipper: {d.courierName}
                </div>
                <div className={`text-xs ${t.mutedText} flex flex-wrap items-center gap-2`}>
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tạo lúc: {formatTime(d.createdAt)}</span>
                  <span>· Hạn lưu: {formatTime(d.expiresAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {d.status === 'READY' && (
                  <button
                    type="button"
                    disabled={busyId === d.id}
                    onClick={() => handleResetOtp(d)}
                    className={`min-h-[42px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.softActionBtn}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busyId === d.id ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Cấp lại OTP / Mở khóa
                  </button>
                )}
                {d.status === 'EXPIRED' && (
                  <button
                    type="button"
                    disabled={busyId === d.id}
                    onClick={() => handleReleaseExpired(d)}
                    className={`min-h-[42px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
                  >
                    <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                    Mở ngăn thu hồi hàng quá hạn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
