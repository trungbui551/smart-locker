import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Server,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { authApi, getApiBaseUrl, setApiBaseUrl } from '../api/client';
import { ROLE_LABELS } from '../data/mockData';

/**
 * Bộ màn hình Tài khoản nối trực tiếp với API Backend thật (M6):
 * - S1: Đăng nhập (POST /api/auth/login) + 4 nút đăng nhập nhanh bằng tài khoản mẫu local
 * - S2: Đăng ký Người nhận (POST /api/auth/register)
 * - S3: Quên mật khẩu & Đặt lại mật khẩu qua Gmail (POST /api/auth/forgot-password & /reset-password)
 * - S4: Hồ sơ cá nhân, Đổi địa chỉ máy chủ Backend (Local 8081 / 8080 / Demo online) & Đăng xuất
 */
export default function ScreenAuthBundle({
  screenId,
  theme: t,
  currentUser,
  sessionNotice,
  onAuthSuccess,
  onLogout,
  onNavigateScreen,
}) {
  // S1 state
  const [loginId, setLoginId] = useState('recipient');
  const [loginPw, setLoginPw] = useState('Locker@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // S2 state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPw, setRegPw] = useState('');

  // S3 state
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');

  // S4 state
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  const runLogin = async (identifier, password) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await authApi.login(identifier, password);
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              Kết nối Backend thật tại <code className="font-mono-code">{getApiBaseUrl()}</code>
            </p>
          </div>

          {sessionNotice && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${t.alertWarn}`}>
              {sessionNotice}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runLogin(loginId, loginPw);
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

            {errorMsg && (
              <div role="alert" className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${t.alertError}`}>
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${t.primaryBtn}`}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            </button>
          </form>

          {/* 4 nút đăng nhập nhanh bằng tài khoản mẫu local thật trên PostgreSQL */}
          <div className={`pt-4 border-t ${t.divider} space-y-2.5`}>
            <div className={`text-xs font-semibold ${t.mutedText}`}>
              Đăng nhập nhanh tài khoản mẫu local (mật khẩu <code className="font-mono-code">Locker@123</code>):
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'recipient', label: 'Người nhận' },
                { id: 'courier', label: 'Shipper' },
                { id: 'operator', label: 'Vận hành' },
                { id: 'admin', label: 'Quản trị viên' },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  disabled={loading}
                  onClick={() => runLogin(acc.id, 'Locker@123')}
                  className={`min-h-[42px] px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {acc.label}
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
              Tự đăng ký → mặc định Người nhận (RECIPIENT)
            </span>
            <h2 className={`text-xl font-extrabold mt-2 ${t.heading}`}>Đăng ký tài khoản mới</h2>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMsg('');
              setLoading(true);
              try {
                const res = await authApi.register({
                  fullName: regName.trim(),
                  username: regUsername.trim(),
                  email: regEmail.trim(),
                  phone: regPhone.trim(),
                  password: regPw,
                });
                onAuthSuccess(res.token, res.user);
              } catch (err) {
                setErrorMsg(err.message);
              } finally {
                setLoading(false);
              }
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
                  minLength={3}
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
                  placeholder="0912345678"
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
                value={regPw}
                onChange={(e) => setRegPw(e.target.value)}
                placeholder="••••••••"
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
              />
            </div>

            {errorMsg && (
              <div role="alert" className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${t.alertError}`}>
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${t.primaryBtn}`}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản Người nhận'}
            </button>
          </form>
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
              Khôi phục qua Gmail · Mã dùng 1 lần (15 phút)
            </span>
            <h2 className={`text-xl font-extrabold mt-2 ${t.heading}`}>Quên mật khẩu</h2>
          </div>

          {resetStep === 1 ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');
                setLoading(true);
                try {
                  const res = await authApi.forgotPassword(resetEmail.trim());
                  setSuccessMsg(res.message);
                  setResetStep(2);
                } catch (err) {
                  setErrorMsg(err.message);
                } finally {
                  setLoading(false);
                }
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
              {errorMsg && <div className={`p-3 rounded-xl border text-xs ${t.alertError}`}>{errorMsg}</div>}
              <button
                type="submit"
                disabled={loading}
                className={`w-full min-h-[48px] px-5 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${t.primaryBtn}`}
              >
                {loading ? 'Đang gửi...' : 'Gửi mã đặt lại qua Gmail'}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');
                setLoading(true);
                try {
                  const res = await authApi.resetPassword(resetEmail.trim(), resetCode.trim(), resetNewPw);
                  setSuccessMsg(res.message);
                } catch (err) {
                  setErrorMsg(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              {successMsg && <div className={`p-3 rounded-xl border text-xs ${t.alertInfo}`}>{successMsg}</div>}
              {errorMsg && <div className={`p-3 rounded-xl border text-xs ${t.alertError}`}>{errorMsg}</div>}
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
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm font-mono-code focus:outline-none ${t.input}`}
                />
              </div>
              <div>
                <label htmlFor="reset-new-pw" className={`block text-xs font-semibold mb-1.5 ${t.bodyText}`}>
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <input
                  id="reset-new-pw"
                  type="password"
                  required
                  minLength={8}
                  value={resetNewPw}
                  onChange={(e) => setResetNewPw(e.target.value)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm focus:outline-none ${t.input}`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
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

  // S4 — Hồ sơ cá nhân & Cấu hình máy chủ Backend
  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      <div className={`@4xl:col-span-6 ${t.card} p-5 space-y-4`}>
        {currentUser ? (
          <>
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#E2D9CC]">
              <div className="w-12 h-12 rounded-2xl bg-[#172554] text-[#FDBA74] flex items-center justify-center font-extrabold text-lg shrink-0">
                {currentUser.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${t.heading}`}>{currentUser.fullName}</h2>
                <p className={`text-xs ${t.mutedText}`}>
                  @{currentUser.username} · <strong>{ROLE_LABELS[currentUser.role] || currentUser.role}</strong>
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className={`${t.subCard} p-3`}>
                <span className={`text-xs ${t.mutedText}`}>Email:</span>{' '}
                <strong className={t.bodyText}>{currentUser.email}</strong>
              </div>
              <div className={`${t.subCard} p-3`}>
                <span className={`text-xs ${t.mutedText}`}>Số điện thoại:</span>{' '}
                <strong className={t.bodyText}>{currentUser.phone}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className={`min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer ${t.secondaryBtn}`}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className={`text-sm ${t.mutedText}`}>Bạn chưa đăng nhập vào Backend.</p>
            <button
              type="button"
              onClick={() => onNavigateScreen('S1')}
              className={`min-h-[44px] px-5 py-2.5 text-sm cursor-pointer ${t.primaryBtn}`}
            >
              Đi tới Đăng nhập (S1)
            </button>
          </div>
        )}
      </div>

      {/* Cấu hình địa chỉ máy chủ Backend */}
      <div className={`@4xl:col-span-6 ${t.card} p-5 space-y-3.5`}>
        <div className="flex items-center gap-2">
          <Server className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
          <h3 className={`text-base font-bold ${t.heading}`}>Địa chỉ máy chủ Backend API</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['http://localhost:8081', 'http://localhost:8080'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const saved = setApiBaseUrl(preset);
                setApiUrl(saved);
                setSuccessMsg(`Đã đổi máy chủ Backend sang ${saved}`);
              }}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-mono-code font-bold cursor-pointer ${
                apiUrl === preset ? t.primaryBtn : t.secondaryBtn
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const saved = setApiBaseUrl(apiUrl);
            setApiUrl(saved);
            setSuccessMsg(`Đã lưu địa chỉ máy chủ: ${saved}`);
          }}
          className="flex gap-2"
        >
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://smart-locker.onrender.com"
            className={`flex-1 min-h-[44px] px-3 py-2 text-xs font-mono-code focus:outline-none ${t.input}`}
          />
          <button type="submit" className={`min-h-[44px] px-4 py-2 text-xs font-bold cursor-pointer ${t.softActionBtn}`}>
            Lưu
          </button>
        </form>
        {successMsg && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${t.alertSuccess}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
