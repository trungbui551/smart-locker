import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Unlock,
  Wrench,
} from 'lucide-react';
import { operatorApi } from '../api/client';
import { getSizeLabel } from '../data/mockData';

function formatTime(iso) {
  if (!iso) return 'Chưa có nhịp sống';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Màn hình S11 — Sơ đồ Tủ & Ngăn trực quan (nối API thật: mở ngăn thủ công qua MQTT Wokwi & đổi trạng thái FAULT/FREE)
 */
export default function ScreenS11LockerMap({
  theme: t,
  lockers,
  deliveries,
  initialLockerId,
  loading,
  onRefresh,
}) {
  const [selectedLockerId, setSelectedLockerId] = useState(initialLockerId || lockers[0]?.id || '');
  const [selectedCompNum, setSelectedCompNum] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const locker = lockers.find((l) => l.id === selectedLockerId) || lockers[0];
  const comp = locker?.compartments?.find((c) => c.number === selectedCompNum);
  const linkedOrder = comp
    ? deliveries.find(
        (d) =>
          d.lockerId === locker.id &&
          d.compartmentNumber === comp.number &&
          (d.status === 'READY' || d.status === 'STORING' || d.status === 'EXPIRED')
      )
    : null;

  const handleManualOpenSubmit = async (e) => {
    e.preventDefault();
    if (!locker || !comp) return;
    if (!reason.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập lý do mở ngăn thủ công để ghi vào nhật ký thao tác.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const cmd = await operatorApi.manualOpen(locker.id, comp.number, reason.trim());
      setFeedback({
        type: 'success',
        text: `Đã gửi lệnh mở thủ công ${locker.id} · Ngăn #${comp.number} tới tủ Wokwi (mã lệnh: ${cmd.correlationId.slice(0, 8)}...) và ghi Nhật ký (S13).`,
      });
      setReason('');
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFault = async () => {
    if (!locker || !comp) return;
    const nextStatus = comp.status === 'FAULT' ? 'FREE' : 'FAULT';
    setSubmitting(true);
    setFeedback(null);
    try {
      await operatorApi.updateCompartmentStatus(locker.id, comp.number, nextStatus);
      setFeedback({
        type: 'success',
        text: `Đã cập nhật ${locker.id} · Ngăn #${comp.number} sang ${nextStatus} và ghi Nhật ký (S13).`,
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!locker) {
    return (
      <div className={`${t.card} p-8 text-center text-sm ${t.mutedText}`}>
        Chưa có dữ liệu tủ khóa từ Backend. Hãy bấm Làm mới hoặc kiểm tra kết nối.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Thanh chọn tủ */}
      <div className={`${t.card} p-4 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex flex-wrap gap-2">
          {lockers.map((l) => {
            const active = l.id === locker.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSelectedLockerId(l.id);
                  setSelectedCompNum(null);
                  setFeedback(null);
                }}
                className={`min-h-[42px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer ${
                  active ? t.primaryBtn : t.secondaryBtn
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    l.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span>
                  {l.id} ({(l.compartments || []).length} ngăn)
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.subtleBtn}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Làm mới từ Backend
        </button>
      </div>

      {/* Sơ đồ ngăn + Khung thao tác */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
        <div className={`@4xl:col-span-7 ${t.card} p-5 space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className={`text-lg font-bold ${t.heading}`}>{locker.name}</h2>
              <p className={`text-xs ${t.mutedText}`}>
                {locker.location} · Nhịp cuối: {formatTime(locker.lastHeartbeatAt)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                locker.status === 'ONLINE' ? t.badgeSuccess : t.badgeError
              }`}
            >
              {locker.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600" /> Trống (FREE)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#172554]" /> Đang chứa (OCCUPIED)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600" /> Lỗi cửa (FAULT)
            </span>
          </div>

          {/* Lưới ngăn 3D */}
          <div className="grid grid-cols-2 @2xl:grid-cols-3 gap-3">
            {(locker.compartments || []).map((c) => {
              const isSelected = selectedCompNum === c.number;
              const styleClass =
                c.status === 'FREE'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[0_4px_0_#059669]'
                  : c.status === 'OCCUPIED'
                  ? 'bg-[#172554] border-[#0B1120] text-white shadow-[0_4px_0_#0B1120]'
                  : 'bg-rose-600 border-rose-900 text-white shadow-[0_4px_0_#9F1239]';

              return (
                <button
                  key={c.number}
                  type="button"
                  onClick={() => {
                    setSelectedCompNum(c.number);
                    setFeedback(null);
                  }}
                  className={`btn-3d p-3.5 rounded-2xl border-2 text-left cursor-pointer ${styleClass} ${
                    isSelected ? 'ring-3 ring-[#EA580C] ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code font-extrabold text-base">#{c.number}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/15">
                      {getSizeLabel(c.size)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-2">
                    {c.status === 'FREE'
                      ? 'Trống'
                      : c.status === 'OCCUPIED'
                      ? 'Đang chứa hàng'
                      : 'Lỗi cảm biến'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung thao tác chi tiết ngăn */}
        <div className={`@4xl:col-span-5 ${t.card} p-5 space-y-4`}>
          <h3 className={`text-base font-bold ${t.heading}`}>Thao tác ngăn đang chọn</h3>

          {!comp ? (
            <div className={`${t.subCard} p-6 text-center text-xs ${t.mutedText}`}>
              Hãy bấm vào một ô ngăn bất kỳ trên sơ đồ để xem chi tiết, gửi lệnh mở thủ công tới Wokwi hoặc xử lý lỗi.
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${t.otpContainer} p-4 flex items-center justify-between`}>
                <div>
                  <div className="text-xs text-blue-200">
                    {locker.id} · Cỡ {getSizeLabel(comp.size)}
                  </div>
                  <div className="text-xl font-extrabold font-mono-code text-[#FDBA74]">
                    Ngăn số #{comp.number}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    comp.status === 'FREE'
                      ? t.badgeSuccess
                      : comp.status === 'OCCUPIED'
                      ? t.badgeWarn
                      : t.badgeError
                  }`}
                >
                  {comp.status}
                </span>
              </div>

              {linkedOrder && (
                <div className={`${t.subCard} p-3.5 text-xs space-y-1`}>
                  <div className={`font-bold ${t.heading}`}>
                    Đơn hàng đang chứa: #{linkedOrder.id} ({linkedOrder.status})
                  </div>
                  <div className={t.bodyText}>
                    Người nhận: {linkedOrder.recipientName} ({linkedOrder.recipientUsername})
                  </div>
                  <div className={t.mutedText}>
                    Shipper: {linkedOrder.courierName}
                  </div>
                </div>
              )}

              <form onSubmit={handleManualOpenSubmit} className="space-y-3">
                <div>
                  <label htmlFor="manual-reason" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                    Lý do mở ngăn thủ công (bắt buộc ghi nhật ký) *
                  </label>
                  <input
                    id="manual-reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="VD: Hỗ trợ khách kẹt cửa / Thu hồi hàng quá hạn"
                    className={`w-full min-h-[44px] px-3.5 py-2 text-sm focus:outline-none ${t.input}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || locker.status !== 'ONLINE'}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer ${t.primaryBtn}`}
                >
                  <Unlock className="w-4 h-4" aria-hidden="true" />
                  {locker.status !== 'ONLINE'
                    ? 'Tủ đang Offline — không thể mở'
                    : submitting
                    ? 'Đang gửi lệnh MQTT...'
                    : 'Mở ngăn thủ công (gửi MQTT thật)'}
                </button>
              </form>

              <button
                type="button"
                disabled={submitting}
                onClick={handleToggleFault}
                className={`w-full min-h-[44px] px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${t.secondaryBtn}`}
              >
                {comp.status === 'FAULT' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    Khôi phục ngăn về Trống (FREE)
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 text-rose-700" aria-hidden="true" />
                    Đánh dấu ngăn bị Lỗi (FAULT)
                  </>
                )}
              </button>

              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                    feedback.type === 'error' ? t.alertError : t.alertSuccess
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{feedback.text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
