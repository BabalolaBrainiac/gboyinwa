'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User, Camera, Save, Check, AlertCircle, Loader2,
  Shield, UserCircle, ArrowLeft, Lock, Eye, EyeOff,
} from 'lucide-react';

interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(data => { setProfile(data); setDisplayName(data.display_name || ''); })
      .catch(() => setSaveError('Failed to load profile'));
  }, []);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSaveError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setSaveError('Image must be under 5 MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setSaveError('');
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch('/api/admin/profile', { method: 'PUT', body: formData });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || 'Failed to save'); return; }

      setProfile(prev => prev ? { ...prev, ...data } : null);
      setAvatarFile(null);
      if (data.avatar_url) setAvatarPreview(null);
      await updateSession({ displayName: data.display_name });
      setSaveSuccess('Profile updated!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch {
      setSaveError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return; }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }

    setChangingPw(true);
    try {
      const res = await fetch('/api/admin/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to change password'); return; }
      setPwSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch {
      setPwError('Failed to change password');
    } finally {
      setChangingPw(false);
    }
  }

  const initials = (displayName || profile?.display_name || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const currentAvatar = avatarPreview || profile?.avatar_url;
  const pwStrength = newPassword.length === 0 ? null : newPassword.length < 8 ? 'weak' : newPassword.length < 12 ? 'fair' : 'strong';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-brand-green dark:text-brand-yellow">My Profile</h1>
        <p className="text-sm text-brand-black/60 dark:text-brand-yellow/60 mt-1">Manage your name, photo, and password</p>
      </div>

      {/* Role badge */}
      {profile && (
        <div className="flex items-center gap-3 p-4 bg-brand-green/5 dark:bg-brand-yellow/5 rounded-xl border border-brand-green/10 dark:border-brand-yellow/10">
          {profile.role === 'superadmin'
            ? <Shield className="w-5 h-5 text-brand-yellow shrink-0" />
            : <UserCircle className="w-5 h-5 text-brand-green dark:text-brand-yellow/60 shrink-0" />
          }
          <div>
            <span className="text-sm font-semibold capitalize text-brand-black dark:text-brand-yellow">
              {profile.role === 'superadmin' ? 'Superadmin' : 'Admin'}
            </span>
            <span className="text-xs text-brand-black/40 dark:text-brand-yellow/40 ml-2">
              · Member since {new Date(profile.created_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* ── Profile form ───────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-6 space-y-6">
        <h2 className="font-semibold text-brand-black dark:text-brand-yellow">Profile Information</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center border-4 border-white dark:border-brand-black shadow-md relative">
              {currentAvatar
                ? <Image src={currentAvatar} alt="Avatar" fill className="object-cover" sizes="96px" unoptimized />
                : <span className="text-2xl font-bold text-brand-green dark:text-brand-yellow">{initials}</span>
              }
            </div>
            <button type="button" onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-yellow text-brand-black flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          <p className="text-xs text-brand-black/40 dark:text-brand-yellow/40">JPG, PNG, WebP · max 5 MB</p>
          {avatarFile && <p className="text-xs text-brand-green dark:text-brand-yellow font-medium">New photo selected: {avatarFile.name}</p>}
        </div>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">Display Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name" minLength={2} maxLength={80} required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none" />
          </div>
          <p className="mt-1 text-xs text-gray-400">Shown in the sidebar and on uploads — email cannot be changed</p>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 text-sm">
            <Check className="w-4 h-4 shrink-0" />{saveSuccess}
          </div>
        )}

        <button type="submit" disabled={saving || !displayName.trim()}
          className="w-full py-3 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
        </button>
      </form>

      {/* ── Change Password ────────────────────────────────────────── */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-brand-black/50 rounded-2xl border border-brand-green/10 dark:border-brand-yellow/10 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-green dark:text-brand-yellow" />
          <h2 className="font-semibold text-brand-black dark:text-brand-yellow">Change Password</h2>
        </div>

        {/* Current password */}
        <div>
          <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">Current Password</label>
          <div className="relative">
            <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} required
              placeholder="Enter current password"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none" />
            <button type="button" onClick={() => setShowCurrentPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">New Password</label>
          <div className="relative">
            <input type={showNewPw ? 'text' : 'password'} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-brand-green/20 dark:border-brand-yellow/20 bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 focus:ring-brand-green outline-none" />
            <button type="button" onClick={() => setShowNewPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {pwStrength && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  pwStrength === 'weak' ? 'w-1/3 bg-red-400' :
                  pwStrength === 'fair' ? 'w-2/3 bg-brand-yellow' : 'w-full bg-brand-green'
                }`} />
              </div>
              <span className={`text-xs font-medium ${
                pwStrength === 'weak' ? 'text-red-400' :
                pwStrength === 'fair' ? 'text-brand-yellow' : 'text-brand-green'
              }`}>{pwStrength}</span>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-sm font-medium text-brand-black dark:text-brand-yellow mb-2">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            required placeholder="Re-enter new password"
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow focus:ring-2 outline-none transition-colors ${
              confirmPassword && confirmPassword !== newPassword
                ? 'border-red-300 focus:ring-red-200'
                : 'border-brand-green/20 dark:border-brand-yellow/20 focus:ring-brand-green'
            }`} />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1 text-xs text-red-400">Passwords don&apos;t match</p>
          )}
        </div>

        {pwError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 text-sm">
            <Check className="w-4 h-4 shrink-0" />{pwSuccess}
          </div>
        )}

        <button type="submit" disabled={changingPw || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="w-full py-3 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
          {changingPw ? <><Loader2 className="w-4 h-4 animate-spin" />Changing...</> : <><Lock className="w-4 h-4" />Change Password</>}
        </button>
      </form>
    </div>
  );
}
