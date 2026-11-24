import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  DoorOpen,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { commandApi, deliveryApi } from '../api/client';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S6 — Chi tiết đơn & Mở ngăn bằng mã OTP (nối API thật + polling lệnh MQTT Wokwi)
 */
export default function ScreenS6OtpPickup({
  theme: t,
  deliveries,
  selectedDeliveryId,
  onSelectDelivery,
  onRefreshDeliveries,
}) {
  const activeDelivery =
    deliveries.find((d) => d.id === selectedDeliveryId) ||
    deliveries.find((d) => d.status === 'READY') ||
    deliveries[0];

  const [otpInfo, setOtpInfo] = useState(null);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [activeCorrId, setActiveCorrId] = useState(null);
  const [cmdStatus, setCmdStatus] = useState(null);
  const inputRefs = useRef([]);

  // Tải trạng thái & mã OTP thật từ Backend cho đơn đang chọn
  const loadOtp = async (deliveryId) => {
    if (!deliveryId) return;
    try {
      const info = await deliveryApi.getOtp(deliveryId);
      setOtpInfo(info);
    } catch {
      setOtpInfo(null);
    }
  };

  useEffect(() => {
    setDigits(['', '', '', '', '', '']);
    setFeedback(null);
    setActiveCorrId(null);
    setCmdStatus(null);
    if (activeDelivery && activeDelivery.status === 'READY') {
      loadOtp(activeDelivery.id);
    } else {
      setOtpInfo(null);
    }
  }, [activeDelivery?.id, activeDelivery?.status]);

  // Theo dõi trạng thái lệnh mở cửa thật từ Wokwi (PENDING_OPEN -> OPENED -> CLOSED / TIMED_OUT)
  useEffect(() => {
    if (!activeCorrId) return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await commandApi.getStatus(activeCorrId);
        setCmdStatus(res.status);
        if (res.status === 'OPENED') {
          setFeedback({
            type: 'success',
            message: `Tủ ${res.lockerId} ngăn #${res.compartmentNumber} đã mở khóa (door_opened)! Hãy lấy hàng và bấm nút XANH đóng cửa trên Wokwi.`,
          });
        } else if (res.status === 'CLOSED') {
          setFeedback({
            type: 'success',
            message: `Cảm biến xác nhận cửa đã đóng (door_closed). Đơn #${activeDelivery.id} đã hoàn tất!`,
          });
          setActiveCorrId(null);
          onRefreshDeliveries();
        } else if (res.status === 'TIMED_OUT') {
          setFeedback({
            type: 'error',
            message: 'Quá 10 giây không nhận được tín hiệu cửa mở từ tủ. Vui lòng kiểm tra tủ Wokwi đang chạy.',
          });
          setActiveCorrId(null);
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời trong lúc poll
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCorrId, activeDelivery?.id, onRefreshDeliveries]);

  if (!activeDelivery) {
    return (
      <div className={`${t.card} p-8 text-center`}>
        <Box className={`w-10 h-10 ${t.accentText} mx-auto mb-3`} aria-hidden="true" />
        <h2 className={`text-lg font-bold ${t.heading}`}>Bạn chưa có đơn hàng nào</h2>
        <p className={`text-sm ${t.mutedText} mt-1`}>
          Hãy đăng nhập Shipper tạo đơn gửi hàng vào tủ để kiểm thử nhận hàng bằng OTP.
        </p>
      </div>
    );
  }

  const handleDigitChange = (index, rawValue) => {
    const clean = rawValue.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    if (clean.length > 1) {
      const next = ['', '', '', '', '', ''];
      clean.slice(0, 6).split('').forEach((ch, idx) => { next[idx] = ch; });
      setDigits(next);
      inputRefs.current[Math.min(clean.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập đủ 6 chữ số của mã OTP.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await deliveryApi.verifyOtp(activeDelivery.id, code);
      setActiveCorrId(res.correlationId);
      setCmdStatus('PENDING_OPEN');
      setFeedback({
        type: 'info',
        message: `${res.message} Đang chờ cảm biến tủ Wokwi báo door_opened (tối đa 10 giây)...`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
      loadOtp(activeDelivery.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const info = await deliveryApi.resendOtp(activeDelivery.id);
      setOtpInfo(info);
      setDigits(['', '', '', '', '', '']);
      setFeedback({
        type: 'info',
        message: 'Đã cấp lại mã OTP mới (hiệu lực 24 giờ) và gửi qua Web/App, Gmail & SMS.',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled =
    submitting ||
    activeDelivery.status !== 'READY' ||
    otpInfo?.locked ||
    otpInfo?.expired ||
    otpInfo?.used ||
    cmdStatus === 'PENDING_OPEN' ||
    cmdStatus === 'OPENED';

  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      {/* Cột trái: Chọn đơn & Hiển thị mã OTP thật */}
      <div className="@4xl:col-span-5 space-y-4">
        <div className={`${t.card} p-4`}>
          <label htmlFor="order-selector" className={`block text-xs font-semibold uppercase tracking-wide ${t.mutedText} mb-2`}>
            Chọn đơn hàng của bạn
          </label>
          <select
            id="order-selector"
            value={activeDelivery.id}
            onChange={(e) => onSelectDelivery(Number(e.target.value))}
            className={`w-full min-h-[44px] px-3 py-2 text-sm font-medium cursor-pointer focus:outline-none ${t.input}`}
          >
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                Đơn #{d.id} · {d.lockerId} Ngăn #{d.compartmentNumber} ({d.status})
              </option>
            ))}
          </select>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${t.pill}`}>
                <Box className="w-3.5 h-3.5" aria-hidden="true" />
                Đơn #{activeDelivery.id}
              </span>
              <h2 className={`text-lg font-bold ${t.heading} mt-2`}>
                {activeDelivery.lockerId} — {activeDelivery.lockerName}
              </h2>
              <p className={`text-xs ${t.mutedText} mt-1`}>
                Trạng thái: <strong>{activeDelivery.status}</strong> · Cỡ {getSizeLabel(activeDelivery.packageSize)}
              </p>
            </div>
            <div className={`${t.compHighlight} px-4 py-2 text-center shrink-0`}>
              <div className={`text-[11px] font-semibold ${t.compHighlightLabel}`}>Ngăn</div>
              <div className={`text-3xl font-extrabold font-mono-code leading-none mt-0.5 ${t.compHighlightNum}`}>
                #{activeDelivery.compartmentNumber}
              </div>
            </div>
          </div>

          {otpInfo && (
            <div className={`${t.otpContainer} p-4 space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${t.otpHeading}`}>Mã OTP của bạn (dùng 1 lần)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowOtp((v) => !v)}
                    aria-label={showOtp ? 'Ẩn mã OTP' : 'Hiện mã OTP'}
                    className={`min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg cursor-pointer ${t.subtleBtn}`}
                  >
                    {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {otpInfo.otpCode && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(otpInfo.otpCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className={`min-h-[34px] px-2.5 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${t.subtleBtn}`}
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      {copied ? 'Đã chép' : 'Chép'}
                    </button>
                  )}
                </div>
              </div>

              <div className={`text-center py-2.5 ${t.otpDisplayBox}`}>
                <span className="font-mono-code text-2xl @2xl:text-3xl font-bold tracking-[0.2em]">
                  {otpInfo.otpCode ? (showOtp ? otpInfo.otpCode : '••••••') : 'KHÔNG KHẢ DỤNG'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-blue-200">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Sai: {otpInfo.failedAttempts}/{otpInfo.maxFailedAttempts}
                </span>
                <span>Bạn có thể nhập mã này trên Web HOẶC bàn phím 4×4 trên tủ Wokwi!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Ô nhập OTP mở ngăn */}
      <div className={`@4xl:col-span-7 ${t.card} p-4 @2xl:p-6 space-y-5`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 pb-4 border-b ${t.divider}`}>
          <div>
            <h3 className={`text-lg font-bold ${t.heading}`}>Nhập mã OTP để mở ngăn tủ</h3>
            <p className={`text-sm ${t.mutedText} mt-0.5`}>
              Đứng trước tủ <strong>{activeDelivery.lockerId}</strong> và nhập 6 chữ số.
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${otpInfo?.locked ? t.badgeError : t.badgeReady}`}>
            {otpInfo?.locked ? 'Đã khóa (sai 3/3)' : activeDelivery.status}
          </span>
        </div>

        {(otpInfo?.locked || otpInfo?.expired) && activeDelivery.status === 'READY' && (
          <div className={`p-4 rounded-xl border flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3 ${t.alertWarn}`}>
            <div className="flex items-start gap-2.5 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-bold">
                  {otpInfo.locked ? 'Đơn hàng đang tạm khóa do nhập sai OTP 3 lần' : 'Mã OTP đã hết hạn 24 giờ'}
                </div>
                <p className="text-xs opacity-90 mt-0.5">Bấm xin cấp lại mã mới để mở khóa đơn hàng.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer ${t.blueBtn}`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Xin cấp lại mã mới
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitOtp} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${t.bodyText}`}>Mã OTP 6 chữ số</span>
            {otpInfo?.otpCode && !isDisabled && (
              <button
                type="button"
                onClick={() => setDigits(otpInfo.otpCode.split(''))}
                className={`text-xs font-semibold hover:underline cursor-pointer ${t.accentText}`}
              >
                Điền nhanh mã OTP ({otpInfo.otpCode})
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5 @2xl:gap-3" role="group" aria-label="Nhập 6 chữ số mã OTP">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={isDisabled}
                value={digit}
                aria-label={`Chữ số OTP thứ ${index + 1}`}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-12 @2xl:h-16 w-full text-center font-mono-code text-xl @2xl:text-2xl font-bold focus:outline-none disabled:opacity-45 cursor-text transition-all ${t.otpInput}`}
              />
            ))}
          </div>

          <div className="flex flex-col @2xl:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={isDisabled}
              className={`flex-1 min-h-[48px] px-5 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer ${t.primaryBtn}`}
            >
              <Unlock className="w-4 h-4" aria-hidden="true" />
              {cmdStatus === 'PENDING_OPEN' ? 'Đang gửi lệnh mở tới tủ...' : 'Mở ngăn tủ ngay'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={submitting || activeDelivery.status !== 'READY'}
              className={`min-h-[48px] px-4 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer ${t.secondaryBtn}`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Cấp lại mã
            </button>
          </div>
        </form>

        {feedback && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
              feedback.type === 'error' ? t.alertError : feedback.type === 'success' ? t.alertSuccess : t.alertInfo
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

        {cmdStatus === 'OPENED' && (
          <div className={`p-4 rounded-xl border-2 flex items-center gap-2.5 text-sm font-bold ${t.alertSuccess}`}>
            <DoorOpen className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Ngăn #{activeDelivery.compartmentNumber} đang mở trên Wokwi — Hãy bấm nút XANH LÁ (Đóng cửa) để hoàn tất!</span>
          </div>
        )}
      </div>
    </div>
  );
}
