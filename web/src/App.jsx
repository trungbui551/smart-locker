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
  adminApi,
  authApi,
  clearSession,
  deliveryApi,
  getSavedToken,
  getSavedUser,
  lockerApi,
  operatorApi,
  saveSession,
  setUnauthorizedHandler,
} from './api/client';
import { ROLE_LABELS } from './data/mockData';
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

// Chế độ ứng dụng: 'web' (đủ 15 màn hình), 'mobile' (Android Capacitor: S1–S9), 'desktop' (Electron: S1–S4 & S10–S15)
const APP_MODE = import.meta.env.VITE_APP_MODE || 'web';
const IS_MOBILE_APP = APP_MODE === 'mobile';
const IS_DESKTOP_APP = APP_MODE === 'desktop';

// Nhóm màn hình theo đúng 5 nhóm trong docs/design-spec.md (đủ 15 màn hình S1–S15 nối API thật)
const ALL_ROLE_GROUPS = [
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

// Lọc nhóm màn hình theo nền tảng: Mobile Android chỉ hiện S1–S9; Desktop Electron chỉ hiện S1–S4 & S10–S15
const ROLE_GROUPS = IS_MOBILE_APP
  ? ALL_ROLE_GROUPS.filter((g) => ['AUTH', 'RECIPIENT', 'COURIER'].includes(g.key))
  : IS_DESKTOP_APP
  ? ALL_ROLE_GROUPS.filter((g) => ['AUTH', 'OPERATOR', 'ADMIN'].includes(g.key))
  : ALL_ROLE_GROUPS;

function findGroupByScreen(screenId) {
  return ROLE_GROUPS.find((g) => g.screens.some((s) => s.id === screenId)) || ROLE_GROUPS[0];
}

function getDefaultScreenForRole(role) {
  if (IS_MOBILE_APP) {
    if (role === 'RECIPIENT') return 'S5';
    if (role === 'COURIER') return 'S7';
    return 'S4';
  }
  if (IS_DESKTOP_APP) {
    if (role === 'OPERATOR') return 'S10';
    if (role === 'ADMIN') return 'S14';
    return 'S4';
  }
  if (role === 'RECIPIENT') return 'S5';
  if (role === 'COURIER') return 'S7';
  if (role === 'OPERATOR') return 'S10';
  if (role === 'ADMIN') return 'S14';
  return 'S1';
}

export default function App() {
  const theme = DESIGN_THEMES.navyWarm3d;
  const [viewportMode, setViewportMode] = useState('desktop');

  // === DỮ LIỆU THẬT 100% TỪ BACKEND (đủ 15 màn hình S1–S15) ===
  const [currentUser, setCurrentUser] = useState(() => (getSavedToken() ? getSavedUser() : null));
  const [activeScreen, setActiveScreen] = useState(() => {
    const saved = getSavedToken() ? getSavedUser() : null;
    return saved ? getDefaultScreenForRole(saved.role) : 'S1';
  });
  const [sessionNotice, setSessionNotice] = useState('');
  const [apiError, setApiError] = useState('');

  const [lockers, setLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(false);

  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [pendingDelivery, setPendingDelivery] = useState(null);

  const [systemStatus, setSystemStatus] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedLockerForMap, setSelectedLockerForMap] = useState('L01');

  const activeGroup = findGroupByScreen(activeScreen);
  const activeScreenMeta = activeGroup.screens.find((s) => s.id === activeScreen);

  const loadLockers = useCallback(async (silent = false) => {
    if (!getSavedToken()) return;
    if (!silent) setLockersLoading(true);
    try {
      const data = await lockerApi.list();
      setLockers(Array.isArray(data) ? data : []);
      setApiError('');
    } catch (err) {
      if (!silent) setApiError(err.message);
    } finally {
      if (!silent) setLockersLoading(false);
    }
  }, []);

  const loadDeliveries = useCallback(async (silent = false) => {
    if (!getSavedToken()) return;
    if (!silent) setDeliveriesLoading(true);
    try {
      const data = await deliveryApi.myList();
      const list = Array.isArray(data) ? data : [];
      setDeliveries(list);
      setSelectedDeliveryId((prev) => {
        if (prev && list.some((d) => d.id === prev)) return prev;
        return list.find((d) => d.status === 'READY')?.id || list[0]?.id || null;
      });
      setApiError('');
    } catch (err) {
      if (!silent) setApiError(err.message);
    } finally {
      if (!silent) setDeliveriesLoading(false);
    }
  }, []);

  const loadSystemDashboard = useCallback(
    async (silent = false) => {
      if (!getSavedToken()) return;
      if (!silent) setSystemLoading(true);
      try {
        const [statusData, lockerData, deliveryData] = await Promise.all([
          operatorApi.systemStatus(),
          lockerApi.list(),
          deliveryApi.myList(),
        ]);
        setSystemStatus(statusData);
        setLockers(Array.isArray(lockerData) ? lockerData : []);
        setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);
        setApiError('');
      } catch (err) {
        if (!silent) setApiError(err.message);
      } finally {
        if (!silent) setSystemLoading(false);
      }
    },
    []
  );

  const loadAuditLogs = useCallback(async () => {
    if (!getSavedToken()) return;
    setAuditLoading(true);
    try {
      const data = await operatorApi.auditLogs();
      setAuditLogs(Array.isArray(data) ? data : []);
      setApiError('');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadAdminUsers = useCallback(async () => {
    if (!getSavedToken()) return;
    setUsersLoading(true);
    try {
      const data = await adminApi.listUsers();
      setAdminUsers(Array.isArray(data) ? data : []);
      setApiError('');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Xử lý tự động khi JWT hết hạn (401)
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setCurrentUser(null);
      setDeliveries([]);
      setLockers([]);
      setSystemStatus(null);
      setAuditLogs([]);
      setAdminUsers([]);
      setPendingDelivery(null);
      setSessionNotice(msg || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      setActiveScreen('S1');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Kiểm tra phiên lưu sẵn khi tải lại trang
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

  // Tự tải dữ liệu thật mỗi khi đổi màn hình
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;

    if (['S5', 'S6'].includes(activeScreen) && role === 'RECIPIENT') {
      loadDeliveries();
    } else if (activeScreen === 'S7' && role === 'COURIER') {
      loadLockers();
    } else if (activeScreen === 'S9' && role === 'COURIER') {
      loadDeliveries();
    } else if (activeScreen === 'S10' && (role === 'OPERATOR' || role === 'ADMIN')) {
      loadSystemDashboard();
    } else if (activeScreen === 'S11' && (role === 'OPERATOR' || role === 'ADMIN')) {
      loadLockers();
      loadDeliveries(true);
    } else if (activeScreen === 'S12' && (role === 'OPERATOR' || role === 'ADMIN')) {
      loadDeliveries();
    } else if (activeScreen === 'S13' && (role === 'OPERATOR' || role === 'ADMIN')) {
      loadAuditLogs();
    } else if (activeScreen === 'S14' && role === 'ADMIN') {
      loadAdminUsers();
    } else if (activeScreen === 'S15' && role === 'ADMIN') {
      loadLockers();
    }
  }, [
    activeScreen,
    currentUser,
    loadAdminUsers,
    loadAuditLogs,
    loadDeliveries,
    loadLockers,
    loadSystemDashboard,
  ]);

  const handleAuthSuccess = (token, user) => {
    saveSession(token, user);
    setCurrentUser(user);
    setSessionNotice('');
    setApiError('');
    setPendingDelivery(null);
    setActiveScreen(getDefaultScreenForRole(user.role));
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setDeliveries([]);
    setLockers([]);
    setSystemStatus(null);
    setAuditLogs([]);
    setAdminUsers([]);
    setPendingDelivery(null);
    setSessionNotice('Bạn đã đăng xuất thành công.');
    setActiveScreen('S1');
  };

  // Kiểm tra phân quyền hiển thị rõ ràng trước khi gọi API
  const isProtectedScreen = !['S1', 'S2', 'S3', 'S4'].includes(activeScreen);
  const isRecipientScreen = ['S5', 'S6'].includes(activeScreen);
  const isCourierScreen = ['S7', 'S8', 'S9'].includes(activeScreen);
  const isOperatorScreen = ['S10', 'S11', 'S12', 'S13'].includes(activeScreen);
  const isAdminScreen = ['S14', 'S15'].includes(activeScreen);

  const roleMismatchMsg = (() => {
    if (!currentUser || !isProtectedScreen) return '';
    if (isRecipientScreen && currentUser.role !== 'RECIPIENT') {
      return 'Màn hình này dành cho Người nhận (RECIPIENT). Hãy đổi sang tài khoản recipient tại S1.';
    }
    if (isCourierScreen && currentUser.role !== 'COURIER') {
      return 'Màn hình này dành cho Shipper (COURIER). Hãy đổi sang tài khoản courier tại S1.';
    }
    if (isOperatorScreen && currentUser.role !== 'OPERATOR' && currentUser.role !== 'ADMIN') {
      return 'Màn hình này dành cho Nhân viên vận hành (OPERATOR) hoặc Admin. Hãy đổi tài khoản tại S1.';
    }
    if (isAdminScreen && currentUser.role !== 'ADMIN') {
      return 'Màn hình này chỉ dành cho Quản trị viên (ADMIN). Hãy đổi sang tài khoản admin tại S1.';
    }
    return '';
  })();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${viewportMode === 'mobile' ? 'pb-6' : 'pb-20 md:pb-10'} ${theme.pageBg}`}>
      {/* Thanh duyệt nhanh nhóm vai trò: ẩn hẳn trên App Android để giao diện gọn như app gốc */}
      {!IS_MOBILE_APP && (
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

          {!IS_DESKTOP_APP && (
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
          )}
        </div>
      </div>
      )}

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
                <div className={`text-xs truncate ${theme.headerMuted}`}>15 màn hình · Kết nối Backend &amp; Wokwi thật</div>
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

          {apiError && isProtectedScreen && !roleMismatchMsg && (
            <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {apiError}
              </span>
              <button
                type="button"
                onClick={() => setApiError('')}
                className="underline font-bold cursor-pointer shrink-0"
              >
                Ẩn
              </button>
            </div>
          )}

          {/* Chưa đăng nhập mà vào màn hình cần xác thực */}
          {isProtectedScreen && !currentUser && (
            <div className={`${theme.card} p-8 text-center space-y-3`}>
              <h2 className={`text-base font-bold ${theme.heading}`}>Bạn cần đăng nhập để dùng chức năng này</h2>
              <p className={`text-xs ${theme.mutedText}`}>
                Chọn nhanh một trong 4 tài khoản mẫu (<code>recipient</code>, <code>courier</code>, <code>operator</code>, <code>admin</code>) tại màn hình Đăng nhập.
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

          {/* Sai vai trò */}
          {roleMismatchMsg && (
            <div className={`${theme.card} p-6 text-center space-y-3`}>
              <h2 className={`text-base font-bold ${theme.heading}`}>Tài khoản hiện tại không thuộc nhóm màn hình này</h2>
              <p className={`text-xs ${theme.mutedText}`}>{roleMismatchMsg}</p>
              <button
                type="button"
                onClick={() => setActiveScreen('S1')}
                className={`min-h-[44px] px-5 py-2.5 text-sm font-bold cursor-pointer ${theme.primaryBtn}`}
              >
                Đổi tài khoản tại S1
              </button>
            </div>
          )}

          {/* S1–S4: Tài khoản */}
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

          {/* S5–S6: Người nhận */}
          {activeScreen === 'S5' && currentUser?.role === 'RECIPIENT' && (
            <ScreenS5RecipientOrders
              theme={theme}
              deliveries={deliveries}
              loading={deliveriesLoading}
              onRefresh={() => loadDeliveries()}
              onOpenOrderOtp={(orderId) => {
                setSelectedDeliveryId(orderId);
                setActiveScreen('S6');
              }}
            />
          )}

          {activeScreen === 'S6' && currentUser?.role === 'RECIPIENT' && (
            <ScreenS6OtpPickup
              theme={theme}
              deliveries={deliveries}
              selectedDeliveryId={selectedDeliveryId}
              onSelectDelivery={setSelectedDeliveryId}
              onRefreshDeliveries={() => loadDeliveries()}
            />
          )}

          {/* S7–S9: Shipper */}
          {activeScreen === 'S7' && currentUser?.role === 'COURIER' && (
            <ScreenS7ShipperDropoff
              theme={theme}
              lockers={lockers}
              loading={lockersLoading}
              onRefreshLockers={() => loadLockers()}
              onDeliveryCreated={(created) => {
                setPendingDelivery(created);
                setActiveScreen('S8');
              }}
            />
          )}

          {activeScreen === 'S8' && currentUser?.role === 'COURIER' && (
            <ScreenS8ConfirmDropoff
              theme={theme}
              pendingDelivery={pendingDelivery}
              onCompleted={() => {
                loadDeliveries(true);
                loadLockers(true);
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

          {activeScreen === 'S9' && currentUser?.role === 'COURIER' && (
            <ScreenS9ShipperHistory
              theme={theme}
              deliveries={deliveries}
              loading={deliveriesLoading}
              onRefresh={() => loadDeliveries()}
              onGoToS7={() => setActiveScreen('S7')}
            />
          )}

          {/* S10–S13: Vận hành (OPERATOR hoặc ADMIN — 100% API thật) */}
          {activeScreen === 'S10' && (currentUser?.role === 'OPERATOR' || currentUser?.role === 'ADMIN') && (
            <ScreenS10SystemStatus
              theme={theme}
              systemStatus={systemStatus}
              lockers={lockers}
              deliveries={deliveries}
              loading={systemLoading}
              onRefresh={loadSystemDashboard}
              onGoToLockerMap={(lockerId) => {
                setSelectedLockerForMap(lockerId);
                setActiveScreen('S11');
              }}
              onGoToOrders={() => setActiveScreen('S12')}
            />
          )}

          {activeScreen === 'S11' && (currentUser?.role === 'OPERATOR' || currentUser?.role === 'ADMIN') && (
            <ScreenS11LockerMap
              theme={theme}
              lockers={lockers}
              deliveries={deliveries}
              initialLockerId={selectedLockerForMap}
              loading={lockersLoading}
              onRefresh={() => {
                loadLockers();
                loadDeliveries(true);
              }}
            />
          )}

          {activeScreen === 'S12' && (currentUser?.role === 'OPERATOR' || currentUser?.role === 'ADMIN') && (
            <ScreenS12OperatorOrders
              theme={theme}
              deliveries={deliveries}
              loading={deliveriesLoading}
              onRefresh={() => loadDeliveries()}
            />
          )}

          {activeScreen === 'S13' && (currentUser?.role === 'OPERATOR' || currentUser?.role === 'ADMIN') && (
            <ScreenS13AuditLog
              theme={theme}
              auditLogs={auditLogs}
              loading={auditLoading}
              onRefresh={loadAuditLogs}
            />
          )}

          {/* S14–S15: Admin (chỉ ADMIN — 100% API thật) */}
          {activeScreen === 'S14' && currentUser?.role === 'ADMIN' && (
            <ScreenS14AdminUsers
              theme={theme}
              users={adminUsers}
              currentUserId={currentUser.id}
              loading={usersLoading}
              onRefresh={loadAdminUsers}
            />
          )}

          {activeScreen === 'S15' && currentUser?.role === 'ADMIN' && (
            <ScreenS15AdminLockers
              theme={theme}
              lockers={lockers}
              loading={lockersLoading}
              onRefresh={() => loadLockers()}
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
