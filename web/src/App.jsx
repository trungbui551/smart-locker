import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Box,
  CheckCircle2,
  ClipboardList,
  FileText,
  Grid2x2,
  History,
  KeyRound,
  LogIn,
  Mail,
  Monitor,
  Package,
  PackagePlus,
  Settings,
  Smartphone,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  authApi,
  clearSession,
  deliveryApi,
  getSavedToken,
  getSavedUser,
  lockerApi,
  saveSession,
  setUnauthorizedHandler,
} from './api/client';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DELIVERIES,
  INITIAL_LOCKERS,
  INITIAL_USERS,
  ROLE_LABELS,
  generateDemoOtp,
  getNowLabel,
} from './data/mockData';
import { DESIGN_THEMES } from './data/themes';
import ScreenAuthBundle from './components/ScreenAuthBundle';
import ScreenS5RecipientOrders from './components/ScreenS5RecipientOrders';
import ScreenS6OtpPickup from './components/ScreenS6OtpPickup';
import ScreenS7ShipperDropoff from './components/ScreenS7ShipperDropoff';
import ScreenS8ConfirmDropoff from './components/ScreenS8ConfirmDropoff';
import ScreenS9ShipperHistory from './components/ScreenS9ShipperHistory';
import ScreenS10SystemStatus from './components/ScreenS10SystemStatus';
import ScreenS11LockerMap from './components/ScreenS11LockerMap';
import ScreenS12OperatorOrders from './components/ScreenS12OperatorOrders';
import ScreenS13AuditLog from './components/ScreenS13AuditLog';
import ScreenS14AdminUsers from './components/ScreenS14AdminUsers';
import ScreenS15AdminLockers from './components/ScreenS15AdminLockers';

// Nhóm màn hình theo đúng 5 nhóm trong docs/design-spec.md (15 màn hình S1–S15)
const ROLE_GROUPS = [
  {
    key: 'AUTH',
    label: 'Tài khoản (S1–S4)',
    defaultScreen: 'S1',
    screens: [
      { id: 'S1', shortLabel: 'S1 · Đ.nhập', label: 'S1 · Đăng nhập', title: 'Đăng nhập hệ thống', Icon: LogIn },
      { id: 'S2', shortLabel: 'S2 · Đ.ký', label: 'S2 · Đăng ký', title: 'Đăng ký tài khoản mới', Icon: UserPlus },
      { id: 'S3', shortLabel: 'S3 · Quên MK', label: 'S3 · Quên mật khẩu', title: 'Quên mật khẩu qua Email', Icon: Mail },
      { id: 'S4', shortLabel: 'S4 · Hồ sơ', label: 'S4 · Hồ sơ & Server', title: 'Hồ sơ cá nhân & Máy chủ', Icon: User },
    ],
  },
  {
    key: 'RECIPIENT',
    label: 'Người nhận (S5–S6)',
    defaultScreen: 'S5',
    screens: [
      { id: 'S5', shortLabel: 'S5 · Đơn', label: 'S5 · Đơn của tôi', title: 'Danh sách đơn hàng của tôi', Icon: Package },
      { id: 'S6', shortLabel: 'S6 · OTP', label: 'S6 · Mở bằng OTP', title: 'Chi tiết đơn & Mở ngăn bằng OTP', Icon: KeyRound },
    ],
  },
  {
    key: 'COURIER',
    label: 'Shipper (S7–S9)',
    defaultScreen: 'S7',
    screens: [
      { id: 'S7', shortLabel: 'S7 · Gửi', label: 'S7 · Chọn tủ & Gửi', title: 'Chọn tủ & Tạo đơn gửi hàng theo cỡ', Icon: PackagePlus },
      { id: 'S8', shortLabel: 'S8 · Cửa', label: 'S8 · Xác nhận cửa', title: 'Xác nhận mở cửa & Bỏ hàng vào ngăn', Icon: CheckCircle2 },
      { id: 'S9', shortLabel: 'S9 · Lịch sử', label: 'S9 · Lịch sử gửi', title: 'Lịch sử đơn hàng đã gửi', Icon: History },
    ],
  },
  {
    key: 'OPERATOR',
    label: 'Vận hành (S10–S13)',
    defaultScreen: 'S10',
    screens: [
      { id: 'S10', shortLabel: 'S10 · H.thống', label: 'S10 · Trạng thái hệ thống', title: 'Quản lý trạng thái hệ thống', Icon: Activity },
      { id: 'S11', shortLabel: 'S11 · Sơ đồ', label: 'S11 · Sơ đồ Tủ & Ngăn', title: 'Danh sách tủ & Sơ đồ ngăn trực quan', Icon: Grid2x2 },
      { id: 'S12', shortLabel: 'S12 · Sự cố', label: 'S12 · Đơn & Sự cố', title: 'Quản lý đơn hàng & Hỗ trợ sự cố', Icon: ClipboardList },
      { id: 'S13', shortLabel: 'S13 · Log', label: 'S13 · Nhật ký thao tác', title: 'Nhật ký thao tác (Audit Log)', Icon: FileText },
    ],
  },
  {
    key: 'ADMIN',
    label: 'Admin (S14–S15)',
    defaultScreen: 'S14',
    screens: [
      { id: 'S14', shortLabel: 'S14 · User', label: 'S14 · Tài khoản', title: 'Quản lý tài khoản người dùng', Icon: Users },
      { id: 'S15', shortLabel: 'S15 · Tủ/Ngăn', label: 'S15 · Cấu hình Tủ', title: 'Quản lý cấu hình Tủ & Ngăn', Icon: Settings },
    ],
  },
];

