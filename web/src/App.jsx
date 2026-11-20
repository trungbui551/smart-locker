import { useState } from 'react';
import {
  Activity,
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

export default function App() {
  const theme = DESIGN_THEMES.navyWarm3d;
  const [viewportMode, setViewportMode] = useState('desktop');
  const [activeScreen, setActiveScreen] = useState('S10');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[3]); // Mặc định Admin để xem nhanh
  const [lockers, setLockers] = useState(INITIAL_LOCKERS);
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(INITIAL_DELIVERIES[0].id);
  const [selectedLockerForMap, setSelectedLockerForMap] = useState('L01');
  const [pendingDropoff, setPendingDropoff] = useState(null);

  const activeGroup = findGroupByScreen(activeScreen);
  const activeScreenMeta = activeGroup.screens.find((s) => s.id === activeScreen);

  // Ghi thêm 1 dòng vào Nhật ký thao tác (S13) — không bao giờ ghi OTP/mật khẩu
  const appendAuditLog = (action, detail, customActor, customRole) => {
    setAuditLogs((prev) => [
      {
        id: prev.length ? prev[0].id + 1 : 1,
        time: getNowLabel(),
        actor: customActor || currentUser.fullName,
        role: customRole || currentUser.role,
        action,
        detail,
      },
      ...prev,
    ]);
  };

  // S1: Đăng nhập nhanh theo vai trò
  const handleLoginAsRole = (role) => {
    const found = users.find((u) => u.role === role) || users[0];
    setCurrentUser(found);
    appendAuditLog('LOGIN', `Đăng nhập thành công với vai trò ${ROLE_LABELS[role]}.`, found.fullName, role);
    if (role === 'RECIPIENT') setActiveScreen('S5');
    else if (role === 'COURIER') setActiveScreen('S7');
    else if (role === 'OPERATOR') setActiveScreen('S10');
    else setActiveScreen('S14');
  };

  // S2: Người nhận tự đăng ký (luôn ép cứng RECIPIENT)
  const handleRegisterRecipient = ({ fullName, username, email, phone }) => {
    const newUser = {
      id: users.length + 1,
      username,
      fullName,
      email,
      phone,
      role: 'RECIPIENT',
      active: true,
      createdAt: getNowLabel(),
    };
    setUsers((prev) => [newUser, ...prev]);
    appendAuditLog('REGISTER', `Tài khoản mới ${email} tự đăng ký (vai trò RECIPIENT).`, fullName, 'RECIPIENT');
  };

  // S7 -> S8: Cấp ngăn theo kích cỡ
  const handleAllocateAndOpen = ({
    lockerId,
    packageSize,
    recipientName,
    recipientContact,
    recipientPhone,
  }) => {
    const locker = lockers.find((l) => l.id === lockerId);
    if (!locker) return;
    const freeComp = locker.compartments.find((c) => c.status === 'FREE' && c.size === packageSize);
    if (!freeComp) return;

    setLockers((prev) =>
      prev.map((l) =>
        l.id !== lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) =>
                c.number === freeComp.number ? { ...c, status: 'OCCUPIED' } : c
              ),
            }
      )
    );

    setPendingDropoff({
      correlationId: `cmd-${Math.floor(10000 + Math.random() * 90000)}`,
      lockerId: locker.id,
      lockerName: locker.name,
      lockerLocation: locker.location,
      compartmentNumber: freeComp.number,
      packageSize,
      recipientName,
      recipientContact,
      recipientPhone,
    });
    setActiveScreen('S8');
  };

  const handleCancelDropoff = () => {
    if (!pendingDropoff) return;
    setLockers((prev) =>
      prev.map((l) =>
        l.id !== pendingDropoff.lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) =>
                c.number === pendingDropoff.compartmentNumber ? { ...c, status: 'FREE' } : c
              ),
            }
      )
    );
    appendAuditLog(
      'OPEN_TIMEOUT',
      `Quá 10s không nhận door_opened cho ${pendingDropoff.lockerId} · Ngăn #${pendingDropoff.compartmentNumber}.`,
      'Hệ thống (MQTT)',
      'SYSTEM'
    );
    setPendingDropoff(null);
  };

  const handleConfirmDoorClosed = () => {
    if (!pendingDropoff) return null;
    const newId = `DH-${1046 + deliveries.length}`;
    const newOrder = {
      id: newId,
      lockerId: pendingDropoff.lockerId,
      lockerName: pendingDropoff.lockerName,
      lockerLocation: pendingDropoff.lockerLocation,
      compartmentNumber: pendingDropoff.compartmentNumber,
      packageSize: pendingDropoff.packageSize,
      recipientName: pendingDropoff.recipientName,
      recipientContact: pendingDropoff.recipientContact,
      recipientPhone: pendingDropoff.recipientPhone,
      courierName: 'Phạm Quốc Hùng',
      status: 'READY',
      otpCode: generateDemoOtp(),
      otpExpired: false,
      failedAttempts: 0,
      locked: false,
      createdAt: 'Vừa xong',
      storageRemaining: '72 giờ 00 phút',
      otpRemaining: '24 giờ 00 phút',
      channels: { web: true, email: true, sms: true },
    };

    setDeliveries((prev) => [newOrder, ...prev]);
    setSelectedDeliveryId(newOrder.id);
    appendAuditLog(
      'ALLOCATE_COMPARTMENT',
      `Cấp ${newOrder.lockerId} · Ngăn #${newOrder.compartmentNumber} (${newOrder.packageSize}) cho đơn ${newOrder.id}; đã gửi OTP đa kênh.`,
      'Phạm Quốc Hùng',
      'COURIER'
    );
    setPendingDropoff(null);
    return newOrder;
  };

  // S6: Xác thực OTP
  const handleVerifyOtp = (deliveryId, enteredCode) => {
    const target = deliveries.find((d) => d.id === deliveryId);
    if (!target) return { ok: false, message: 'Không tìm thấy đơn hàng.' };
    if (target.locked) return { ok: false, message: 'Đơn hàng đang tạm khóa do nhập sai quá 3 lần.' };
    if (target.otpExpired) return { ok: false, message: 'Mã OTP đã hết hạn 24 giờ. Hãy bấm cấp lại mã mới.' };

    if (enteredCode !== target.otpCode) {
      const nextFails = target.failedAttempts + 1;
      const nowLocked = nextFails >= 3;
      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, failedAttempts: nextFails, locked: nowLocked } : d))
      );
      appendAuditLog(
        nowLocked ? 'OTP_LOCKED' : 'OTP_FAILED',
        `Đơn ${deliveryId} nhập sai OTP (${nextFails}/3 lần).`,
        target.recipientName,
        'RECIPIENT'
      );
      return {
        ok: false,
        message: nowLocked
          ? 'Bạn đã nhập sai OTP 3/3 lần. Đơn hàng đã tạm khóa — hãy bấm "Xin cấp lại mã mới".'
          : `Mã OTP không đúng (sai ${nextFails}/3 lần). Vui lòng kiểm tra lại.`,
      };
    }
    return { ok: true };
  };

  const handleResendOtp = (deliveryId, byOperator = false) => {
    const freshCode = generateDemoOtp();
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, otpCode: freshCode, otpExpired: false, failedAttempts: 0, locked: false, otpRemaining: '24 giờ 00 phút' }
          : d
      )
    );
    appendAuditLog(
      'OTP_RESEND',
      `${byOperator ? 'Nhân viên hỗ trợ' : 'Người nhận'} cấp lại mã OTP mới cho đơn ${deliveryId} (đã gửi Web, Gmail, SMS).`,
      byOperator ? 'Trần Ngọc Lan' : undefined,
      byOperator ? 'OPERATOR' : 'RECIPIENT'
    );
    return freshCode;
  };

  const handleSimulateExpire = (deliveryId) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, otpExpired: true, otpRemaining: 'Đã hết hạn' } : d))
    );
  };

  const handleCompletePickup = (deliveryId) => {
    const target = deliveries.find((d) => d.id === deliveryId);
    if (!target) return;
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, status: 'PICKED_UP', otpCode: '------', otpExpired: true, storageRemaining: 'Đã nhận vừa xong' }
          : d
      )
    );
    setLockers((prev) =>
      prev.map((l) =>
        l.id !== target.lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) =>
                c.number === target.compartmentNumber ? { ...c, status: 'FREE' } : c
              ),
            }
      )
    );
    appendAuditLog(
      'PICKUP_COMPLETED',
      `Đơn ${deliveryId} hoàn tất lấy hàng (door_closed); ${target.lockerId} · Ngăn #${target.compartmentNumber} trở về FREE.`,
      target.recipientName,
      'RECIPIENT'
    );
  };

  // S11: Vận hành mở ngăn thủ công & đánh dấu lỗi & giả lập online/offline
  const handleManualOpen = (lockerId, compNumber, reason) => {
    appendAuditLog('MANUAL_OPEN', `Mở thủ công ${lockerId} · Ngăn #${compNumber} — Lý do: ${reason}`, 'Trần Ngọc Lan', 'OPERATOR');
  };

  const handleToggleCompartmentFault = (lockerId, compNumber) => {
    setLockers((prev) =>
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
    appendAuditLog('COMPARTMENT_STATUS', `Cập nhật trạng thái lỗi/trống cho ${lockerId} · Ngăn #${compNumber}.`, 'Trần Ngọc Lan', 'OPERATOR');
  };

  const handleToggleLockerOnline = (lockerId) => {
    setLockers((prev) =>
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
    appendAuditLog('LOCKER_HEARTBEAT', `Thay đổi trạng thái kết nối tủ ${lockerId}.`, 'Hệ thống (MQTT)', 'SYSTEM');
  };

  // S12: Thu hồi hàng quá hạn 72h
  const handleOperatorReleaseExpired = (deliveryId) => {
    handleCompletePickup(deliveryId);
  };

  // S14: Admin quản lý tài khoản
  const handleAdminCreateUser = (data) => {
    setUsers((prev) => [{ id: prev.length + 1, ...data, active: true, createdAt: getNowLabel() }, ...prev]);
    appendAuditLog('ADMIN_USER_CREATE', `Tạo tài khoản ${data.email} với vai trò ${data.role}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleAdminChangeRole = (userId, nextRole) => {
    const u = users.find((x) => x.id === userId);
    setUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, role: nextRole } : x)));
    appendAuditLog('ADMIN_USER_UPDATE', `Đổi vai trò của ${u?.email} sang ${nextRole}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleAdminToggleActive = (userId) => {
    const u = users.find((x) => x.id === userId);
    setUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, active: !x.active } : x)));
    appendAuditLog('ADMIN_USER_LOCK', `${u?.active ? 'Khóa' : 'Mở khóa'} tài khoản ${u?.email}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  // S15: Admin thêm tủ & chỉnh cỡ ngăn
  const handleAddLocker = ({ id, name, location }) => {
    const newLocker = {
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
    };
    setLockers((prev) => [...prev, newLocker]);
    appendAuditLog('ADMIN_LOCKER_CREATE', `Thêm tủ mới ${id} (${name}) gồm 6 ngăn.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleUpdateCompartmentSize = (lockerId, compNumber, size) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.id !== lockerId
          ? l
          : {
              ...l,
              compartments: l.compartments.map((c) => (c.number === compNumber ? { ...c, size } : c)),
            }
      )
    );
    appendAuditLog('ADMIN_LOCKER_UPDATE', `Đổi cỡ ngăn ${lockerId} · #${compNumber} sang ${size}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  const handleAddCompartment = (lockerId) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id !== lockerId || l.compartments.length >= 9) return l;
        const nextNum = l.compartments.length + 1;
        return {
          ...l,
          compartments: [...l.compartments, { number: nextNum, size: 'MEDIUM', status: 'FREE' }],
        };
      })
    );
    appendAuditLog('ADMIN_LOCKER_UPDATE', `Thêm 1 ngăn mới cho tủ ${lockerId}.`, 'Quốc Trung (Admin)', 'ADMIN');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${viewportMode === 'mobile' ? 'pb-6' : 'pb-20 md:pb-10'} ${theme.pageBg}`}>
      {/* Thanh duyệt đủ 5 nhóm vai trò (S1–S15) + Nút xem Máy tính / Điện thoại */}
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
                <div className={`text-xs truncate ${theme.headerMuted}`}>15 màn hình · Navy &amp; Cam 3D</div>
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
              onClick={() => setActiveScreen('S4')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${theme.headerPill}`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              {ROLE_LABELS[currentUser.role]}
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
              Tài khoản đang xem: <strong>{currentUser.fullName}</strong>
            </p>
          </div>

          {['S1', 'S2', 'S3', 'S4'].includes(activeScreen) && (
            <ScreenAuthBundle
              screenId={activeScreen}
              theme={theme}
              currentUser={currentUser}
              onLoginAsRole={handleLoginAsRole}
              onRegisterRecipient={handleRegisterRecipient}
              onNavigateScreen={setActiveScreen}
              onAddLog={(action, detail) => appendAuditLog(action, detail)}
            />
          )}

          {activeScreen === 'S5' && (
            <ScreenS5RecipientOrders
              theme={theme}
              deliveries={deliveries}
              onOpenOrderOtp={(orderId) => {
                setSelectedDeliveryId(orderId);
                setActiveScreen('S6');
              }}
            />
          )}

          {activeScreen === 'S6' && (
            <ScreenS6OtpPickup
              theme={theme}
              deliveries={deliveries}
              selectedDeliveryId={selectedDeliveryId}
              onSelectDelivery={setSelectedDeliveryId}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={(id) => handleResendOtp(id, false)}
              onSimulateExpire={handleSimulateExpire}
              onCompletePickup={handleCompletePickup}
            />
          )}

          {activeScreen === 'S7' && (
            <ScreenS7ShipperDropoff theme={theme} lockers={lockers} onAllocateAndOpen={handleAllocateAndOpen} />
          )}

          {activeScreen === 'S8' && (
            <ScreenS8ConfirmDropoff
              theme={theme}
              pendingDropoff={pendingDropoff}
              onConfirmDoorClosed={handleConfirmDoorClosed}
              onCancelDropoff={handleCancelDropoff}
              onGoToS6={(orderId) => {
                setSelectedDeliveryId(orderId);
                setActiveScreen('S6');
              }}
              onGoToS7={() => setActiveScreen('S7')}
              onGoToS9={() => setActiveScreen('S9')}
            />
          )}

          {activeScreen === 'S9' && (
            <ScreenS9ShipperHistory
              theme={theme}
              deliveries={deliveries}
              onGoToS6={(orderId) => {
                setSelectedDeliveryId(orderId);
                setActiveScreen('S6');
              }}
              onGoToS7={() => setActiveScreen('S7')}
            />
          )}

          {activeScreen === 'S10' && (
            <ScreenS10SystemStatus
              theme={theme}
              lockers={lockers}
              deliveries={deliveries}
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
              lockers={lockers}
              deliveries={deliveries}
              initialLockerId={selectedLockerForMap}
              onManualOpen={handleManualOpen}
              onToggleCompartmentFault={handleToggleCompartmentFault}
              onToggleLockerOnline={handleToggleLockerOnline}
            />
          )}

          {activeScreen === 'S12' && (
            <ScreenS12OperatorOrders
              theme={theme}
              deliveries={deliveries}
              onOperatorResetOtp={(id) => handleResendOtp(id, true)}
              onOperatorReleaseExpired={handleOperatorReleaseExpired}
            />
          )}

          {activeScreen === 'S13' && <ScreenS13AuditLog theme={theme} auditLogs={auditLogs} />}

          {activeScreen === 'S14' && (
            <ScreenS14AdminUsers
              theme={theme}
              users={users}
              onCreateUser={handleAdminCreateUser}
              onChangeRole={handleAdminChangeRole}
              onToggleActive={handleAdminToggleActive}
            />
          )}

          {activeScreen === 'S15' && (
            <ScreenS15AdminLockers
              theme={theme}
              lockers={lockers}
              onAddLocker={handleAddLocker}
              onUpdateCompartmentSize={handleUpdateCompartmentSize}
              onAddCompartment={handleAddCompartment}
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
