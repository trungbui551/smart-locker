import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  DoorClosed,
  DoorOpen,
  History,
  Radio,
} from 'lucide-react';
import { commandApi, deliveryApi } from '../api/client';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S8 — Theo dõi trực tiếp trạng thái mở/đóng cửa tủ Wokwi sau khi Shipper cấp ngăn (M6)
 */
export default function ScreenS8ConfirmDropoff({
  theme: t,
  pendingDelivery,
  onCompleted,
  onGoToS7,
  onGoToS9,
}) {
  const [cmdStatus, setCmdStatus] = useState('PENDING_OPEN');
  const [manualLoading, setManualLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    setCmdStatus('PENDING_OPEN');
    setErrMsg('');
  }, [pendingDelivery?.correlationId]);

  // Poll trạng thái lệnh MQTT thật từ Backend mỗi 1 giây
  useEffect(() => {
    if (!pendingDelivery?.correlationId) return undefined;
    if (cmdStatus === 'CLOSED' || cmdStatus === 'TIMED_OUT' || cmdStatus === 'FAULT') return undefined;

    const timer = setInterval(async () => {
      try {
        const res = await commandApi.getStatus(pendingDelivery.correlationId);
        setCmdStatus(res.status);
        if (res.status === 'CLOSED') {
          onCompleted();
        }
      } catch {
        // Giữ nguyên trạng thái chờ nếu mạng chập chờn
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingDelivery?.correlationId, cmdStatus, onCompleted]);

  if (!pendingDelivery) {
    return (
      <div className={`${t.card} p-8 text-center max-w-xl mx-auto space-y-4`}>
        <Box className={`w-12 h-12 ${t.accentText} mx-auto`} aria-hidden="true" />
        <div>
          <h2 className={`text-lg font-bold ${t.heading}`}>Chưa có ngăn nào đang chờ bỏ hàng</h2>
          <p className={`text-sm ${t.mutedText} mt-1`}>
            Hãy sang màn hình <strong>S7 (Chọn tủ &amp; Gửi hàng)</strong> để cấp ngăn trước.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToS7}
          className={`min-h-[44px] px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${t.blueBtn}`}
        >
          Sang S7 tạo đơn mới <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const handleFallbackMarkReady = async () => {
    setManualLoading(true);
    setErrMsg('');
    try {
      await deliveryApi.markReady(pendingDelivery.id);
      setCmdStatus('CLOSED');
      onCompleted();
    } catch (err) {
      setErrMsg(err.message);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className={`${t.card} p-4 @2xl:p-6`}>
        <div className={`flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 pb-5 border-b ${t.divider}`}>
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border max-w-full truncate ${t.pill}`}>
              <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">MQTT: <span className="font-mono-code">{pendingDelivery.correlationId}</span></span>
            </span>
            <h2 className={`text-xl font-bold ${t.heading} mt-2`}>
              Đơn #{pendingDelivery.id} · {pendingDelivery.lockerId} — {pendingDelivery.lockerName}
            </h2>
            <p className={`text-sm ${t.mutedText} mt-0.5`}>
              Người nhận: <strong className={t.bodyText}>{pendingDelivery.recipientFullName}</strong> (@{pendingDelivery.recipientUsername})
            </p>
          </div>
          <div className={`${t.compHighlight} px-5 py-3 text-center shrink-0`}>
            <div className={`text-xs font-semibold ${t.compHighlightLabel}`}>Ngăn được cấp</div>
            <div className={`text-4xl font-extrabold font-mono-code leading-tight ${t.compHighlightNum}`}>
              #{pendingDelivery.compartmentNumber}
            </div>
            <div className={`text-xs font-bold ${t.compHighlightSub}`}>
              Cỡ {getSizeLabel(pendingDelivery.packageSize)}
            </div>
          </div>
        </div>

        {/* Tiến trình 3 bước live theo MQTT */}
        <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3 py-5">
          <div className={`p-3.5 rounded-xl border ${t.alertSuccess}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              1. Đã gửi lệnh MQTT
            </div>
            <p className="text-xs mt-1 font-mono-code opacity-90">
              locker/{pendingDelivery.lockerId}/cmd/open
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              cmdStatus === 'OPENED' || cmdStatus === 'CLOSED'
                ? t.alertSuccess
                : cmdStatus === 'TIMED_OUT'
                ? t.alertError
                : t.alertInfo
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {cmdStatus === 'OPENED' || cmdStatus === 'CLOSED' ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ) : cmdStatus === 'TIMED_OUT' ? (
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Clock className="w-4 h-4" aria-hidden="true" />
              )}
              2. Cảm biến mở cửa
            </div>
            <p className="text-xs mt-1 opacity-90">
              {cmdStatus === 'PENDING_OPEN' && 'Đang chờ tủ Wokwi báo door_opened (10s)...'}
              {cmdStatus === 'OPENED' && 'Tủ đã mở khóa (LED sáng + Servo 90°)'}
              {cmdStatus === 'CLOSED' && 'Đã xác nhận mở & đóng cửa'}
              {cmdStatus === 'TIMED_OUT' && 'Quá 10 giây không nhận phản hồi'}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              cmdStatus === 'CLOSED'
                ? t.alertSuccess
                : cmdStatus === 'OPENED'
                ? t.alertWarn
                : `${t.subCard} ${t.mutedText}`
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {cmdStatus === 'CLOSED' ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <DoorClosed className="w-4 h-4" aria-hidden="true" />}
              3. Đóng cửa &amp; Gửi OTP
            </div>
            <p className="text-xs mt-1 opacity-90">
              {cmdStatus === 'CLOSED' ? 'Đơn READY · Đã gửi OTP 24h' : 'Chờ bấm nút XANH trên Wokwi'}
            </p>
          </div>
        </div>

        {cmdStatus === 'OPENED' && (
          <div className={`p-5 rounded-xl border-2 space-y-2 ${t.alertWarn}`}>
            <div className="flex items-center gap-2 font-bold">
              <DoorOpen className="w-5 h-5" aria-hidden="true" />
              Ngăn #{pendingDelivery.compartmentNumber} trên Wokwi đang mở!
            </div>
            <p className="text-xs">
              Hãy bấm nút <strong>XANH LÁ (Dong cua)</strong> trên mạch Wokwi để gửi <code className="font-mono-code">door_closed</code>, tự động chuyển đơn sang <strong>READY</strong> và phát hành OTP cho người nhận.
            </p>
          </div>
        )}

        {cmdStatus === 'TIMED_OUT' && (
          <div className={`p-5 rounded-xl border-2 space-y-3 ${t.alertError}`}>
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Quá 10 giây không nhận được door_opened từ tủ {pendingDelivery.lockerId}
            </div>
            <p className="text-xs">
              Kiểm tra xem tab Wokwi của tủ {pendingDelivery.lockerId} có đang bấm Play không. Nếu bạn đang test không cần Wokwi, có thể bấm nút xác nhận thủ công bên dưới:
            </p>
            <button
              type="button"
              disabled={manualLoading}
              onClick={handleFallbackMarkReady}
              className={`min-h-[44px] px-4 py-2 text-xs font-bold cursor-pointer ${t.blueBtn}`}
            >
              {manualLoading ? 'Đang xử lý...' : 'Xác nhận đã bỏ hàng xong (chuyển READY + sinh OTP)'}
            </button>
          </div>
        )}

        {cmdStatus === 'CLOSED' && (
          <div className={`p-5 rounded-xl border-2 space-y-3 ${t.alertSuccess}`}>
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              Gửi hàng thành công! Đơn #{pendingDelivery.id} đã chuyển READY và phát hành OTP đa kênh.
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGoToS9}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${t.primaryBtn}`}
              >
                <History className="w-4 h-4" aria-hidden="true" />
                Xem lịch sử đơn đã gửi (S9)
              </button>
              <button
                type="button"
                onClick={onGoToS7}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold cursor-pointer ${t.secondaryBtn}`}
              >
                Gửi đơn tiếp theo (S7)
              </button>
            </div>
          </div>
        )}

        {errMsg && <div className={`mt-3 p-3 rounded-xl border text-xs ${t.alertError}`}>{errMsg}</div>}
      </div>
    </div>
  );
}