function findGroupByScreen(screenId) {
  return ROLE_GROUPS.find((g) => g.screens.some((s) => s.id === screenId)) || ROLE_GROUPS[0];
}

function getDefaultScreenForRole(role) {
  if (role === 'RECIPIENT') return 'S5';
  if (role === 'COURIER') return 'S7';
  if (role === 'OPERATOR') return 'S10';
  if (role === 'ADMIN') return 'S14';
  return 'S1';
}

export default function App() {
  const theme = DESIGN_THEMES.navyWarm3d;
  const [viewportMode, setViewportMode] = useState('desktop');

  // === DỮ LIỆU THẬT TỪ BACKEND (M6: S1–S9) ===
  const [currentUser, setCurrentUser] = useState(() => (getSavedToken() ? getSavedUser() : null));
  const [activeScreen, setActiveScreen] = useState(() => {
    const saved = getSavedToken() ? getSavedUser() : null;
    return saved ? getDefaultScreenForRole(saved.role) : 'S1';
  });
  const [sessionNotice, setSessionNotice] = useState('');
  const [apiError, setApiError] = useState('');

  const [realLockers, setRealLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(false);

  const [realDeliveries, setRealDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [pendingDelivery, setPendingDelivery] = useState(null);

  // === DỮ LIỆU XEM TRƯỚC CHO S10–S15 (sẽ nối API thật ở M7) ===
  const [mockUsers, setMockUsers] = useState(INITIAL_USERS);
  const [mockLockers, setMockLockers] = useState(INITIAL_LOCKERS);
  const [mockDeliveries, setMockDeliveries] = useState(INITIAL_DELIVERIES);
  const [mockAuditLogs, setMockAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [selectedLockerForMap, setSelectedLockerForMap] = useState('L01');

  const activeGroup = findGroupByScreen(activeScreen);
  const activeScreenMeta = activeGroup.screens.find((s) => s.id === activeScreen);

  // Tải danh sách tủ thật (GET /api/lockers)
  const loadRealLockers = useCallback(async () => {
    if (!getSavedToken()) return;
    setLockersLoading(true);
    setApiError('');
    try {
      const data = await lockerApi.list();
      setRealLockers(Array.isArray(data) ? data : []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLockersLoading(false);
    }
  }, []);

  // Tải danh sách đơn của tài khoản đang đăng nhập (GET /api/deliveries/my)
  const loadRealDeliveries = useCallback(async () => {
    if (!getSavedToken()) return;
    setDeliveriesLoading(true);
    setApiError('');
    try {
      const data = await deliveryApi.myList();
      const list = Array.isArray(data) ? data : [];
      setRealDeliveries(list);
      setSelectedDeliveryId((prev) => {
        if (prev && list.some((d) => d.id === prev)) return prev;
        return list.find((d) => d.status === 'READY')?.id || list[0]?.id || null;
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setDeliveriesLoading(false);
    }
  }, []);

  // Đăng ký hàm xử lý khi JWT hết hạn (401)
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setCurrentUser(null);
      setRealDeliveries([]);
      setRealLockers([]);
      setPendingDelivery(null);
      setSessionNotice(msg || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setActiveScreen('S1');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Kiểm tra phiên đã lưu khi tải lại trang
  useEffect(() => {
    if (!getSavedToken()) return;
    authApi
      .me()
      .then((user) => {
        setCurrentUser(user);
        saveSession(getSavedToken(), user);
      })
      .catch(() => {
        // 401 đã được unauthorizedHandler xử lý
      });
  }, []);

  // Tự tải lại dữ liệu thật mỗi khi người dùng chuyển màn hình S5–S9
  useEffect(() => {
    if (!currentUser) return;
    if (['S5', 'S6', 'S9'].includes(activeScreen)) {
      loadRealDeliveries();
    }
    if (activeScreen === 'S7') {
      loadRealLockers();
    }
  }, [activeScreen, currentUser, loadRealDeliveries, loadRealLockers]);

  // Đăng nhập thành công từ S1
  const handleAuthSuccess = (token, user) => {
    saveSession(token, user);
    setCurrentUser(user);
    setSessionNotice('');
    setApiError('');
    setPendingDelivery(null);
    setActiveScreen(getDefaultScreenForRole(user.role));
  };

  // Đăng xuất từ S4
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setRealDeliveries([]);
    setRealLockers([]);
    setPendingDelivery(null);
    setSessionNotice('Bạn đã đăng xuất thành công.');
    setActiveScreen('S1');
  };

  // === HANDLER TẠM CHO S10–S15 (M7 sẽ thay bằng API thật) ===
  const appendMockLog = (action, detail, customActor, customRole) => {
    setMockAuditLogs((prev) => [
      {
        id: prev.length ? prev[0].id + 1 : 1,
        time: getNowLabel(),
        actor: customActor || currentUser?.fullName || 'Vận hành',
        role: customRole || currentUser?.role || 'OPERATOR',
        action,
        detail,
      },
      ...prev,
    ]);
  };

  const handleMockManualOpen = (lockerId, compNumber, reason) => {
    appendMockLog('MANUAL_OPEN', `Mở thủ công ${lockerId} · Ngăn #${compNumber} — Lý do: ${reason}`, 'Trần Ngọc Lan', 'OPERATOR');
  };

  const handleMockToggleFault = (lockerId, compNumber) => {
    setMockLockers((prev) =>
      prev.map((l) =>
        l.id !== lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) =>
                c.number === compNumber ? { ...c, status: c.status === 'FAULT' ? 'FREE' : 'FAULT' } : c
              ),
            }
      )
    );
    appendMockLog('COMPARTMENT_STATUS', `Cập nhật trạng thái lỗi/trống cho ${lockerId} · Ngăn #${compNumber}.`, 'Trần Ngọc Lan', 'OPERATOR');
  };

  const handleMockToggleOnline = (lockerId) => {
    setMockLockers((prev) =>
      prev.map((l) =>
        l.id !== lockerId
          ? l
          : {
              ...l,
              status: l.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE',
              lastHeartbeat: l.status === 'ONLINE' ? 'Mất 3 heartbeat liên tiếp' : 'Vừa kết nối lại',
            }
      )
    );
    appendMockLog('LOCKER_HEARTBEAT', `Thay đổi trạng thái kết nối tủ ${lockerId}.`, 'Hệ thống (MQTT)', 'SYSTEM');
  };

  const handleMockResetOtp = (deliveryId) => {
    const fresh = generateDemoOtp();
    setMockDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, otpCode: fresh, otpExpired: false, failedAttempts: 0, locked: false, otpRemaining: '24 giờ 00 phút' }
          : d
      )
    );
    appendMockLog('OTP_RESEND', `Cấp lại mã OTP mới cho đơn ${deliveryId}.`, 'Trần Ngọc Lan', 'OPERATOR');
    return fresh;
  };

  const handleMockReleaseExpired = (deliveryId) => {
    setMockDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId ? { ...d, status: 'PICKED_UP', otpCode: '------', otpExpired: true } : d
      )
    );
    appendMockLog('EXPIRED_RELEASE', `Thu hồi hàng quá hạn 72h cho đơn ${deliveryId}.`, 'Trần Ngọc Lan', 'OPERATOR');
  };

  const handleMockCreateUser = (data) => {
    setMockUsers((prev) => [{ id: prev.length + 1, ...data, active: true, createdAt: getNowLabel() }, ...prev]);
    appendMockLog('ADMIN_USER_CREATE', `Tạo tài khoản ${data.email} (${data.role}).`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleMockChangeRole = (userId, nextRole) => {
    const u = mockUsers.find((x) => x.id === userId);
    setMockUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, role: nextRole } : x)));
    appendMockLog('ADMIN_USER_UPDATE', `Đổi vai trò của ${u?.email} sang ${nextRole}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleMockToggleActive = (userId) => {
    const u = mockUsers.find((x) => x.id === userId);
    setMockUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, active: !x.active } : x)));
    appendMockLog('ADMIN_USER_LOCK', `${u?.active ? 'Khóa' : 'Mở khóa'} tài khoản ${u?.email}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleMockAddLocker = ({ id, name, location }) => {
    setMockLockers((prev) => [
      ...prev,
      {
        id,
        name,
        location,
        status: 'ONLINE',
        lastHeartbeat: 'Vừa thêm mới',
        compartments: [
          { number: 1, size: 'SMALL', status: 'FREE' },
          { number: 2, size: 'SMALL', status: 'FREE' },
          { number: 3, size: 'MEDIUM', status: 'FREE' },
          { number: 4, size: 'MEDIUM', status: 'FREE' },
          { number: 5, size: 'LARGE', status: 'FREE' },
          { number: 6, size: 'LARGE', status: 'FREE' },
        ],
      },
    ]);
    appendMockLog('ADMIN_LOCKER_CREATE', `Thêm tủ mới ${id} (${name}).`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleMockUpdateCompSize = (lockerId, compNumber, size) => {
    setMockLockers((prev) =>
      prev.map((l) =>
        l.id !== lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) => (c.number === compNumber ? { ...c, size } : c)),
            }
      )
    );
  };

  const handleMockAddComp = (lockerId) => {
    setMockLockers((prev) =>
      prev.map((l) => {
        if (l.id !== lockerId || l.compartments.length >= 9) return l;
        return {
          ...l,
          compartments: [...l.compartments, { number: l.compartments.length + 1, size: 'MEDIUM', status: 'FREE' }],
        };
      })
    );
  };

  // Kiểm tra quyền truy cập nhanh cho S5–S9
  const isAuthRequiredScreen = ['S5', 'S6', 'S7', 'S8', 'S9'].includes(activeScreen);
  const isCourierScreen = ['S7', 'S8', 'S9'].includes(activeScreen);
  const isRecipientScreen = ['S5', 'S6'].includes(activeScreen);
  const isPreviewM7Screen = ['S10', 'S11', 'S12', 'S13', 'S14', 'S15'].includes(activeScreen);

  const wrongRoleForCourier = isCourierScreen && currentUser && currentUser.role !== 'COURIER';
  const wrongRoleForRecipient = isRecipientScreen && currentUser && currentUser.role !== 'RECIPIENT';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${viewportMode === 'mobile' ? 'pb-6' : 'pb-20 md:pb-10'} ${theme.pageBg}`}>
      {/* Thanh duyệt nhanh 5 nhóm vai trò + Nút xem Máy tính / Điện thoại */}
      <div className="bg-[#0B1120] text-blue-100 border-b border-blue-950 px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLE_GROUPS.map((g) => {
              const isCurrentGroup = activeGroup.key === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveScreen(g.defaultScreen)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    isCurrentGroup
                      ? 'bg-[#EA580C] text-white shadow-sm'
                      : 'bg-[#172554] text-blue-200 hover:text-white border border-blue-900'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="inline-flex rounded-lg bg-[#172554] border border-blue-900 p-0.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-semibold cursor-pointer ${
                viewportMode === 'desktop' ? 'bg-[#EA580C] text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
              Máy tính
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1 font-semibold cursor-pointer ${
                viewportMode === 'mobile' ? 'bg-[#EA580C] text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
              Điện thoại
            </button>
          </div>
        </div>
      </div>

      {/* Khung ứng dụng chính có @container */}
      <div
        className={`@container flex-1 flex flex-col mx-auto w-full transition-all duration-200 ${
          viewportMode === 'mobile'
            ? `max-w-[400px] h-[780px] max-h-[82vh] my-4 rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden ${theme.pageBg}`
            : ''
        }`}
      >
        {/* Header Navy Đậm */}
        <header className={`sticky top-0 z-20 shrink-0 backdrop-blur ${theme.headerBg}`}>
          <div className="max-w-6xl mx-auto px-4 @2xl:px-6 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.png"
                alt="Logo Smart Locker"
                className="w-10 h-10 object-contain shrink-0 drop-shadow-sm"
              />
              <div className="min-w-0">
                <div className={`font-extrabold text-base leading-tight truncate ${theme.headerHeading}`}>Smart Locker</div>
                <div className={`text-xs truncate ${theme.headerMuted}`}>PWA · Kết nối Backend &amp; Wokwi thật</div>
              </div>
            </div>

            {viewportMode === 'desktop' && (
              <nav className="hidden @4xl:flex items-center gap-1.5" aria-label="Điều hướng màn hình">
                {activeGroup.screens.map(({ id, label, Icon }) => {
                  const isActive = activeScreen === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveScreen(id)}
                      className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                        isActive ? theme.navActive : theme.navIdle
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            <button
              type="button"
              onClick={() => setActiveScreen(currentUser ? 'S4' : 'S1')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${theme.headerPill}`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              {currentUser ? ROLE_LABELS[currentUser.role] || currentUser.role : 'Đăng nhập'}
            </button>
          </div>
        </header>

        {/* Nội dung chính */}
        <main
          className={`flex-1 max-w-6xl w-full mx-auto px-4 @2xl:px-6 py-5 space-y-5 ${
            viewportMode === 'mobile' ? 'overflow-y-auto' : ''
          }`}
        >
          <div className="flex flex-col @2xl:flex-row @2xl:items-end justify-between gap-2">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
                {activeGroup.label} · {activeScreen}
              </span>
              <h1 className={`text-xl @2xl:text-2xl font-extrabold tracking-tight mt-0.5 ${theme.heading}`}>
                {activeScreenMeta?.title}
              </h1>
            </div>
            <p className={`text-xs hidden @2xl:block ${theme.mutedText}`}>
              {currentUser ? (
                <>
                  Đang đăng nhập: <strong>{currentUser.fullName}</strong> ({currentUser.username})
                </>
              ) : (
                'Chưa đăng nhập'
              )}
            </p>
          </div>

          {apiError && isAuthRequiredScreen && (
            <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </span>
              <button
                type="button"
                onClick={() => {
                  setApiError('');
                  if (activeScreen === 'S7') loadRealLockers();
                  else loadRealDeliveries();
                }}
                className="underline font-bold cursor-pointer shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}

          {isPreviewM7Screen && (
            <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
              Màn hình Vận hành &amp; Admin (S10–S15) hiện đang hiển thị dữ liệu xem trước — sẽ nối API thật ở <strong>Mốc M7</strong>. Các màn hình <strong>S1–S9</strong> đã nối API thật tới Backend &amp; Wokwi.
            </div>
          )}

          {/* Chưa đăng nhập mà vào S5–S9 */}
          {isAuthRequiredScreen && !currentUser && (
            <div className={`${theme.card} p-8 text-center space-y-3`}>
              <h2 className={`text-base font-bold ${theme.heading}`}>Bạn cần đăng nhập để dùng chức năng này</h2>
              <p className={`text-xs ${theme.mutedText}`}>
                Hãy đăng nhập bằng tài khoản <strong>Người nhận</strong> (cho S5–S6) hoặc <strong>Shipper</strong> (cho S7–S9).
              </p>
              <button
                type="button"
                onClick={() => setActiveScreen('S1')}
                className={`min-h-[44px] px-5 py-2.5 text-sm font-bold cursor-pointer ${theme.primaryBtn}`}
              >
                Đi tới trang Đăng nhập (S1)
              </button>
            </div>
          )}

          {/* Sai vai trò cho S5–S6 hoặc S7–S9 */}
          {wrongRoleForCourier && (
            <div className={`${theme.card} p-6 text-center space-y-3`}>
              <h2 className={`text-base font-bold ${theme.heading}`}>Màn hình này dành cho Shipper (COURIER)</h2>
              <p className={`text-xs ${theme.mutedText}`}>
                Bạn đang đăng nhập là <strong>{ROLE_LABELS[currentUser.role]}</strong>. Hãy chuyển sang tài khoản <code>courier</code> để tạo đơn và mở ngăn tủ thật.
              </p>
              <button
                type="button"
                onClick={() => setActiveScreen('S1')}
                className={`min-h-[44px] px-5 py-2.5 text-sm font-bold cursor-pointer ${theme.primaryBtn}`}
              >
                Đổi tài khoản Shipper tại S1
              </button>
            </div>
          )}

          {wrongRoleForRecipient && (
            <div className={`${theme.card} p-6 text-center space-y-3`}>
              <h2 className={`text-base font-bold ${theme.heading}`}>Màn hình này dành cho Người nhận (RECIPIENT)</h2>
              <p className={`text-xs ${theme.mutedText}`}>
                Bạn đang đăng nhập là <strong>{ROLE_LABELS[currentUser.role]}</strong>. Hãy chuyển sang tài khoản <code>recipient</code> để xem đơn và nhập mã OTP lấy hàng.
              </p>
              <button
                type="button"
                onClick={() => setActiveScreen('S1')}
                className={`min-h-[44px] px-5 py-2.5 text-sm font-bold cursor-pointer ${theme.primaryBtn}`}
              >
                Đổi tài khoản Người nhận tại S1
              </button>
            </div>
          )}

          {/* S1–S4: Tài khoản (API thật) */}
          {['S1', 'S2', 'S3', 'S4'].includes(activeScreen) && (
            <ScreenAuthBundle
              screenId={activeScreen}
              theme={theme}
              currentUser={currentUser}
              sessionNotice={sessionNotice}
              onAuthSuccess={handleAuthSuccess}
              onLogout={handleLogout}
              onNavigateScreen={setActiveScreen}
            />
          )}

          {/* S5: Đơn của tôi (Người nhận — API thật) */}
          {activeScreen === 'S5' && currentUser?.role === 'RECIPIENT' && (
            <ScreenS5RecipientOrders
              theme={theme}
              deliveries={realDeliveries}
              loading={deliveriesLoading}
              onRefresh={loadRealDeliveries}
              onOpenOrderOtp={(orderId) => {
                setSelectedDeliveryId(orderId);
                setActiveScreen('S6');
              }}
            />
          )}

          {/* S6: Nhập OTP & Mở ngăn (Người nhận — API thật + Wokwi MQTT) */}
          {activeScreen === 'S6' && currentUser?.role === 'RECIPIENT' && (
            <ScreenS6OtpPickup
              theme={theme}
              deliveries={realDeliveries}
              selectedDeliveryId={selectedDeliveryId}
              onSelectDelivery={setSelectedDeliveryId}
              onRefreshDeliveries={loadRealDeliveries}
            />
          )}

          {/* S7: Chọn tủ & Tạo đơn gửi (Shipper — API thật) */}
          {activeScreen === 'S7' && currentUser?.role === 'COURIER' && (
            <ScreenS7ShipperDropoff
              theme={theme}
              lockers={realLockers}
              loading={lockersLoading}
              onRefreshLockers={loadRealLockers}
              onDeliveryCreated={(created) => {
                setPendingDelivery(created);
                setActiveScreen('S8');
              }}
            />
          )}

          {/* S8: Theo dõi mở/đóng cửa Wokwi sau khi cấp ngăn (Shipper — API thật) */}
          {activeScreen === 'S8' && currentUser?.role === 'COURIER' && (
            <ScreenS8ConfirmDropoff
              theme={theme}
              pendingDelivery={pendingDelivery}
              onCompleted={() => {
                loadRealDeliveries();
                loadRealLockers();
              }}
              onGoToS7={() => {
                setPendingDelivery(null);
                setActiveScreen('S7');
              }}
              onGoToS9={() => {
                setPendingDelivery(null);
                setActiveScreen('S9');
              }}
            />
          )}

          {/* S9: Lịch sử đơn đã gửi (Shipper — API thật) */}
          {activeScreen === 'S9' && currentUser?.role === 'COURIER' && (
            <ScreenS9ShipperHistory
              theme={theme}
              deliveries={realDeliveries}
              loading={deliveriesLoading}
              onRefresh={loadRealDeliveries}
              onGoToS7={() => setActiveScreen('S7')}
            />
          )}

          {/* S10–S15: Xem trước (nối API thật ở M7) */}
          {activeScreen === 'S10' && (
            <ScreenS10SystemStatus
              theme={theme}
              lockers={mockLockers}
              deliveries={mockDeliveries}
              onGoToLockerMap={(lockerId) => {
                setSelectedLockerForMap(lockerId);
                setActiveScreen('S11');
              }}
              onGoToOrders={() => setActiveScreen('S12')}
            />
          )}

          {activeScreen === 'S11' && (
            <ScreenS11LockerMap
              theme={theme}
              lockers={mockLockers}
              deliveries={mockDeliveries}
              initialLockerId={selectedLockerForMap}
              onManualOpen={handleMockManualOpen}
              onToggleCompartmentFault={handleMockToggleFault}
              onToggleLockerOnline={handleMockToggleOnline}
            />
          )}

          {activeScreen === 'S12' && (
            <ScreenS12OperatorOrders
              theme={theme}
              deliveries={mockDeliveries}
              onOperatorResetOtp={handleMockResetOtp}
              onOperatorReleaseExpired={handleMockReleaseExpired}
            />
          )}

          {activeScreen === 'S13' && <ScreenS13AuditLog theme={theme} auditLogs={mockAuditLogs} />}

          {activeScreen === 'S14' && (
            <ScreenS14AdminUsers
              theme={theme}
              users={mockUsers}
              onCreateUser={handleMockCreateUser}
              onChangeRole={handleMockChangeRole}
              onToggleActive={handleMockToggleActive}
            />
          )}

          {activeScreen === 'S15' && (
            <ScreenS15AdminLockers
              theme={theme}
              lockers={mockLockers}
              onAddLocker={handleMockAddLocker}
              onUpdateCompartmentSize={handleMockUpdateCompSize}
              onAddCompartment={handleMockAddComp}
            />
          )}
        </main>

        {/* Thanh điều hướng dưới cùng cho nhóm màn hình hiện tại (tối đa 4 mục) */}
        <nav
          style={{ gridTemplateColumns: `repeat(${activeGroup.screens.length}, minmax(0, 1fr))` }}
          className={`${viewportMode === 'mobile' ? 'grid shrink-0' : '@4xl:hidden fixed bottom-0 inset-x-0 grid'} z-20 ${theme.bottomNavBg}`}
          aria-label="Điều hướng di động"
        >
          {activeGroup.screens.map(({ id, shortLabel, Icon }) => {
            const isActive = activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveScreen(id)}
                className={`min-h-[56px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  isActive ? theme.bottomNavActive : theme.bottomNavIdle
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
