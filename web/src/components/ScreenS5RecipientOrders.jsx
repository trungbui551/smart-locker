import { useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  MapPin,
} from 'lucide-react';
import { getSizeLabel } from '../data/mockData';

/**
 * Màn hình S5 — Danh sách đơn hàng của tôi (dành cho Người nhận)
 * Chia 2 tab: Chờ lấy hàng (READY) và Lịch sử (PICKED_UP / EXPIRED).
 */
export default function ScreenS5RecipientOrders({ theme: t, deliveries, onOpenOrderOtp }) {
  const [tab, setTab] = useState('ACTIVE'); // ACTIVE | HISTORY

  const activeOrders = deliveries.filter((d) => d.status === 'READY');
  const historyOrders = deliveries.filter((d) => d.status !== 'READY');
  const list = tab === 'ACTIVE' ? activeOrders : historyOrders;

  return (
    <div className="space-y-5">
      {/* Thanh chuyển tab */}
      <div className={`${t.card} p-3 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('ACTIVE')}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold cursor-pointer ${
              tab === 'ACTIVE' ? t.primaryBtn : t.secondaryBtn
            }`}
          >
            Chờ lấy hàng ({activeOrders.length})
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

        <span className={`text-xs font-medium ${t.mutedText}`}>
          Hàng được lưu miễn phí tối đa <strong>72 giờ</strong>
        </span>
      </div>

      {list.length === 0 ? (
        <div className={`${t.card} p-8 text-center space-y-2`}>
          <Box className={`w-10 h-10 mx-auto ${t.mutedText}`} aria-hidden="true" />
          <div className={`font-bold ${t.heading}`}>Không có đơn hàng nào trong mục này</div>
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
                        {order.id}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.sizeTag}`}>
                        Cỡ {getSizeLabel(order.packageSize)}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold mt-2 ${t.heading}`}>{order.lockerName}</h3>
                    <p className={`text-xs flex items-center gap-1 mt-0.5 ${t.mutedText}`}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {order.lockerLocation}
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
                      Thời gian lưu
                    </div>
                    <div className={`font-bold mt-0.5 ${t.bodyText}`}>{order.storageRemaining}</div>
                  </div>
                  <div className={`${t.subCard} p-2.5`}>
                    <div className={`${t.mutedText} flex items-center gap-1`}>
                      <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                      Trạng thái OTP
                    </div>
                    <div className="font-bold mt-0.5">
                      {order.status === 'PICKED_UP' ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã nhận
                        </span>
                      ) : order.locked ? (
                        <span className="text-rose-700 inline-flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Đang tạm khóa
                        </span>
                      ) : order.otpExpired ? (
                        <span className="text-amber-700 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> Hết hạn 24h
                        </span>
                      ) : (
                        <span className="text-[#172554]">Còn {order.otpRemaining}</span>
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
