// Dữ liệu mẫu dùng chung cho toàn bộ 15 màn hình S1–S15 (sẽ nối với REST API Spring Boot ở các mốc sau)

export const PACKAGE_SIZES = [
  {
    code: 'SMALL',
    label: 'Nhỏ',
    dimensions: 'Tối đa 25 × 20 × 15 cm',
    examples: 'Tài liệu, mỹ phẩm, điện thoại',
  },
  {
    code: 'MEDIUM',
    label: 'Vừa',
    dimensions: 'Tối đa 40 × 30 × 25 cm',
    examples: 'Hộp giày, quần áo, đồ gia dụng nhỏ',
  },
  {
    code: 'LARGE',
    label: 'Lớn',
    dimensions: 'Tối đa 55 × 45 × 40 cm',
    examples: 'Thùng hàng lớn, balo, thiết bị điện tử',
  },
];

export const ROLE_LABELS = {
  RECIPIENT: 'Người nhận',
  COURIER: 'Shipper',
  OPERATOR: 'Vận hành',
  ADMIN: 'Quản trị viên',
};

export const INITIAL_USERS = [
  {
    id: 1,
    username: 'nguyenvanan',
    fullName: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0912 345 678',
    role: 'RECIPIENT',
    active: true,
    createdAt: '10/11/2026',
  },
  {
    id: 2,
    username: 'shipper_hung',
    fullName: 'Phạm Quốc Hùng',
    email: 'hung.shipper@gmail.com',
    phone: '0908 456 789',
    role: 'COURIER',
    active: true,
    createdAt: '05/11/2026',
  },
  {
    id: 3,
    username: 'vanhanh_lan',
    fullName: 'Trần Ngọc Lan',
    email: 'lan.operator@smartlocker.vn',
    phone: '0933 222 111',
    role: 'OPERATOR',
    active: true,
    createdAt: '01/11/2026',
  },
  {
    id: 4,
    username: 'admin_trung',
    fullName: 'Quốc Trung (Admin)',
    email: 'admin@smartlocker.vn',
    phone: '0901 000 999',
    role: 'ADMIN',
    active: true,
    createdAt: '01/11/2026',
  },
  {
    id: 5,
    username: 'tranthibich',
    fullName: 'Trần Thị Bích',
    email: 'tranthibich@gmail.com',
    phone: '0987 654 321',
    role: 'RECIPIENT',
    active: true,
    createdAt: '14/11/2026',
  },
];

export const INITIAL_LOCKERS = [
  {
    id: 'L01',
    name: 'Tủ Sảnh A — Chung cư Bình An',
    location: 'Tầng 1, cạnh quầy lễ tân Tháp A',
    status: 'ONLINE',
    lastHeartbeat: '2 giây trước',
    compartments: [
      { number: 1, size: 'SMALL', status: 'FREE' },
      { number: 2, size: 'SMALL', status: 'OCCUPIED' },
      { number: 3, size: 'MEDIUM', status: 'OCCUPIED' },
      { number: 4, size: 'MEDIUM', status: 'FREE' },
      { number: 5, size: 'LARGE', status: 'FAULT' },
      { number: 6, size: 'LARGE', status: 'FREE' },
    ],
  },
  {
    id: 'L02',
    name: 'Tủ Sảnh B — Khu Học vụ',
    location: 'Sảnh chính tòa nhà B1',
    status: 'ONLINE',
    lastHeartbeat: '4 giây trước',
    compartments: [
      { number: 1, size: 'SMALL', status: 'FREE' },
      { number: 2, size: 'SMALL', status: 'FREE' },
      { number: 3, size: 'MEDIUM', status: 'OCCUPIED' },
      { number: 4, size: 'MEDIUM', status: 'FREE' },
      { number: 5, size: 'LARGE', status: 'OCCUPIED' },
      { number: 6, size: 'LARGE', status: 'FREE' },
    ],
  },
  {
    id: 'L03',
    name: 'Tủ Sảnh C — Tòa nhà Văn phòng',
    location: 'Lối vào hầm gửi xe Tháp C',
    status: 'OFFLINE',
    lastHeartbeat: 'Mất 3 heartbeat liên tiếp (12 phút trước)',
    compartments: [
      { number: 1, size: 'SMALL', status: 'FREE' },
      { number: 2, size: 'SMALL', status: 'FREE' },
      { number: 3, size: 'MEDIUM', status: 'FREE' },
      { number: 4, size: 'MEDIUM', status: 'FREE' },
      { number: 5, size: 'LARGE', status: 'FREE' },
      { number: 6, size: 'LARGE', status: 'FREE' },
    ],
  },
];

