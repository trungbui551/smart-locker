import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Server,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { ROLE_LABELS } from '../data/mockData';

/**
 * Bộ màn hình Chung:
 * - S1: Đăng nhập (hỗ trợ chọn nhanh 4 vai trò mẫu để demo)
 * - S2: Đăng ký tài khoản mới (ép cứng vai trò RECIPIENT theo PRD)
 * - S3: Quên mật khẩu & Đặt lại mật khẩu qua Email (Gmail)
 * - S4: Hồ sơ cá nhân, đổi mật khẩu & cấu hình địa chỉ Server (Local / Online)
 */
export default function ScreenAuthBundle({
  screenId,
  theme: t,
  currentUser,
  onLoginAsRole,
  onRegisterRecipient,
  onNavigateScreen,
  onAddLog,
}) {
  // S1 state
  const [loginId, setLoginId] = useState('nguyenvanan@gmail.com');
  const [loginPw, setLoginPw] = useState('••••••••');
  const [loginMsg, setLoginMsg] = useState('');

  // S2 state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regMsg, setRegMsg] = useState('');

  // S3 state
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('nguyenvanan@gmail.com');
  const [resetCode, setResetCode] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  // S4 state
  const [serverMode, setServerMode] = useState('local');
  const [profileName, setProfileName] = useState(currentUser.fullName);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileSaved, setProfileSaved] = useState(false);

  if (screenId === 'S1') {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className={`${t.card} p-6 space-y-5`}>
          <div className="text-center space-y-2">
            <img
              src="/logo.png"
              alt="Logo Smart Locker"
              className="w-16 h-16 mx-auto object-contain drop-shadow-sm"
            />
            <h2 className={`text-xl font-extrabold ${t.heading}`}>Đăng nhập Smart Locker</h2>
            <p className={`text-xs ${t.mutedText}`}>
              Phân quyền tự động theo 4 vai trò: Người nhận, Shipper, Vận hành &amp; Admin.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginMsg('Đăng nhập thành công! Đang chuyển vào màn hình chính...');
              onLoginAsRole('RECIPIENT');
            }}
            className="space-y-3.5"
          >
            <div>
              <label htmlFor="login-email" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                Tên đăng nhập hoặc Email
              </label>
              <input
                id="login-email"
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-pw" className={`text-xs font-semibold ${t.bodyText}`}>
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => onNavigateScreen('S3')}
                  className={`text-xs font-semibold hover:underline cursor-pointer ${t.accentText}`}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                id="login-pw"
                type="password"
                required
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              Đăng nhập ngay
            </button>
          </form>

          {loginMsg && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${t.alertSuccess}`}>
              {loginMsg}
            </div>
          )}

          {/* Nút vào nhanh 4 vai trò để tiện demo */}
          <div className={`pt-4 border-t ${t.divider} space-y-2.5`}>
            <div className={`text-xs font-semibold ${t.mutedText}`}>
              Vào nhanh bằng tài khoản mẫu (Demo 4 vai trò):
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['RECIPIENT', 'COURIER', 'OPERATOR', 'ADMIN']).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onLoginAsRole(role)}
                  className={`min-h-[42px] px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div className={`text-center text-xs pt-2 ${t.mutedText}`}>
            Chưa có tài khoản nhận hàng?{' '}
            <button
              type="button"
              onClick={() => onNavigateScreen('S2')}
              className={`font-bold hover:underline cursor-pointer ${t.accentText}`}
            >
              Đăng ký ngay (S2)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screenId === 'S2') {
    return (
      <div className="max-w-lg mx-auto">
        <div className={`${t.card} p-6 space-y-5`}>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${t.pill}`}>
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              Vai trò mặc định: Người nhận (RECIPIENT)
            </span>
            <h2 className={`text-xl font-extrabold mt-2 ${t.heading}`}>Đăng ký tài khoản mới</h2>
            <p className={`text-xs mt-0.5 ${t.mutedText}`}>
              Hệ thống tự gắn quyền Người nhận ở backend (chống tự nâng quyền Admin).
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRegisterRecipient({
                fullName: regName.trim() || 'Người nhận mới',
                username: regUsername.trim() || `user_${Math.floor(100 + Math.random() * 900)}`,
                email: regEmail.trim(),
                phone: regPhone.trim(),
              });
              setRegMsg('Đăng ký thành công! Tài khoản đã xuất hiện trong danh sách Admin (S14).');
            }}
            className="space-y-3.5"
          >
            <div>
              <label htmlFor="reg-name" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                Họ và tên *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyễn Văn Minh"
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-user" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Tên đăng nhập *
                </label>
                <input
                  id="reg-user"
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="minhnv"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Số điện thoại (nhận SMS) *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  inputMode="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                Email (nhận OTP &amp; Quên mật khẩu) *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="minh@gmail.com"
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            <div>
              <label htmlFor="reg-pw" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                Mật khẩu (tối thiểu 8 ký tự) *
              </label>
              <input
                id="reg-pw"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Tạo tài khoản Người nhận
            </button>
          </form>

          {regMsg && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${t.alertSuccess}`}>
              <span>{regMsg}</span>
              <button
                type="button"
                onClick={() => onNavigateScreen('S1')}
                className="font-bold underline shrink-0 cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screenId === 'S3') {
    return (
      <div className="max-w-lg mx-auto">
        <div className={`${t.card} p-6 space-y-5`}>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${t.pill}`}>
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              Khôi phục qua Gmail SMTP · Mã dùng 1 lần (15 phút)
            </span>
            <h2 className={`text-xl font-extrabold mt-2 ${t.heading}`}>Quên mật khẩu</h2>
          </div>

          {resetStep === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setResetStep(2);
                setResetMsg(`Đã gửi mã xác nhận (demo: 829104) tới ${resetEmail}.`);
                onAddLog('PASSWORD_RESET_REQ', `Yêu cầu đặt lại mật khẩu cho email ${resetEmail}.`);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="reset-email" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Nhập Email đã đăng ký
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
                />
              </div>
              <button
                type="submit"
                className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
              >
                Gửi mã đặt lại qua Gmail
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setResetMsg('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
                onAddLog('PASSWORD_RESET', `Đặt lại mật khẩu thành công cho ${resetEmail}.`);
              }}
              className="space-y-4"
            >
              <div className={`p-3 rounded-xl border text-xs ${t.alertInfo}`}>{resetMsg}</div>
              <div>
                <label htmlFor="reset-code" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Mã xác nhận từ Email (6 chữ số)
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="829104"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm font-mono-code focus:outline-none ${t.input}`}
                />
              </div>
              <div>
                <label htmlFor="reset-new-pw" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Mật khẩu mới
                </label>
                <input
                  id="reset-new-pw"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={`flex-1 min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
                >
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  Cập nhật mật khẩu
                </button>
                <button
                  type="button"
                  onClick={() => setResetStep(1)}
                  className={`min-h-[48px] px-4 py-3 text-sm cursor-pointer ${t.secondaryBtn}`}
                >
                  Quay lại
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // S4 — Hồ sơ cá nhân & Cấu hình Server
  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      <div className={`@4xl:col-span-7 ${t.card} p-5 space-y-4`}>
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#E2D9CC]">
          <div className="w-12 h-12 rounded-2xl bg-[#172554] text-[#FDBA74] flex items-center justify-center font-extrabold text-lg shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${t.heading}`}>{currentUser.fullName}</h2>
            <p className={`text-xs ${t.mutedText}`}>
              {currentUser.email} · Vai trò: <strong>{ROLE_LABELS[currentUser.role]}</strong>
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2000);
          }}
          className="space-y-3.5"
        >
          <div>
            <label htmlFor="pf-name" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
              Họ và tên
            </label>
            <div className="relative">
              <User className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
              <input
                id="pf-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pf-phone" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
              Số điện thoại nhận SMS OTP
            </label>
            <div className="relative">
              <Phone className={`w-4 h-4 ${t.mutedText} absolute left-3.5 top-1/2 -translate-y-1/2`} aria-hidden="true" />
              <input
                id="pf-phone"
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className={`min-h-[44px] px-5 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer ${t.primaryBtn}`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('S1')}
              className={`min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer ${t.secondaryBtn}`}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
          {profileSaved && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${t.alertSuccess}`}>
              Đã lưu thông tin hồ sơ cá nhân.
            </div>
          )}
        </form>
      </div>

      {/* Cột phải: Chuyển máy chủ Local / Demo công khai (tiện cho Android Capacitor & Desktop Electron) */}
      <div className={`@4xl:col-span-5 ${t.card} p-5 space-y-3.5`}>
        <div className="flex items-center gap-2">
          <Server className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
          <h3 className={`text-base font-bold ${t.heading}`}>Cấu hình máy chủ Backend</h3>
        </div>
        <p className={`text-xs ${t.mutedText}`}>
          Dùng để chuyển nhanh giữa máy tính cá nhân (Docker) và môi trường demo công khai (HTTPS) trên App Android / Desktop.
        </p>

        <div className="space-y-2.5">
          {[
            { id: 'local', label: 'Môi trường Local (Docker)', url: 'http://localhost:8080' },
            { id: 'online', label: 'Demo công khai (Internet HTTPS)', url: 'https://smart-locker-demo.onrender.com' },
          ].map((srv) => (
            <button
              key={srv.id}
              type="button"
              onClick={() => setServerMode(srv.id)}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                serverMode === srv.id ? t.selectableActive : t.selectableIdle
              }`}
            >
              <div className={`text-sm font-bold ${t.bodyText}`}>{srv.label}</div>
              <div className={`text-xs font-mono-code mt-0.5 ${t.mutedText}`}>{srv.url}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
