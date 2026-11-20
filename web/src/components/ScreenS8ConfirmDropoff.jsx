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
  KeyRound,
  Mail,
  MessageSquare,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S8 — Xác nhận mở cửa & bỏ hàng vào ngăn (dành cho Shipper)
 */
export default function ScreenS8ConfirmDropoff({
  theme: t,
  pendingDropoff,
  onConfirmDoorClosed,
  onCancelDropoff,
  onGoToS6,
  onGoToS7,
  onGoToS9,
}) {
  const [stage, setStage] = useState('WAITING_OPEN');
  const [countdown, setCountdown] = useState(10);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    setStage('WAITING_OPEN');
    setCountdown(10);
    setCompletedOrder(null);
  }, [pendingDropoff?.correlationId]);

  useEffect(() => {
    if (!pendingDropoff || stage !== 'WAITING_OPEN') return undefined;
    if (countdown <= 0) {
      setStage('TIMEOUT');
      return undefined;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [pendingDropoff, stage, countdown]);

  if (!pendingDropoff && !completedOrder) {
    return (
      <div className={`${t.card} p-8 text-center max-w-xl mx-auto space-y-4`}>
        <Box className={`w-12 h-12 ${t.accentText} mx-auto`} aria-hidden="true" />
        <div>
          <h2 className={`text-lg font-bold ${t.heading}`}>Chưa có ngăn nào đang chờ bỏ hàng</h2>
          <p className={`text-sm ${t.mutedText} mt-1`}>
            Hãy quay lại màn hình <strong>S7 (Chọn tủ &amp; Gửi hàng)</strong> để chọn tủ và kích cỡ hàng trước.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToS7}
          className={`min-h-[44px] px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${t.blueBtn}`}
        >
          Sang màn hình S7 để tạo đơn
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const info = completedOrder || pendingDropoff;

  const handleDoorClosed = () => {
    const created = onConfirmDoorClosed();
    setCompletedOrder(created);
    setStage('COMPLETED');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className={`${t.card} p-4 @2xl:p-6`}>
        <div className={`flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-4 pb-5 border-b ${t.divider}`}>
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border max-w-full truncate ${t.pill}`}>
              <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">MQTT: <span className="font-mono-code">{info.correlationId}</span></span>
            </span>
            <h2 className={`text-xl font-bold ${t.heading} mt-2`}>
              {info.lockerId} — {info.lockerName}
            </h2>
            <p className={`text-sm ${t.mutedText} mt-0.5`}>
              Người nhận: <strong className={t.bodyText}>{info.recipientName}</strong> ({info.recipientContact})
            </p>
          </div>
          <div className={`${t.compHighlight} px-5 py-3 text-center shrink-0`}>
            <div className={`text-xs font-semibold ${t.compHighlightLabel || t.heading}`}>Ngăn được cấp</div>
            <div className={`text-4xl font-extrabold font-mono-code leading-tight ${t.compHighlightNum}`}>
              #{info.compartmentNumber}
            </div>
            <div className={`text-xs font-bold ${t.compHighlightSub}`}>
              Cỡ {getSizeLabel(info.packageSize)}
            </div>
          </div>
        </div>

        {/* Tiến trình 3 bước */}
        <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3 py-5">
          <div className={`p-3.5 rounded-xl border ${t.alertSuccess}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              1. Gửi lệnh mở
            </div>
            <p className="text-xs mt-1 font-mono-code opacity-90">
              locker/{info.lockerId}/cmd/open
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              stage === 'DOOR_OPENED' || stage === 'COMPLETED'
                ? t.alertSuccess
                : stage === 'TIMEOUT'
                ? t.alertError
                : t.alertInfo
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {stage === 'DOOR_OPENED' || stage === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ) : stage === 'TIMEOUT' ? (
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Clock className="w-4 h-4" aria-hidden="true" />
              )}
              2. Cảm biến mở cửa
            </div>
            <p className="text-xs mt-1 opacity-90">
              {stage === 'WAITING_OPEN'
                ? `Đang chờ door_opened (${countdown}s)...`
                : stage === 'TIMEOUT'
                ? 'Quá 10 giây không mở!'
                : 'Đã nhận door_opened'}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              stage === 'COMPLETED'
                ? t.alertSuccess
                : stage === 'DOOR_OPENED'
                ? t.alertWarn
                : `${t.subCard} ${t.mutedText}`
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {stage === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <DoorClosed className="w-4 h-4" aria-hidden="true" />
              )}
              3. Đóng cửa &amp; Sinh OTP
            </div>
            <p className="text-xs mt-1 opacity-90">
              {stage === 'COMPLETED'
                ? 'Đơn READY · Đã gửi OTP'
                : stage === 'DOOR_OPENED'
                ? 'Hãy bỏ hàng và đóng cửa'
                : 'Đang chờ bước 2'}
            </p>
          </div>
        </div>

        {stage === 'WAITING_OPEN' && (
          <div className={`p-4 rounded-xl border space-y-3 ${t.alertInfo}`}>
            <div className="text-sm font-semibold">
              Đang chờ tủ ESP32 (Wokwi) phản hồi <code className="font-mono-code">door_opened</code>... ({countdown}s)
            </div>
            <p className="text-xs opacity-90">
              Trong bản prototype này, bạn có thể bấm nút bên dưới để mô phỏng tín hiệu cảm biến từ tủ khóa:
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStage('DOOR_OPENED')}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${t.blueBtn}`}
              >
                <DoorOpen className="w-4 h-4" aria-hidden="true" />
                Mô phỏng tủ báo: Cửa đã mở (door_opened)
              </button>
              <button
                type="button"
                onClick={() => setStage('TIMEOUT')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-400/60 text-rose-600 dark:text-rose-300 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Giả lập quá 10s cửa không mở
              </button>
            </div>
          </div>
        )}

        {stage === 'DOOR_OPENED' && (
          <div className={`p-5 rounded-xl border-2 space-y-3 ${t.alertWarn}`}>
            <div className="flex items-center gap-2 font-bold">
              <DoorOpen className="w-5 h-5" aria-hidden="true" />
              Ngăn #{info.compartmentNumber} đã mở! Mời bạn đặt gói hàng vào và đóng cửa.
            </div>
            <p className="text-xs opacity-90">
              Ngay khi cảm biến báo cửa đã đóng (<code className="font-mono-code">door_closed</code>), đơn chuyển sang <strong>Chờ nhận</strong> và tự gửi OTP cho người nhận.
            </p>
            <button
              type="button"
              onClick={handleDoorClosed}
              className={`min-h-[48px] px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${t.primaryBtn}`}
            >
              <DoorClosed className="w-4 h-4" aria-hidden="true" />
              Mô phỏng cảm biến: Đã bỏ hàng &amp; đóng cửa (door_closed)
            </button>
          </div>
        )}

        {stage === 'TIMEOUT' && (
          <div className={`p-5 rounded-xl border-2 space-y-3 ${t.alertError}`}>
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Lỗi kết nối tủ: Quá 10 giây không nhận được tín hiệu cửa mở
            </div>
            <p className="text-xs opacity-90">
              Hệ thống đã ghi nhận sự cố vào nhật ký và <strong>không đổi trạng thái đơn hàng</strong>. Ngăn #{info.compartmentNumber} đã được trả về Trống.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setCountdown(10);
                  setStage('WAITING_OPEN');
                }}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${t.blueBtn}`}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Thử gửi lại lệnh mở
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelDropoff();
                  onGoToS7();
                }}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold cursor-pointer ${t.subtleBtn}`}
              >
                Quay về S7 chọn tủ khác
              </button>
            </div>
          </div>
        )}

        {stage === 'COMPLETED' && completedOrder && (
          <div className={`p-5 rounded-xl border-2 space-y-4 ${t.alertSuccess}`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold">
                  Gửi hàng thành công! Đơn {completedOrder.id} đã sẵn sàng chờ nhận.
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  Mã OTP (hiệu lực 24h) đã gửi qua Web/App, Gmail ({completedOrder.recipientContact}) và SMS ({completedOrder.recipientPhone}). Thời hạn lưu hàng: 72 giờ.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono-code font-bold ${t.badgeReady}`}>
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                    OTP Demo: {completedOrder.otpCode}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${t.badgeSuccess}`}>
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Gmail OK
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${t.badgeSuccess}`}>
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> SMS OK
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onGoToS6(completedOrder.id)}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${t.primaryBtn}`}
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                Sang S6 thử nhập OTP lấy đơn này
              </button>
              <button
                type="button"
                onClick={onGoToS9}
                className={`min-h-[44px] px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${t.secondaryBtn}`}
              >
                <History className="w-4 h-4" aria-hidden="true" />
                Xem trong Lịch sử (S9)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
