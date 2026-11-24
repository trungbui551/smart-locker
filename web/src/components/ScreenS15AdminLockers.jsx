import { useState } from 'react';
import { Box, Plus, RefreshCw, Settings } from 'lucide-react';
import { adminApi } from '../api/client';
import { PACKAGE_SIZES } from '../data/mockData';

/**
 * Màn hình S15 — Quản lý cấu hình Tủ & Ngăn (chỉ dành cho Admin — nối API thật /api/admin/lockers)
 */
export default function ScreenS15AdminLockers({
  theme: t,
  lockers,
  loading,
  onRefresh,
}) {
  const [newId, setNewId] = useState(`L0${lockers.length + 1}`);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [editingLockerId, setEditingLockerId] = useState(lockers[0]?.id || '');
  const [newCompSize, setNewCompSize] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeLocker = lockers.find((l) => l.id === editingLockerId) || lockers[0];

  const handleAddLocker = async (e) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    const idUpper = newId.trim().toUpperCase();
    try {
      await adminApi.createLocker({
        id: idUpper,
        name: newName.trim(),
        location: newLocation.trim() || 'Vị trí mới',
      });
      setEditingLockerId(idUpper);
      setFeedback({
        type: 'success',
        text: `Đã tạo tủ mới ${idUpper} (gồm 6 ngăn mặc định đủ 3 cỡ Nhỏ/Vừa/Lớn) và ghi Nhật ký (S13).`,
      });
      setNewId(`L0${lockers.length + 2}`);
      setNewName('');
      setNewLocation('');
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCompartment = async () => {
    if (!activeLocker) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await adminApi.addCompartment(activeLocker.id, newCompSize);
      setFeedback({
        type: 'success',
        text: `Đã thêm ngăn mới cỡ ${newCompSize} cho tủ ${activeLocker.id}.`,
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSize = async (compNumber, nextSize) => {
    if (!activeLocker) return;
    setFeedback(null);
    try {
      await adminApi.updateCompartmentSize(activeLocker.id, compNumber, nextSize);
      setFeedback({
        type: 'success',
        text: `Đã đổi kích cỡ ${activeLocker.id} · Ngăn #${compNumber} sang ${nextSize}.`,
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      {/* Thêm tủ mới */}
      <form onSubmit={handleAddLocker} className={`@4xl:col-span-4 ${t.card} p-5 space-y-3.5`}>
        <div className="flex items-center gap-2">
          <Plus className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
          <h2 className={`text-base font-bold ${t.heading}`}>Thêm tủ khóa mới</h2>
        </div>

        <div>
          <label htmlFor="lk-id" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Mã tủ MQTT (lockerId) *
          </label>
          <input
            id="lk-id"
            type="text"
            required
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="L03"
            className={`w-full min-h-[42px] px-3 py-2 text-sm font-mono-code focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="lk-name" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Tên tủ *
          </label>
          <input
            id="lk-name"
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tủ Sảnh C — Thư viện"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="lk-loc" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Vị trí đặt tủ
          </label>
          <input
            id="lk-loc"
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Tầng trệt cổng chính"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full min-h-[46px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
        >
          <Box className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Đang tạo tủ...' : 'Thêm tủ (6 ngăn mặc định)'}
        </button>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              feedback.type === 'error' ? t.alertError : t.alertSuccess
            }`}
          >
            {feedback.text}
          </div>
        )}
      </form>

      {/* Cấu hình ngăn cho tủ đang chọn */}
      <div className={`@4xl:col-span-8 ${t.card} p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
            <h2 className={`text-base font-bold ${t.heading}`}>Cấu hình kích cỡ từng ngăn</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {lockers.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setEditingLockerId(l.id)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  l.id === activeLocker?.id ? t.primaryBtn : t.secondaryBtn
                }`}
              >
                {l.id}
              </button>
            ))}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={`min-h-[38px] px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${t.subtleBtn}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!activeLocker ? (
          <div className={`text-xs ${t.mutedText}`}>Chưa có tủ khóa nào trong CSDL.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={`text-sm font-bold ${t.heading}`}>
                {activeLocker.id} — {activeLocker.name} ({(activeLocker.compartments || []).length}/9 ngăn)
              </div>
              {(activeLocker.compartments || []).length < 9 && (
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Cỡ ngăn muốn thêm"
                    value={newCompSize}
                    onChange={(e) => setNewCompSize(e.target.value)}
                    className={`min-h-[38px] px-2.5 py-1 text-xs font-semibold cursor-pointer ${t.input}`}
                  >
                    {PACKAGE_SIZES.map((sz) => (
                      <option key={sz.code} value={sz.code}>
                        Cỡ {sz.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleAddCompartment}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${t.softActionBtn}`}
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Thêm ngăn #{(activeLocker.compartments || []).length + 1}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3 gap-3">
              {(activeLocker.compartments || []).map((c) => (
                <div key={c.number} className={`${t.subCard} p-3.5 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono-code font-extrabold text-sm ${t.heading}`}>
                      Ngăn #{c.number}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.sizeTag}`}>
                      {c.status}
                    </span>
                  </div>
                  <select
                    aria-label={`Kích cỡ ngăn ${c.number}`}
                    value={c.size}
                    onChange={(e) => handleUpdateSize(c.number, e.target.value)}
                    className={`w-full min-h-[38px] px-2.5 py-1 text-xs font-semibold cursor-pointer ${t.input}`}
                  >
                    {PACKAGE_SIZES.map((sz) => (
                      <option key={sz.code} value={sz.code}>
                        Cỡ {sz.label} ({sz.code})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
