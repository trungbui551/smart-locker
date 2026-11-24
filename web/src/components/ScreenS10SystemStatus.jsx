import { useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  Database,
  Radio,
  RefreshCw,
  Server,
  WifiOff,
} from 'lucide-react';

function formatTime(iso) {
  if (!iso) return 'Chưa có nhịp sống';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Màn hình S10 — Quản lý trạng thái hệ thống (dữ liệu thật từ /api/operator/system-status, /api/lockers, /api/deliveries/my)
 * Tự động làm mới mỗi 5 giây để phát hiện ngay khi tủ Wokwi ONLINE/OFFLINE.
 */
export default function ScreenS10SystemStatus({
  theme: t,
  systemStatus,
  lockers,
  deliveries,
  loading,
  onRefresh,
  onGoToLockerMap,
  onGoToOrders,
}) {
  // Tự động làm mới mỗi 5 giây khi đang mở S10
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  const onlineCount = systemStatus?.onlineLockers ?? lockers.filter((l) => l.status === 'ONLINE').length;
  const totalLockers = systemStatus?.totalLockers ?? lockers.length;
  const allComps = lockers.flatMap((l) => l.compartments || []);
  const occupiedCount = systemStatus?.occupiedCompartments ?? allComps.filter((c) => c.status === 'OCCUPIED').length;
  const totalComps = systemStatus?.totalCompartments ?? allComps.length;
  const faultComps = lockers.flatMap((l) =>
    (l.compartments || [])
      .filter((c) => c.status === 'FAULT')
      .map((c) => ({ lockerId: l.id, lockerName: l.name, number: c.number }))
  );
  const expiredOrders = deliveries.filter((d) => d.status === 'EXPIRED');
  const offlineLockers = lockers.filter((l) => l.status === 'OFFLINE');
  const mqttConnected = systemStatus?.mqttConnected ?? false;
  const backendUp = (systemStatus?.backendStatus || 'UP') === 'UP';

  return (
    <div className="space-y-5">
      {/* Thanh trạng thái hạ tầng lõi (Live Telemetry thật) */}
      <div className={`${t.otpContainer} p-4 @2xl:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Activity className="w-4 h-4 text-[#FDBA74]" aria-hidden="true" />
            <span>Tình trạng kết nối hạ tầng (Dữ liệu thật)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200">Tự làm mới mỗi 5 giây</span>
            <button
              type="button"
              onClick={() => onRefresh(false)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-[#0B1120] border border-blue-900 rounded-xl p-3 flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#FDBA74] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">Backend Spring Boot</div>
              <div className={`font-semibold truncate ${backendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {backendUp ? 'UP (Đang hoạt động)' : 'DOWN'}
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900 rounded-xl p-3 flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#FDBA74] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">PostgreSQL 16</div>
              <div className="text-emerald-400 font-semibold truncate">
                Connected ({totalLockers} tủ · {totalComps} ngăn)
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-blue-900 rounded-xl p-3 flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-[#FDBA74] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-semibold text-white truncate">MQTT Broker (TLS)</div>
              <div className={`font-semibold truncate ${mqttConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mqttConnected ? 'Connected (Đang lắng nghe)' : 'Disconnected (Đang nối lại)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 thẻ chỉ số KPI thật */}
      <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-3.5">
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Tủ đang hoạt động</div>
          <div className={`text-3xl font-extrabold mt-1 ${t.heading}`}>
            {onlineCount}/{totalLockers}
          </div>
          <div className={`text-xs font-semibold mt-1 ${offlineLockers.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {offlineLockers.length > 0 ? `${offlineLockers.length} tủ ngoại tuyến` : '100% Online'}
          </div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Ngăn đang chứa hàng</div>
          <div className={`text-3xl font-extrabold mt-1 ${t.heading}`}>
            {occupiedCount}/{totalComps}
          </div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>
            Trống {Math.max(0, totalComps - occupiedCount - faultComps.length)} ngăn
          </div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Đơn quá hạn 72 giờ</div>
          <div className="text-3xl font-extrabold mt-1 text-amber-600">
            {systemStatus?.expiredDeliveries ?? expiredOrders.length}
          </div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>Cần nhân viên xử lý</div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Ngăn báo lỗi (Fault)</div>
          <div className="text-3xl font-extrabold mt-1 text-rose-600">
            {systemStatus?.faultCompartments ?? faultComps.length}
          </div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>Cảm biến cửa / khóa</div>
        </div>
      </div>

      {/* Khu vực 2 cột: Cảnh báo nóng + Mức sử dụng từng tủ */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5">
        {/* Cảnh báo cần xử lý ngay */}
        <div className={`@4xl:col-span-7 ${t.card} p-5 space-y-3.5`}>
          <h2 className={`text-base font-bold ${t.heading} flex items-center gap-2`}>
            <AlertTriangle className="w-5 h-5 text-rose-600" aria-hidden="true" />
            Cảnh báo cần xử lý ngay
          </h2>

          {offlineLockers.length === 0 && faultComps.length === 0 && expiredOrders.length === 0 ? (
            <div className={`p-4 rounded-xl border text-xs font-semibold ${t.alertSuccess}`}>
              Hệ thống ổn định — chưa ghi nhận tủ ngoại tuyến, lỗi cửa hay đơn quá hạn 72h.
            </div>
          ) : (
            <div className="space-y-2.5">
              {offlineLockers.map((l) => (
                <div
                  key={l.id}
                  className={`p-3.5 rounded-xl border flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-2 ${t.alertError}`}
                >
                  <div className="flex items-start gap-2 text-xs">
                    <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <div className="font-bold">Tủ {l.id} đang NGOẠI TUYẾN</div>
                      <div>Nhịp cuối: {formatTime(l.lastHeartbeatAt)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGoToLockerMap(l.id)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs shrink-0 inline-flex items-center gap-1 cursor-pointer ${t.softActionBtn}`}
                  >
                    Kiểm tra <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {faultComps.map((f) => (
                <div
                  key={`${f.lockerId}-${f.number}`}
                  className={`p-3.5 rounded-xl border flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-2 ${t.alertWarn}`}
                >
                  <div className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <div className="font-bold">
                        {f.lockerId} · Ngăn #{f.number} báo lỗi cửa (FAULT)
                      </div>
                      <div>Cần kiểm tra cảm biến hoặc khôi phục về FREE tại S11.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGoToLockerMap(f.lockerId)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs shrink-0 inline-flex items-center gap-1 cursor-pointer ${t.softActionBtn}`}
                  >
                    Xử lý ngăn <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {expiredOrders.map((o) => (
                <div
                  key={o.id}
                  className={`p-3.5 rounded-xl border flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-2 ${t.alertWarn}`}
                >
                  <div className="text-xs">
                    <div className="font-bold">
                      Đơn #{o.id} ({o.lockerId} · Ngăn #{o.compartmentNumber}) quá hạn 72 giờ
                    </div>
                    <div>Người nhận: {o.recipientName} ({o.recipientUsername})</div>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToOrders}
                    className={`min-h-[38px] px-3 py-1.5 text-xs shrink-0 inline-flex items-center gap-1 cursor-pointer ${t.softActionBtn}`}
                  >
                    Xử lý đơn <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tỷ lệ lấp đầy từng tủ */}
        <div className={`@4xl:col-span-5 ${t.card} p-5 space-y-4`}>
          <h2 className={`text-base font-bold ${t.heading} flex items-center gap-2`}>
            <Box className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
            Tình trạng sử dụng theo tủ
          </h2>

          <div className="space-y-3.5">
            {lockers.map((l) => {
              const comps = l.compartments || [];
              const occ = comps.filter((c) => c.status === 'OCCUPIED').length;
              const pct = comps.length ? Math.round((occ / comps.length) * 100) : 0;
              return (
                <div key={l.id} className={`${t.subCard} p-3.5 space-y-2`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${t.heading}`}>
                      {l.id} · {l.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        l.status === 'ONLINE' ? t.badgeSuccess : t.badgeError
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-[#EA580C] rounded-full transition-all"
                    />
                  </div>
                  <div className={`flex justify-between text-xs ${t.mutedText}`}>
                    <span>
                      Đang chứa: {occ}/{comps.length} ngăn ({pct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => onGoToLockerMap(l.id)}
                      className={`font-bold hover:underline cursor-pointer ${t.accentText}`}
                    >
                      Xem sơ đồ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
