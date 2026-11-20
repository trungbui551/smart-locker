import { useState } from 'react';
import { Box, Plus, Settings } from 'lucide-react';
import { PACKAGE_SIZES } from '../data/mockData';

/**
 * Màn hình S15 — Quản lý cấu hình Tủ & Ngăn (chỉ dành cho Admin)
 */
export default function ScreenS15AdminLockers({
  theme: t,
  lockers,
  onAddLocker,
  onUpdateCompartmentSize,
  onAddCompartment,
}) {
  const [newId, setNewId] = useState(`L0${lockers.length + 1}`);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [editingLockerId, setEditingLockerId] = useState(lockers[0]?.id);
  const [msg, setMsg] = useState('');

  const activeLocker = lockers.find((l) => l.id === editingLockerId) || lockers[0];

  const handleAddLocker = (e) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;
    onAddLocker({
      id: newId.trim().toUpperCase(),
      name: newName.trim(),
      location: newLocation.trim() || 'Vị trí mới',
    });
    setEditingLockerId(newId.trim().toUpperCase());
    setMsg(`Đã thêm tủ mới ${newId.trim().toUpperCase()} gồm 6 ngăn mặc định (đủ 3 cỡ Nhỏ/Vừa/Lớn).`);
    setNewId(`L0${lockers.length + 2}`);
    setNewName('');
    setNewLocation('');
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
            placeholder="L04"
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
            placeholder="Tủ Sảnh D — Thư viện"
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
          className={`w-full min-h-[46px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
        >
          <Box className="w-4 h-4" aria-hidden="true" />
          Thêm tủ (6 ngăn mặc định)
        </button>

        {msg && <div className={`p-3 rounded-xl border text-xs ${t.alertSuccess}`}>{msg}</div>}
      </form>

      {/* Cấu hình ngăn cho tủ đang chọn */}
      <div className={`@4xl:col-span-8 ${t.card} p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
            <h2 className={`text-base font-bold ${t.heading}`}>Cấu hình kích cỡ từng ngăn</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lockers.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setEditingLockerId(l.id)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  l.id === activeLocker.id ? t.primaryBtn : t.secondaryBtn
                }`}
              >
                {l.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={`text-sm font-bold ${t.heading}`}>
            {activeLocker.id} — {activeLocker.name} ({activeLocker.compartments.length}/9 ngăn)
          </div>
          {activeLocker.compartments.length < 9 && (
            <button
              type="button"
              onClick={() => onAddCompartment(activeLocker.id)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${t.softActionBtn}`}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Thêm ngăn #{activeLocker.compartments.length + 1}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3 gap-3">
          {activeLocker.compartments.map((c) => (
            <div key={c.number} className={`${t.subCard} p-3.5 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono-code font-extrabold text-sm ${t.heading}`}>Ngăn #{c.number}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.sizeTag}`}>
                  {c.status}
                </span>
              </div>
              <select
                aria-label={`Kích cỡ ngăn ${c.number}`}
                value={c.size}
                onChange={(e) => onUpdateCompartmentSize(activeLocker.id, c.number, e.target.value)}
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
      </div>
    </div>
  );
}