export const INITIAL_DELIVERIES = [
  {
    id: 'DH-1045',
    lockerId: 'L01',
    lockerName: 'Tủ Sảnh A — Chung cư Bình An',
    lockerLocation: 'Tầng 1, cạnh quầy lễ tân Tháp A',
    compartmentNumber: 3,
    packageSize: 'MEDIUM',
    recipientName: 'Nguyễn Văn An',
    recipientContact: 'nguyenvanan@gmail.com',
    recipientPhone: '0912 345 678',
    courierName: 'Phạm Quốc Hùng',
    status: 'READY',
    otpCode: '482916',
    otpExpired: false,
    failedAttempts: 0,
    locked: false,
    createdAt: 'Hôm nay, 09:15',
    storageRemaining: '69 giờ 10 phút',
    otpRemaining: '21 giờ 10 phút',
    channels: { web: true, email: true, sms: true },
  },
  {
    id: 'DH-1042',
    lockerId: 'L01',
    lockerName: 'Tủ Sảnh A — Chung cư Bình An',
    lockerLocation: 'Tầng 1, cạnh quầy lễ tân Tháp A',
    compartmentNumber: 2,
    packageSize: 'SMALL',
    recipientName: 'Trần Thị Bích',
    recipientContact: 'tranthibich@gmail.com',
    recipientPhone: '0987 654 321',
    courierName: 'Phạm Quốc Hùng',
    status: 'READY',
    otpCode: '739204',
    otpExpired: false,
    failedAttempts: 3,
    locked: true,
    createdAt: 'Hôm qua, 19:40',
    storageRemaining: '52 giờ 25 phút',
    otpRemaining: '4 giờ 25 phút',
    channels: { web: true, email: true, sms: true },
  },
  {
    id: 'DH-1039',
    lockerId: 'L02',
    lockerName: 'Tủ Sảnh B — Khu Học vụ',
    lockerLocation: 'Sảnh chính tòa nhà B1',
    compartmentNumber: 3,
    packageSize: 'MEDIUM',
    recipientName: 'Lê Minh Cường',
    recipientContact: 'leminhcuong@gmail.com',
    recipientPhone: '0903 112 233',
    courierName: 'Phạm Quốc Hùng',
    status: 'EXPIRED',
    otpCode: '118450',
    otpExpired: true,
    failedAttempts: 0,
    locked: false,
    createdAt: '3 ngày trước, 10:05',
    storageRemaining: 'Đã quá hạn 72 giờ',
    otpRemaining: 'Đã hết hạn',
    channels: { web: true, email: true, sms: false },
  },
  {
    id: 'DH-1034',
    lockerId: 'L02',
    lockerName: 'Tủ Sảnh B — Khu Học vụ',
    lockerLocation: 'Sảnh chính tòa nhà B1',
    compartmentNumber: 1,
    packageSize: 'SMALL',
    recipientName: 'Phạm Thu Dung',
    recipientContact: 'phamthudung@gmail.com',
    recipientPhone: '0938 998 877',
    courierName: 'Phạm Quốc Hùng',
    status: 'PICKED_UP',
    otpCode: '------',
    otpExpired: true,
    failedAttempts: 0,
    locked: false,
    createdAt: '2 ngày trước, 14:20',
    storageRemaining: 'Đã lấy lúc 17:45',
    otpRemaining: 'Đã sử dụng',
    channels: { web: true, email: true, sms: true },
  },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 105,
    time: 'Hôm nay, 15:42',
    actor: 'Hệ thống (MQTT)',
    role: 'SYSTEM',
    action: 'DOOR_FAULT',
    detail: 'Tủ L01 · Ngăn #5 báo sự kiện fault (cửa mở lâu chưa đóng).',
  },
  {
    id: 104,
    time: 'Hôm nay, 14:18',
    actor: 'Trần Thị Bích',
    role: 'RECIPIENT',
    action: 'OTP_LOCKED',
    detail: 'Đơn DH-1042 nhập sai OTP 3/3 lần — hệ thống tự tạm khóa đơn.',
  },
  {
    id: 103,
    time: 'Hôm nay, 09:16',
    actor: 'Phạm Quốc Hùng',
    role: 'COURIER',
    action: 'ALLOCATE_COMPARTMENT',
    detail: 'Cấp ngăn L01 · #3 (Cỡ Vừa) cho đơn DH-1045; đã gửi OTP qua Web, Gmail và SMS.',
  },
  {
    id: 102,
    time: 'Hôm nay, 08:30',
    actor: 'Trần Ngọc Lan',
    role: 'OPERATOR',
    action: 'MANUAL_OPEN',
    detail: 'Mở thủ công L02 · Ngăn #4 — Lý do: Kiểm tra cảm biến định kỳ.',
  },
  {
    id: 101,
    time: 'Hôm qua, 16:05',
    actor: 'Quốc Trung (Admin)',
    role: 'ADMIN',
    action: 'ADMIN_LOCKER_UPDATE',
    detail: 'Cập nhật cấu hình 6 ngăn cho tủ L02 (2 Nhỏ, 2 Vừa, 2 Lớn).',
  },
];

export function generateDemoOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getSizeLabel(code) {
  const found = PACKAGE_SIZES.find((s) => s.code === code);
  return found ? found.label : code;
}

export function getNowLabel() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `Hôm nay, ${hh}:${mm}`;
}
