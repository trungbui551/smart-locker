import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  Database,
  Mail,
  MessageSquare,
  Radio,
  Server,
  WifiOff,
} from 'lucide-react';

/**
 * Màn hình S10 — Quản lý trạng thái hệ thống (Dashboard tổng quan cho Vận hành & Admin)
 */
export default function ScreenS10SystemStatus({
  theme: t,
  lockers,
  deliveries,
  onGoToLockerMap,
  onGoToOrders,
}) {
  const onlineCount = lockers.filter((l) => l.status === 'ONLINE').length;
  const allComps = lockers.flatMap((l) => l.compartments);
  const occupiedCount = allComps.filter((c) => c.status === 'OCCUPIED').length;
  const faultComps = lockers.flatMap((l) =>
    l.compartments
      .filter((c) => c.status === 'FAULT')
      .map((c) => ({ lockerId: l.id, lockerName: l.name, number: c.number }))
  );
  const expiredOrders = deliveries.filter((d) => d.status === 'EXPIRED');
  const lockedOrders = deliveries.filter((d) => d.locked && d.status === 'READY');
  const offlineLockers = lockers.filter((l) => l.status === 'OFFLINE');

  return (
    <div className="space-y-5">
      {/* Thanh đèn trạng thái sức khỏe các dịch vụ lõi (Mảng Tối nổi bật) */}
      <div className={`${t.otpContainer} p-4 @2xl:p-5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Activity className="w-4 h-4 text-[#FDBA74]" aria-hidden="true" />
            <span>Tình trạng kết nối hạ tầng (Live Telemetry)</span>
          </div>
          <span className="text-xs text-blue-200">Cập nhật tự động mỗi 5 giây</span>
        </div>

        <div className="grid grid-cols-2 @3xl:grid-cols-5 gap-2.5 text-xs">
          {[
            { label: 'Backend API', status: 'UP (42ms)', Icon: Server },
            { label: 'PostgreSQL 16', status: 'Connected', Icon: Database },
            { label: 'MQTT Broker', status: 'Active (TLS)', Icon: Radio },
            { label: 'Gmail SMTP', status: 'Ready', Icon: Mail },
            { label: 'SMS Gateway', status: 'Trial Active', Icon: MessageSquare },
          ].map(({ label, status, Icon }) => (
            <div
              key={label}
              className="bg-[#0B1120] border border-blue-900 rounded-xl p-3 flex items-center gap-2.5"
            >
              <Icon className="w-4 h-4 text-[#FDBA74] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{label}</div>
                <div className="text-emerald-400 font-medium truncate">{status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 thẻ chỉ số KPI */}
      <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-3.5">
        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Tủ đang hoạt động</div>
          <div className={`text-3xl font-extrabold mt-1 ${t.heading}`}>
            {onlineCount}/{lockers.length}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            {offlineLockers.length > 0 ? `${offlineLockers.length} tủ ngoại tuyến` : '100% Online'}
          </div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Ngăn đang chứa hàng</div>
          <div className={`text-3xl font-extrabold mt-1 ${t.heading}`}>
            {occupiedCount}/{allComps.length}
          </div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>
            Trống {allComps.length - occupiedCount - faultComps.length} ngăn
          </div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Đơn quá hạn 72 giờ</div>
          <div className="text-3xl font-extrabold mt-1 text-amber-600">{expiredOrders.length}</div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>Cần nhân viên xử lý</div>
        </div>

        <div className={`${t.card} p-4`}>
          <div className={`text-xs font-semibold ${t.mutedText}`}>Lỗi cửa (Fault) &amp; Khóa OTP</div>
          <div className="text-3xl font-extrabold mt-1 text-rose-600">
            {faultComps.length + lockedOrders.length}
          </div>
          <div className={`text-xs mt-1 ${t.mutedText}`}>
            {faultComps.length} lỗi cửa · {lockedOrders.length} khóa OTP
          </div>
        </div>
      </div>

      {/* Khu vực 2 cột: Cảnh báo nóng + Mức sử dụng từng tủ */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5">
        {/* Cảnh báo cần xử lý ngay */}
        <div className={`@4xl:col-span-7 ${t.card} p-5 space-y-3.5`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-bold ${t.heading} flex items-center gap-2`}>
              <AlertTriangle className="w-5 h-5 text-rose-600" aria-hidden="true" />
              Cảnh báo cần xử lý ngay
            </h2>
          </div>

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
                    <div>{l.lastHeartbeat}</div>
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
                      {f.lockerId} · Ngăn #{f.number} báo lỗi cửa (fault)
                    </div>
                    <div>Cảm biến phát hiện cửa mở quá lâu chưa đóng lại.</div>
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
                    Đơn {o.id} ({o.lockerId} · Ngăn #{o.compartmentNumber}) quá hạn 72 giờ
                  </div>
                  <div>Người nhận: {o.recipientName} ({o.recipientPhone})</div>
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
        </div>

        {/* Tỷ lệ lấp đầy từng tủ */}
        <div className={`@4xl:col-span-5 ${t.card} p-5 space-y-4`}>
          <h2 className={`text-base font-bold ${t.heading} flex items-center gap-2`}>
            <Box className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
            Tình trạng sử dụng theo tủ
          </h2>

          <div className="space-y-3.5">
            {lockers.map((l) => {
              const occ = l.compartments.filter((c) => c.status === 'OCCUPIED').length;
              const pct = l.compartments.length ? Math.round((occ / l.compartments.length) * 100) : 0;
              return (
                <div key={l.id} className={`${t.subCard} p-3.5 space-y-2`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${t.heading}`}>
                      {l.id} · {l.name.split('—')[0]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
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
                    <span>Đang chứa: {occ}/{l.compartments.length} ngăn ({pct}%)</span>
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
