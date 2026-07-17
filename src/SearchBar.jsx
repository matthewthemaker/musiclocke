import { useState } from "react";
import { LogIn, LogOut, UserRound, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AccountPanel() {
  const { user, isSignedIn, authLoading, authError, firebaseConfigured, signIn, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!firebaseConfigured) {
    return (
      <div
        className="hidden items-center gap-1.5 rounded-full border border-void-line px-3 py-1.5 text-[11px] text-ink-low sm:flex"
        title="Add your Firebase project keys to .env to enable accounts and cross-device sync"
      >
        <AlertCircle size={13} />
        <span>Accounts not configured</span>
      </div>
    );
  }

  if (authLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-void-raised" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={signIn}
          className="flex items-center gap-1.5 rounded-full border border-void-line bg-void-raised px-3 py-1.5 text-xs text-ink-mid hover:border-neon-green hover:text-neon-green"
        >
          <LogIn size={14} />
          Sign in
        </button>
        {authError && <span className="text-[10px] text-pulse-pink">{authError}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-void-line bg-void-raised px-2 py-1 hover:border-neon-green"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <UserRound size={16} className="text-ink-mid" />
        )}
        <span className="hidden max-w-[8rem] truncate text-xs text-ink-hi sm:inline">
          {user?.displayName ?? user?.email}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl2 border border-void-line bg-void-panel/95 p-2 shadow-glow-soft backdrop-blur">
          <p className="truncate px-2 py-1 text-[11px] text-ink-mid">{user?.email}</p>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              signOutUser();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-hi hover:bg-void-raised"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
