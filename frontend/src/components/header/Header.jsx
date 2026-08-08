import { LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
function Header({ user, handleLogout }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E2D9] sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative inline-block mt-1">
            <span className="absolute left-[-6px] right-[-4px] top-[45%] h-[40%] bg-[#F4C430] -skew-x-6 z-0" />
            <span className="relative z-10 text-xl font-display font-semibold tracking-tight text-[#121212]">
              Notes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Name Greeting */}
          <span className="hidden sm:inline-block font-medium text-sm text-[#121212] mr-2">
            Hi, {user?.name?.split(' ')[0] || "Account"}
          </span>

          <Link
            to="/profile"
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#E5E2D9]/50 transition-colors group"
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#F4C430]/20 flex items-center justify-center text-[#F4C430] group-hover:bg-[#F4C430]/30 transition-colors">
              <User size={16} />
            </div>
            <span className="font-medium text-sm text-[#121212] hidden sm:block">Profile</span>
          </Link>

          <div className="w-px h-5 bg-[#E5E2D9] hidden sm:block"></div>

          <button
            onClick={handleLogout}
            className="p-2 text-[#6B6A63] hover:text-[#121212] hover:bg-[#E5E2D9]/50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Log out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;