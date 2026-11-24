import { useState } from 'react';
import { Lock, RefreshCw, Unlock, UserPlus } from 'lucide-react';
import { adminApi } from '../api/client';
import { ROLE_LABELS } from '../data/mockData';

/**
 * Màn hình S14 — Quản lý tài khoản người dùng (chỉ dành cho Admin — nối API thật /api/admin/users)
 */
export default function ScreenS14AdminUsers({
  theme: t,
  users,
  currentUserId,
  loading,
  onRefresh,
}) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Locker@123');
  const [role, setRole] = useState('COURIER');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !phone.trim() || !password) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await adminApi.createUser({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      setFeedback({
        type: 'success',
        text: `Đã tạo tài khoản ${username.trim()} (${ROLE_LABELS[role]}) và ghi vào Nhật ký (S13).`,
      });
      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('');
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (user, nextRole) => {
    setFeedback(null);
    try {
      await adminApi.updateUserRole(user.id, nextRole);
      setFeedback({
        type: 'success',
        text: `Đã đổi vai trò của ${user.username} sang ${ROLE_LABELS[nextRole]}.`,
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleToggleActive = async (user) => {
    setFeedback(null);
    try {
      await adminApi.updateUserActive(user.id, !user.active);
      setFeedback({
        type: 'success',
        text: `Đã ${user.active ? 'khóa' : 'mở khóa'} tài khoản ${user.username}.`,
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-5 items-start">
      {/* Form tạo tài khoản mới */}
      <form onSubmit={handleCreate} className={`@4xl:col-span-4 ${t.card} p-5 space-y-3`}>
        <div className="flex items-center gap-2">
          <UserPlus className={`w-5 h-5 ${t.accentText}`} aria-hidden="true" />
          <h2 className={`text-base font-bold ${t.heading}`}>Tạo tài khoản nhân sự / người dùng</h2>
        </div>

        <div>
          <label htmlFor="adm-name" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Họ và tên *
          </label>
          <input
            id="adm-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Lê Văn Nam"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="adm-user" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Tên đăng nhập (username) *
          </label>
          <input
            id="adm-user"
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nam.shipper"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="adm-email" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Email *
          </label>
          <input
            id="adm-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nam.shipper@gmail.com"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="adm-phone" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Số điện thoại *
          </label>
          <input
            id="adm-phone"
            type="tel"
            required
            minLength={8}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912888999"
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="adm-pass" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Mật khẩu khởi tạo (tối thiểu 8 ký tự) *
          </label>
          <input
            id="adm-pass"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full min-h-[42px] px-3 py-2 text-sm focus:outline-none ${t.input}`}
          />
        </div>
        <div>
          <label htmlFor="adm-role" className={`block text-xs font-semibold mb-1 ${t.bodyText}`}>
            Vai trò
          </label>
          <select
            id="adm-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full min-h-[42px] px-3 py-2 text-sm cursor-pointer focus:outline-none ${t.input}`}
          >
            <option value="RECIPIENT">Người nhận (RECIPIENT)</option>
            <option value="COURIER">Shipper (COURIER)</option>
            <option value="OPERATOR">Nhân viên vận hành (OPERATOR)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full min-h-[46px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${t.primaryBtn}`}
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              feedback.type === 'error' ? t.alertError : t.alertSuccess
            }`}
          >
            {feedback.text}
          </div>
        )}
      </form>

      {/* Danh sách tài khoản thật */}
      <div className={`@4xl:col-span-8 ${t.card} p-5 space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-base font-bold ${t.heading}`}>Danh sách tài khoản ({users.length})</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${t.subtleBtn}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="space-y-2.5">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <div
                key={u.id}
                className={`${t.subCard} p-3.5 flex flex-col @2xl:flex-row @2xl:items-center justify-between gap-3`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-bold text-sm ${t.heading}`}>{u.fullName}</span>
                    <span className={`text-xs font-mono-code ${t.mutedText}`}>@{u.username}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.active ? t.badgeSuccess : t.badgeError
                      }`}
                    >
                      {u.active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </div>
                  <div className={`text-xs ${t.mutedText} truncate`}>
                    {u.email} · {u.phone}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label={`Đổi vai trò cho ${u.fullName}`}
                    value={u.role}
                    onChange={(e) => handleChangeRole(u, e.target.value)}
                    className={`min-h-[38px] px-2.5 py-1 text-xs font-semibold cursor-pointer ${t.input}`}
                  >
                    <option value="RECIPIENT">Người nhận</option>
                    <option value="COURIER">Shipper</option>
                    <option value="OPERATOR">Vận hành</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  <button
                    type="button"
                    disabled={isSelf && u.active}
                    title={isSelf ? 'Không thể tự khóa tài khoản đang đăng nhập' : ''}
                    onClick={() => handleToggleActive(u)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      u.active ? t.secondaryBtn : t.softActionBtn
                    }`}
                  >
                    {u.active ? (
                      <>
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Khóa
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" aria-hidden="true" /> Mở khóa
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
