import { useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return iso;
  }
}

/**
 * Màn hình S5 — Danh sách đơn hàng của tôi (Người nhận — dữ liệu thật từ GET /api/deliveries/my)
 */
export default function ScreenS5RecipientOrders({
  theme: t,
  deliveries,
  loading,
  onRefresh,
  onOpenOrderOtp,
}) {
  const [tab, setTab] = useState('ACTIVE');

  const activeOrders = deliveries.filter((d) => d.status === 'READY' || d.status === 'STORING');
  const historyOrders = deliveries.filter((d) => d.status === 'PICKED_UP' || d.status === 'EXPIRED');
  const list = tab === 'ACTIVE' ? activeOrders : historyOrders;

  return (
    <div className="space-y-5">
      <div className={`${t.card} p-3 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('ACTIVE')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'ACTIVE' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            Đang chờ nhận ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('HISTORY')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'HISTORY' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            Lịch sử ({historyOrders.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Làm mới
        </button>
      </div>

      {list.length === 0 ? (
        <div className={`${t.card} p-8 text-center space-y-2`}>
          <Box className={`w-10 h-10 mx-auto ${t.mutedText}`} aria-hidden="true" />
          <div className={`font-bold ${t.heading}`}>Chưa có đơn hàng nào trong mục này</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-4">
          {list.map((order) => (
            <div key={order.id} className={`${t.card} p-5 flex flex-col justify-between gap-4`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono-code text-xs font-bold px-2.5 py-1 rounded-full ${t.pill}`}>
                        Đơn #{order.id}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                        Cỡ {getSizeLabel(order.packageSize)}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold mt-2 ${t.heading}`}>
                      {order.lockerId} — {order.lockerName}
                    </h3>
                    <p className={`text-xs mt-0.5 ${t.mutedText}`}>
                      Shipper: {order.courierUsername} · Tạo lúc: {formatTime(order.createdAt)}
                    </p>
                  </div>

                  <div className={`${t.compHighlight} px-3.5 py-2 text-center shrink-0`}>
                    <div className={`text-[11px] font-semibold ${t.compHighlightLabel}`}>Ngăn</div>
                    <div className={`text-2xl font-extrabold font-mono-code leading-tight ${t.compHighlightNum}`}>
                      #{order.compartmentNumber}
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-2.5 pt-3 border-t ${t.divider} text-xs`}>
                  <div className={`${t.subCard} p-2.5`}>
                    <div className={`${t.mutedText} flex items-center gap-1`}>
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      Hạn lưu hàng (72h)
                    </div>
                    <div className={`font-bold mt-0.5 ${t.bodyText}`}>{formatTime(order.expiresAt)}</div>
                  </div>
                  <div className={`${t.subCard} p-2.5`}>
                    <div className={`${t.mutedText}`}>Trạng thái đơn</div>
                    <div className="font-bold mt-0.5">
                      {order.status === 'PICKED_UP' ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã nhận
                        </span>
                      ) : order.status === 'EXPIRED' ? (
                        <span className="text-rose-700 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Quá hạn 72h
                        </span>
                      ) : order.status === 'STORING' ? (
                        <span className="text-amber-700">Shipper đang bỏ hàng</span>
                      ) : (
                        <span className="text-[#172554]">Sẵn sàng (READY)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {order.status === 'READY' && (
                <button
                  type="button"
                  onClick={() => onOpenOrderOtp(order.id)}
                  className={`w-full min-h-[46px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
                >
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  Xem &amp; Nhập OTP mở ngăn (S6)
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
