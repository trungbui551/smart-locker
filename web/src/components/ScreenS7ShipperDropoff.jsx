import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  User,
  WifiOff,
} from 'lucide-react';
import { deliveryApi } from '../api/client';
import { PACKAGE_SIZES } from '../data/mockData';

/**
 * Màn hình S7 — Chọn tủ & Tạo đơn gửi hàng theo kích cỡ (Shipper — nối API thật POST /api/deliveries)
 */
export default function ScreenS7ShipperDropoff({
  theme: t,
  lockers,
  loading,
  onRefreshLockers,
  onDeliveryCreated,
}) {
  const firstOnline = lockers.find((l) => l.status === 'ONLINE')?.id || '';
  const [selectedLockerId, setSelectedLockerId] = useState(firstOnline);
  const [recipientIdentifier, setRecipientIdentifier] = useState('recipient');
  const [selectedSize, setSelectedSize] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const effectiveLockerId =
    lockers.some((l) => l.id === selectedLockerId && l.status === 'ONLINE')
      ? selectedLockerId
      : firstOnline;
  const currentLocker = lockers.find((l) => l.id === effectiveLockerId);

  const getFreeCount = (locker, sizeCode) => {
    if (!locker) return 0;
    if (sizeCode === 'SMALL') return locker.freeSmall ?? 0;
    if (sizeCode === 'MEDIUM') return locker.freeMedium ?? 0;
    return locker.freeLarge ?? 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!currentLocker || currentLocker.status !== 'ONLINE') {
      setErrorMsg('Chưa có tủ nào đang ONLINE. Hãy bấm Play trên Wokwi để tủ gửi heartbeat lên Backend.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await deliveryApi.create(
        currentLocker.id,
        recipientIdentifier.trim(),
        selectedSize
      );
      onDeliveryCreated(created);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      {/* Cột trái: Bước 1 — Chọn tủ */}
      <div className="@4xl:col-span-5">
        <div className={`${t.card} p-5 space-y-3.5`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${t.accentText}`}>Bước 1 / 3</span>
              <h2 className={`text-lg font-bold ${t.heading} mt-0.5`}>Chọn tủ đang hoạt động</h2>
            </div>
            <button
              type="button"
              onClick={onRefreshLockers}
              disabled={loading}
              className={`min-h-[36px] px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${t.secondaryBtn}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Làm mới
            </button>
          </div>

          <div className="space-y-3">
            {lockers.map((locker) => {
              const isOnline = locker.status === 'ONLINE';
              const isSelected = effectiveLockerId === locker.id;
              const totalFree = (locker.freeSmall || 0) + (locker.freeMedium || 0) + (locker.freeLarge || 0);

              return (
                <button
                  key={locker.id}
                  type="button"
                  disabled={!isOnline}
                  onClick={() => {
                    setSelectedLockerId(locker.id);
                    setErrorMsg('');
                  }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    !isOnline
                      ? `${t.selectableDisabled} cursor-not-allowed`
                      : isSelected
                      ? `${t.selectableActive} cursor-pointer`
                      : `${t.selectableIdle} cursor-pointer`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono-code font-bold text-sm ${t.accentText}`}>{locker.id}</span>
                        <span className={`text-sm font-bold ${t.bodyText}`}>{locker.name}</span>
                      </div>
                      <p className={`text-xs ${t.mutedText} flex items-center gap-1 mt-1`}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {locker.location || 'Chưa cập nhật vị trí'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        isOnline ? t.badgeSuccess : t.badgeError
                      }`}
                    >
                      {isOnline ? <Radio className="w-3 h-3" aria-hidden="true" /> : <WifiOff className="w-3 h-3" aria-hidden="true" />}
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {isOnline ? (
                    <div className={`grid grid-cols-3 gap-2 mt-3 pt-3 border-t ${t.divider} text-xs`}>
                      {PACKAGE_SIZES.map((sz) => {
                        const free = getFreeCount(locker, sz.code);
                        return (
                          <div key={sz.code} className={`${t.subCard} px-2 py-1.5 text-center`}>
                            <span className={t.mutedText}>Cỡ {sz.label}: </span>
                            <strong className={free > 0 ? 'text-emerald-600' : 'text-rose-600'}>{free}</strong>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-rose-600 font-medium">
                      Tủ ngoại tuyến — hãy bật Play trên Wokwi rồi bấm Làm mới
                    </div>
                  )}

                  {isOnline && (
                    <div className={`mt-2 text-xs ${t.mutedText} flex items-center justify-between`}>
                      <span>Tổng ngăn trống: {totalFree}/{locker.compartments?.length || 6}</span>
                      {isSelected && (
                        <span className={`${t.accentText} font-semibold inline-flex items-center gap-1`}>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đang chọn
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cột phải: Bước 2 & Bước 3 */}
      <div className="@4xl:col-span-7 space-y-5">
        <div className={`${t.card} p-4 @2xl:p-5 space-y-4`}>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${t.accentText}`}>Bước 2 / 3</span>
            <h2 className={`text-lg font-bold ${t.heading} mt-0.5`}>Người nhận hàng</h2>
            <p className={`text-xs ${t.mutedText} mt-0.5`}>
              Nhập tên đăng nhập hoặc email của tài khoản Người nhận (ví dụ tài khoản mẫu: <code className="font-mono-code">recipient</code>).
            </p>
          </div>

          <div>
            <label htmlFor="recipient-id" className={`block text-xs font-semibold ${t.bodyText} mb-1.5`}>
              Username hoặc Email người nhận *
            </label>
            <div className="relative">
              <User className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
              <input
                id="recipient-id"
                type="text"
                required
                value={recipientIdentifier}
                onChange={(e) => setRecipientIdentifier(e.target.value)}
                placeholder="recipient hoặc email@gmail.com"
                className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>
          </div>
        </div>

        <div className={`${t.card} p-5 space-y-4`}>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${t.accentText}`}>Bước 3 / 3</span>
            <h2 className={`text-lg font-bold ${t.heading} mt-0.5`}>Chọn kích cỡ gói hàng</h2>
          </div>

          <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3">
            {PACKAGE_SIZES.map((sz) => {
              const free = getFreeCount(currentLocker, sz.code);
              const isSelected = selectedSize === sz.code;
              const isUnavailable = !currentLocker || free === 0;

              return (
                <button
                  key={sz.code}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() => {
                    setSelectedSize(sz.code);
                    setErrorMsg('');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    isUnavailable
                      ? `${t.selectableDisabled} cursor-not-allowed`
                      : isSelected
                      ? `${t.selectableActive} cursor-pointer`
                      : `${t.selectableIdle} cursor-pointer`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Package className={`w-5 h-5 ${isSelected ? t.accentText : t.mutedText}`} aria-hidden="true" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${free > 0 ? t.badgeSuccess : t.badgeError}`}>
                        {free > 0 ? `Còn ${free}` : 'Hết'}
                      </span>
                    </div>
                    <div className={`font-bold text-base ${t.bodyText} mt-2.5`}>Cỡ {sz.label}</div>
                    <div className={`text-xs font-medium ${t.accentText} mt-0.5`}>{sz.dimensions}</div>
                  </div>
                  <div className={`text-xs ${t.mutedText} mt-2 pt-2 border-t ${t.divider}`}>{sz.examples}</div>
                </button>
              );
            })}
          </div>

          {errorMsg && (
            <div role="alert" className={`p-3.5 rounded-xl border text-sm flex items-center gap-2 ${t.alertError}`}>
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !currentLocker}
            className={`w-full min-h-[50px] px-6 py-3 font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer ${t.primaryBtn}`}
          >
            <Box className="w-4 h-4" aria-hidden="true" />
            {submitting ? 'Đang cấp ngăn & gửi lệnh MQTT...' : 'Cấp ngăn tự động & Mở tủ Wokwi'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  );
}
