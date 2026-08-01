import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";

function DashboardActions({ searchQuery, setSearchQuery }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
      <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#121212]">
        My Notes
      </h1>

      <div className="flex w-full sm:w-auto gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6A63]" />

          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-[#E5E2D9] rounded-lg text-sm text-[#121212] placeholder:text-[#6B6A63]/60 focus:outline-none focus:border-[#F4C430] transition-colors shadow-sm"
          />
        </div>

        {/* Create Button */}
        <Link
          to="/notes/new"
          className="flex items-center justify-center gap-2 bg-[#F4C430] text-[#121212] px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm hover:bg-[#e0b420] transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Note</span>
        </Link>
      </div>
    </div>
  );
}

export default DashboardActions;