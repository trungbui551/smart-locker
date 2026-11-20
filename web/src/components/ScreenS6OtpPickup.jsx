import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  DoorClosed,
  DoorOpen,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Unlock,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S6 — Chi tiết đơn & Mở ngăn bằng mã OTP (dành cho Người nhận)
 */
export default function ScreenS6OtpPickup({
  theme: t,
  deliveries,
  selectedDeliveryId,
  onSelectDelivery,
  onVerifyOtp,
  onResendOtp,
  onSimulateExpire,
  onCompletePickup,
}) {
  const readyDeliveries = deliveries.filter((d) => d.status === 'READY' || d.status === 'EXPIRED');
  const activeDelivery =
    deliveries.find((d) => d.id === selectedDeliveryId) || readyDeliveries[0] || deliveries[0];

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(true);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [doorStage, setDoorStage] = useState('IDLE');
  const inputRefs = useRef([]);

  if (!activeDelivery) {
    return (
      <div className={`${t.card} p-8 text-center`}>
        <Box className={`w-10 h-10 ${t.accentText} mx-auto mb-3`} aria-hidden="true" />
        <h2 className={`text-lg font-bold ${t.heading}`}>Chưa có đơn hàng nào</h2>
        <p className={`text-sm ${t.mutedText} mt-1`}>
          Hãy thử tạo một đơn gửi hàng ở màn hình Shipper (S7) để trải nghiệm luồng nhận hàng.
        </p>
      </div>
    );
  }

  const handleChangeOrder = (id) => {
    onSelectDelivery(id);
    setDigits(['', '', '', '', '', '']);
    setFeedback(null);
    setDoorStage('IDLE');
  };

  const handleDigitChange = (index, rawValue) => {
    const clean = rawValue.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      pasted.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFillDemoOtp = () => {
    if (!activeDelivery.otpCode || activeDelivery.otpCode.includes('-')) return;
    setDigits(activeDelivery.otpCode.split(''));
    setFeedback(null);
  };

  const handleCopyOtp = () => {
    if (!activeDelivery.otpCode) return;
    navigator.clipboard?.writeText(activeDelivery.otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSubmitOtp = (e) => {
    e.preventDefault();
    const entered = digits.join('');
    if (entered.length < 6) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đủ 6 chữ số của mã OTP.' });
      return;
    }

    const result = onVerifyOtp(activeDelivery.id, entered);
    if (!result.ok) {
      setFeedback({ type: 'error', message: result.message });
      return;
    }

    setFeedback({
      type: 'info',
      message: `Mã OTP hợp lệ! Đang gửi lệnh mở tới tủ ${activeDelivery.lockerId}, ngăn số ${activeDelivery.compartmentNumber}...`,
    });
    setDoorStage('SENDING');

    setTimeout(() => {
      setDoorStage('OPENED');
      setFeedback({
        type: 'success',
        message: `Ngăn số ${activeDelivery.compartmentNumber} đã mở khóa (door_opened). Vui lòng lấy hàng và đóng cửa ngăn.`,
      });
    }, 850);
  };

  const handleResend = () => {
    const newCode = onResendOtp(activeDelivery.id);
    setDigits(['', '', '', '', '', '']);
    setDoorStage('IDLE');
    setFeedback({
      type: 'info',
      message: `Đã cấp mã OTP mới (${newCode}) và gửi đồng thời qua Web/App, Gmail và SMS.`,
    });
  };

  const handleSimulateDoorClose = () => {
    onCompletePickup(activeDelivery.id);
    setDoorStage('COMPLETED');
    setFeedback({
      type: 'success',
      message: `Cảm biến xác nhận cửa đã đóng (door_closed). Đơn ${activeDelivery.id} hoàn tất và ngăn số ${activeDelivery.compartmentNumber} đã chuyển về Trống.`,
    });
  };

  const isDisabledInput =
    activeDelivery.status === 'PICKED_UP' ||
    activeDelivery.locked ||
    activeDelivery.otpExpired ||
    doorStage === 'SENDING' ||
    doorStage === 'OPENED' ||
    doorStage === 'COMPLETED';

  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      {/* Cột trái: Thông tin đơn hàng & mã OTP đa kênh */}
      <div className="@4xl:col-span-5 space-y-4">
        <div className={`${t.card} p-4`}>
          <label
            htmlFor="order-selector"
            className={`block text-xs font-semibold uppercase tracking-wide ${t.mutedText} mb-2`}
          >
            Chọn đơn hàng để kiểm thử (S6)
          </label>
          <select
            id="order-selector"
            value={activeDelivery.id}
            onChange={(e) => handleChangeOrder(e.target.value)}
            className={`w-full min-h-[44px] px-3 py-2 text-sm font-medium cursor-pointer focus:outline-none ${t.input}`}
          >
            {deliveries.map((d) => (
              <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                {d.id} · {d.lockerId} Ngăn {d.compartmentNumber} (
                {d.status === 'READY' ? 'Chờ nhận' : d.status === 'PICKED_UP' ? 'Đã nhận' : 'Quá hạn 72h'})
              </option>
            ))}
          </select>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${t.pill}`}>
                <Box className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-mono-code">{activeDelivery.id}</span>
              </div>
              <h2 className={`text-lg font-bold ${t.heading} mt-2`}>{activeDelivery.lockerName}</h2>
              <p className={`text-xs ${t.mutedText} flex items-center gap-1.5 mt-1`}>
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${t.accentText}`} aria-hidden="true" />
                {activeDelivery.lockerLocation}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-xs ${t.mutedText}`}>Ngăn số</div>
              <div className={`text-3xl font-extrabold font-mono-code leading-none mt-1 ${t.compHighlightNum}`}>
                #{activeDelivery.compartmentNumber}
              </div>
              <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                Cỡ {getSizeLabel(activeDelivery.packageSize)}
              </span>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${t.divider}`}>
            <div className={`${t.subCard} p-3`}>
              <div className={`text-xs ${t.mutedText} flex items-center gap-1`}>
                <Clock className={`w-3.5 h-3.5 ${t.accentText}`} aria-hidden="true" />
                Hạn lưu hàng (72h)
              </div>
              <div className={`text-sm font-bold ${t.bodyText} mt-1`}>{activeDelivery.storageRemaining}</div>
            </div>
            <div className={`${t.subCard} p-3`}>
              <div className={`text-xs ${t.mutedText} flex items-center gap-1`}>
                <KeyRound className="w-3.5 h-3.5 text-[#EA580C]" aria-hidden="true" />
                Hạn mã OTP (24h)
              </div>
              <div className={`text-sm font-bold ${t.bodyText} mt-1`}>
                {activeDelivery.otpExpired ? 'Đã hết hạn' : activeDelivery.otpRemaining}
              </div>
            </div>
          </div>

          <div className={`${t.otpContainer} p-4 space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-bold ${t.otpHeading || t.heading}`}>Mã OTP của bạn (dùng 1 lần)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOtp((v) => !v)}
                  aria-label={showOtp ? 'Ẩn mã OTP' : 'Hiện mã OTP'}
                  className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${t.subtleBtn}`}
                >
                  {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  aria-label="Sao chép mã OTP"
                  className={`min-h-[36px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${t.subtleBtn}`}
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
            </div>

            <div className={`text-center py-2.5 ${t.otpDisplayBox}`}>
              <span className="font-mono-code text-2xl @2xl:text-3xl font-bold tracking-[0.2em] @2xl:tracking-[0.28em]">
                {showOtp ? activeDelivery.otpCode : '••••••'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${t.badgeSuccess}`}>
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                Web/App
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${t.badgeSuccess}`}>
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                Gmail đã gửi
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${
                  activeDelivery.channels.sms ? t.badgeSuccess : t.badgeWarn
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                {activeDelivery.channels.sms ? 'SMS đã gửi' : 'SMS dự phòng'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Ô nhập OTP mở ngăn */}
      <div className={`@4xl:col-span-7 ${t.card} p-4 @2xl:p-6 space-y-5`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 pb-4 border-b ${t.divider}`}>
          <div>
            <h3 className={`text-lg font-bold ${t.heading}`}>Nhập mã OTP để mở ngăn tủ</h3>
            <p className={`text-sm ${t.mutedText} mt-0.5`}>
              Đứng trước <strong>{activeDelivery.lockerId}</strong> và nhập mã gồm 6 chữ số.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              activeDelivery.status === 'PICKED_UP'
                ? t.badgeSuccess
                : activeDelivery.locked
                ? t.badgeError
                : activeDelivery.otpExpired
                ? t.badgeWarn
                : t.badgeReady
            }`}
          >
            {activeDelivery.status === 'PICKED_UP'
              ? 'Đã nhận hàng'
              : activeDelivery.locked
              ? 'Đơn tạm khóa (sai 3/3)'
              : activeDelivery.otpExpired
              ? 'OTP hết hạn 24h'
              : `Sai ${activeDelivery.failedAttempts}/3 lần`}
          </span>
        </div>

        {(activeDelivery.locked || activeDelivery.otpExpired) && activeDelivery.status !== 'PICKED_UP' && (
          <div className={`p-4 rounded-xl border flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3 ${t.alertWarn}`}>
            <div className="flex items-start gap-2.5 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-bold">
                  {activeDelivery.locked
                    ? 'Đơn hàng đang tạm khóa do nhập sai OTP quá 3 lần'
                    : 'Mã OTP hiện tại đã hết hạn 24 giờ'}
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  Bạn có thể bấm cấp lại mã mới ngay hoặc liên hệ Nhân viên vận hành hỗ trợ.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${t.blueBtn}`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Xin cấp lại mã mới
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitOtp} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${t.bodyText}`}>Mã OTP 6 chữ số</span>
            {!isDisabledInput && (
              <button
                type="button"
                onClick={handleFillDemoOtp}
                className={`text-xs font-semibold hover:underline cursor-pointer ${t.accentText}`}
              >
                Điền nhanh mã đúng ({activeDelivery.otpCode})
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5 @2xl:gap-3" role="group" aria-label="Nhập 6 chữ số mã OTP">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={isDisabledInput}
                value={digit}
                aria-label={`Chữ số OTP thứ ${index + 1}`}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-12 @2xl:h-16 w-full text-center font-mono-code text-xl @2xl:text-2xl font-bold focus:outline-none disabled:opacity-45 disabled:cursor-not-allowed transition-all ${t.otpInput}`}
              />
            ))}
          </div>

          <div className="flex flex-col @2xl:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={isDisabledInput}
              className={`flex-1 min-h-[48px] px-5 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer ${t.primaryBtn}`}
            >
              <Unlock className="w-4 h-4" aria-hidden="true" />
              {doorStage === 'SENDING' ? 'Đang gửi lệnh mở ngăn...' : 'Mở ngăn tủ ngay'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={activeDelivery.status === 'PICKED_UP'}
              className={`min-h-[48px] px-4 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer ${t.secondaryBtn}`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Cấp lại mã
            </button>
          </div>
        </form>

        {activeDelivery.status === 'READY' && doorStage === 'IDLE' && (
          <div className={`pt-3 border-t ${t.divider} flex flex-wrap items-center justify-between gap-2 text-xs ${t.mutedText}`}>
            <span>Kiểm thử tình huống biên:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDigits(['0', '0', '0', '0', '0', '0']);
                  setFeedback(null);
                }}
                className={`px-2.5 py-1.5 font-medium cursor-pointer ${t.subtleBtn}`}
              >
                Điền mã sai (000000)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSimulateExpire(activeDelivery.id);
                  setFeedback({
                    type: 'error',
                    message: 'Đã mô phỏng mã OTP quá hạn 24 giờ. Hãy bấm "Xin cấp lại mã mới".',
                  });
                }}
                className={`px-2.5 py-1.5 font-medium cursor-pointer ${t.subtleBtn}`}
              >
                Giả lập OTP hết hạn 24h
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
              feedback.type === 'error'
                ? t.alertError
                : feedback.type === 'success'
                ? t.alertSuccess
                : t.alertInfo
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <Lock className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {doorStage === 'OPENED' && (
          <div className={`p-5 rounded-xl border-2 space-y-3 ${t.alertSuccess}`}>
            <div className="flex items-center gap-2.5 font-bold">
              <DoorOpen className="w-5 h-5" aria-hidden="true" />
              Cửa ngăn #{activeDelivery.compartmentNumber} đang mở — Hãy lấy hàng ra
            </div>
            <p className="text-xs opacity-90">
              Đang chờ sự kiện <code className="font-mono-code font-semibold">door_closed</code> từ tủ ESP32 trên Wokwi để hoàn tất đơn và trả ngăn về Trống.
            </p>
            <button
              type="button"
              onClick={handleSimulateDoorClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <DoorClosed className="w-4 h-4" aria-hidden="true" />
              Mô phỏng cảm biến: Tôi đã đóng cửa ngăn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
