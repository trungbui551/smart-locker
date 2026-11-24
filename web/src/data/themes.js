// 3 phiên bản phong cách Ấm áp 3D & Phân mảng Sáng-Tối rõ ràng cho Smart Locker

export const DESIGN_THEMES = {
  espresso3d: {
    id: 'espresso3d',
    shortName: 'Bản 1: Cà phê & Cam 3D',
    name: 'Bản 1 — Ấm áp 3D: Cà phê Đậm & Cam Đất (Phân mảng Sáng–Tối)',
    tagline: 'Mảng tối nâu cà phê + mảng sáng kem ấm + nút bấm 3D ấn lún thật tay.',
    swatches: ['#241914', '#F4E8D8', '#EA580C'],
    isDark: false,

    pageBg: 'bg-[#F4E8D8] text-[#241914]',
    // Header là MẢNG TỐI để phân tách rõ ràng với nội dung sáng bên dưới
    headerBg: 'bg-[#241914] text-[#FFFBF5] border-b-4 border-[#140D0A]',
    headerHeading: 'text-[#FFFBF5]',
    headerMuted: 'text-[#D6C2B0]',
    headerPill: 'bg-[#3B281E] border border-[#5A3E30] text-[#FDE68A]',
    bottomNavBg: 'bg-[#241914] border-t-4 border-[#140D0A]',
    brandBox: 'btn-3d btn-3d-orange rounded-xl',

    heading: 'text-[#241914]',
    bodyText: 'text-[#2B1E17]',
    mutedText: 'text-[#6B5344]',
    accentText: 'text-[#C2410C]',

    // Thẻ sáng nổi khối 3D trên nền cát ấm
    card: 'bg-[#FFFBF5] border-2 border-[#D8C3AC] rounded-2xl shadow-[0_5px_0_#D2B89D,0_10px_20px_rgba(36,25,20,0.08)]',
    cardHover: 'hover:border-[#EA580C]',
    subCard: 'bg-[#F7EFE4] border-2 border-[#E2D0BC] rounded-xl',
    divider: 'border-[#E5D5C3]',

    navActive: 'btn-3d btn-3d-orange rounded-xl',
    navIdle: 'text-[#E7D8C9] hover:bg-[#3B281E] hover:text-white rounded-xl border border-transparent',
    bottomNavActive: 'text-[#FDBA74] bg-[#3B281E]',
    bottomNavIdle: 'text-[#C7B3A3]',

    pill: 'bg-[#241914] border-2 border-[#140D0A] text-[#FDE68A]',
    sizeTag: 'bg-[#241914] text-[#FFFBF5]',

    // Các nút bấm 3D nổi khối rõ ràng
    primaryBtn: 'btn-3d btn-3d-orange rounded-xl font-bold',
    secondaryBtn: 'btn-3d btn-3d-cream rounded-xl font-bold',
    softActionBtn: 'btn-3d btn-3d-dark rounded-xl font-bold',
    subtleBtn: 'btn-3d btn-3d-cream rounded-xl',
    blueBtn: 'btn-3d btn-3d-dark rounded-xl font-bold',

    input: 'bg-white border-2 border-[#CBB69E] text-[#241914] rounded-xl shadow-[inset_0_2px_4px_rgba(36,25,20,0.08)] focus:border-[#EA580C] focus:ring-3 focus:ring-[#EA580C]/20',
    // Khối OTP là MẢNG TỐI nổi bật giữa thẻ sáng -> phân mảng sáng tối rõ rệt
    otpContainer: 'bg-[#241914] text-[#FFFBF5] border-2 border-[#140D0A] rounded-2xl shadow-[0_5px_0_#140D0A]',
    otpHeading: 'text-[#FDE68A]',
    otpDisplayBox: 'bg-[#140D0A] border-2 border-[#4A3327] rounded-xl text-[#FDBA74] shadow-[inset_0_3px_8px_rgba(0,0,0,0.6)]',
    otpInput: 'border-2 border-[#B89F84] bg-white text-[#241914] rounded-xl shadow-[0_4px_0_#CBB69E,inset_0_2px_3px_rgba(36,25,20,0.06)] focus:border-[#EA580C] focus:ring-3 focus:ring-[#EA580C]/25',

    selectableActive: 'bg-[#FFF3E6] border-[#EA580C] shadow-[0_4px_0_#C2410C]',
    selectableIdle: 'bg-white border-[#D8C3AC] shadow-[0_4px_0_#D8C3AC] hover:border-[#EA580C]',
    selectableDisabled: 'bg-[#EDE3D6] border-[#D8C3AC] opacity-60',

    badgeReady: 'bg-[#241914] text-[#FDE68A]',
    badgeSuccess: 'bg-emerald-700 text-white',
    badgeWarn: 'bg-amber-500 text-[#1C130C]',
    badgeError: 'bg-rose-700 text-white',

    alertInfo: 'bg-[#241914] border-[#140D0A] text-[#FFFBF5]',
    alertSuccess: 'bg-emerald-50 border-emerald-600 text-emerald-950',
    alertWarn: 'bg-amber-50 border-amber-500 text-amber-950',
    alertError: 'bg-rose-50 border-rose-500 text-rose-950',

    // Khối số ngăn được cấp là MẢNG TỐI nổi bật
    compHighlight: 'bg-[#241914] border-2 border-[#140D0A] rounded-2xl shadow-[0_5px_0_#140D0A]',
    compHighlightLabel: 'text-[#D6C2B0]',
    compHighlightNum: 'text-[#FDBA74]',
    compHighlightSub: 'text-[#FFFBF5]',
  },

  honeyPine3d: {
    id: 'honeyPine3d',
    shortName: 'Bản 2: Mật ong & Rêu 3D',
    name: 'Bản 2 — Ấm áp 3D: Xanh Rêu Đậm & Vàng Mật Ong (Phân mảng Sáng–Tối)',
    tagline: 'Mảng tối xanh rêu sang trọng + nền kem mật ong + nút bấm 3D vàng hổ phách.',
    swatches: ['#132A24', '#FAF3E3', '#F59E0B'],
    isDark: false,

    pageBg: 'bg-[#F5ECD7] text-[#132A24]',
    headerBg: 'bg-[#132A24] text-[#FFFDF7] border-b-4 border-[#0A1814]',
    headerHeading: 'text-[#FFFDF7]',
    headerMuted: 'text-[#A7C4BC]',
    headerPill: 'bg-[#1E4037] border border-[#2F5E51] text-[#FDE68A]',
    bottomNavBg: 'bg-[#132A24] border-t-4 border-[#0A1814]',
    brandBox: 'btn-3d btn-3d-amber rounded-xl',

    heading: 'text-[#132A24]',
    bodyText: 'text-[#1B332C]',
    mutedText: 'text-[#4F6B62]',
    accentText: 'text-[#B45309]',

    card: 'bg-[#FFFDF7] border-2 border-[#D4C7AD] rounded-2xl shadow-[0_5px_0_#C9BA9C,0_10px_20px_rgba(19,42,36,0.08)]',
    cardHover: 'hover:border-[#132A24]',
    subCard: 'bg-[#F7F0DF] border-2 border-[#DFD3BA] rounded-xl',
    divider: 'border-[#E2D8C2]',

    navActive: 'btn-3d btn-3d-amber rounded-xl',
    navIdle: 'text-[#D2E3DE] hover:bg-[#1E4037] hover:text-white rounded-xl border border-transparent',
    bottomNavActive: 'text-[#FBBF24] bg-[#1E4037]',
    bottomNavIdle: 'text-[#9BB8B0]',

    pill: 'bg-[#132A24] border-2 border-[#0A1814] text-[#FDE68A]',
    sizeTag: 'bg-[#132A24] text-[#FFFDF7]',

    primaryBtn: 'btn-3d btn-3d-amber rounded-xl font-bold',
    secondaryBtn: 'btn-3d btn-3d-cream rounded-xl font-bold',
    softActionBtn: 'btn-3d btn-3d-pine rounded-xl font-bold',
    subtleBtn: 'btn-3d btn-3d-cream rounded-xl',
    blueBtn: 'btn-3d btn-3d-pine rounded-xl font-bold',

    input: 'bg-white border-2 border-[#C7B99D] text-[#132A24] rounded-xl shadow-[inset_0_2px_4px_rgba(19,42,36,0.07)] focus:border-[#D97706] focus:ring-3 focus:ring-[#D97706]/25',
    otpContainer: 'bg-[#132A24] text-[#FFFDF7] border-2 border-[#0A1814] rounded-2xl shadow-[0_5px_0_#0A1814]',
    otpHeading: 'text-[#FDE68A]',
    otpDisplayBox: 'bg-[#0A1814] border-2 border-[#254E43] rounded-xl text-[#FBBF24] shadow-[inset_0_3px_8px_rgba(0,0,0,0.6)]',
    otpInput: 'border-2 border-[#B8A88A] bg-white text-[#132A24] rounded-xl shadow-[0_4px_0_#C7B99D,inset_0_2px_3px_rgba(19,42,36,0.06)] focus:border-[#D97706] focus:ring-3 focus:ring-[#D97706]/25',

    selectableActive: 'bg-[#FEF7E6] border-[#D97706] shadow-[0_4px_0_#B45309]',
    selectableIdle: 'bg-white border-[#D4C7AD] shadow-[0_4px_0_#D4C7AD] hover:border-[#D97706]',
    selectableDisabled: 'bg-[#EAE2D1] border-[#D4C7AD] opacity-60',

    badgeReady: 'bg-[#132A24] text-[#FDE68A]',
    badgeSuccess: 'bg-emerald-700 text-white',
    badgeWarn: 'bg-amber-500 text-[#1C130C]',
    badgeError: 'bg-rose-700 text-white',

    alertInfo: 'bg-[#132A24] border-[#0A1814] text-[#FFFDF7]',
    alertSuccess: 'bg-emerald-50 border-emerald-600 text-emerald-950',
    alertWarn: 'bg-amber-50 border-amber-500 text-amber-950',
    alertError: 'bg-rose-50 border-rose-500 text-rose-950',

    compHighlight: 'bg-[#132A24] border-2 border-[#0A1814] rounded-2xl shadow-[0_5px_0_#0A1814]',
    compHighlightLabel: 'text-[#A7C4BC]',
    compHighlightNum: 'text-[#FBBF24]',
    compHighlightSub: 'text-[#FFFDF7]',
  },

  navyWarm3d: {
    id: 'navyWarm3d',
    shortName: 'Bản 3: Navy & Cam 3D',
    name: 'Bản 3 — Tương phản 3D: Xanh Navy Đậm & Kem Sáng + Nút Cam 3D',
    tagline: 'Phân mảng sáng tối mạnh giữa xanh Navy đậm và nền kem ấm, nút Cam 3D nổi bật.',
    swatches: ['#172554', '#FAF5EE', '#EA580C'],
    isDark: false,

    pageBg: 'bg-[#F5EFE6] text-[#172554]',
    headerBg: 'bg-[#172554] text-white border-b-4 border-[#0B1120]',
    headerHeading: 'text-white',
    headerMuted: 'text-blue-200',
    headerPill: 'bg-[#1E3A8A] border border-blue-700 text-amber-200',
    bottomNavBg: 'bg-[#172554] border-t-4 border-[#0B1120]',
    brandBox: 'btn-3d btn-3d-orange rounded-xl',

    heading: 'text-[#172554]',
    bodyText: 'text-[#1E293B]',
    mutedText: 'text-[#475569]',
    accentText: 'text-[#EA580C]',

    card: 'bg-[#FFFDF9] border-2 border-[#CBD5E1] rounded-2xl shadow-[0_5px_0_#CBD5E1,0_10px_20px_rgba(15,23,42,0.07)]',
    cardHover: 'hover:border-[#1E3A8A]',
    subCard: 'bg-[#F3ECE2] border-2 border-[#DDD3C5] rounded-xl',
    divider: 'border-[#E2D9CC]',

    navActive: 'btn-3d btn-3d-orange rounded-xl',
    navIdle: 'text-blue-100 hover:bg-[#1E3A8A] hover:text-white rounded-xl border border-transparent',
    bottomNavActive: 'text-[#FDBA74] bg-[#1E3A8A]',
    bottomNavIdle: 'text-blue-200',

    pill: 'bg-[#172554] border-2 border-[#0B1120] text-amber-200',
    sizeTag: 'bg-[#172554] text-white',

    primaryBtn: 'btn-3d btn-3d-orange rounded-xl font-bold',
    secondaryBtn: 'btn-3d btn-3d-cream rounded-xl font-bold',
    softActionBtn: 'btn-3d btn-3d-navy rounded-xl font-bold',
    subtleBtn: 'btn-3d btn-3d-cream rounded-xl',
    blueBtn: 'btn-3d btn-3d-navy rounded-xl font-bold',

    input: 'bg-white border-2 border-[#CBD5E1] text-[#0F172A] rounded-xl shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)] focus:border-[#EA580C] focus:ring-3 focus:ring-[#EA580C]/20',
    otpContainer: 'bg-[#172554] text-white border-2 border-[#0B1120] rounded-2xl shadow-[0_5px_0_#0B1120]',
    otpHeading: 'text-amber-200',
    otpDisplayBox: 'bg-[#0B1120] border-2 border-blue-900 rounded-xl text-[#FDBA74] shadow-[inset_0_3px_8px_rgba(0,0,0,0.6)]',
    otpInput: 'border-2 border-[#94A3B8] bg-white text-[#172554] rounded-xl shadow-[0_4px_0_#CBD5E1] focus:border-[#EA580C] focus:ring-3 focus:ring-[#EA580C]/25',

    selectableActive: 'bg-[#FFF3E6] border-[#EA580C] shadow-[0_4px_0_#C2410C]',
    selectableIdle: 'bg-white border-[#CBD5E1] shadow-[0_4px_0_#CBD5E1] hover:border-[#EA580C]',
    selectableDisabled: 'bg-slate-100 border-slate-300 opacity-60',

    badgeReady: 'bg-[#172554] text-amber-200',
    badgeSuccess: 'bg-emerald-700 text-white',
    badgeWarn: 'bg-amber-500 text-[#1C130C]',
    badgeError: 'bg-rose-700 text-white',

    alertInfo: 'bg-[#172554] border-[#0B1120] text-white',
    alertSuccess: 'bg-emerald-50 border-emerald-600 text-emerald-950',
    alertWarn: 'bg-amber-50 border-amber-500 text-amber-950',
    alertError: 'bg-rose-50 border-rose-500 text-rose-950',

    compHighlight: 'bg-[#172554] border-2 border-[#0B1120] rounded-2xl shadow-[0_5px_0_#0B1120]',
    compHighlightLabel: 'text-blue-200',
    compHighlightNum: 'text-[#FDBA74]',
    compHighlightSub: 'text-white',
  },
};
