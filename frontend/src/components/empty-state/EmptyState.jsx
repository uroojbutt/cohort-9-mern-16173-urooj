import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";

function EmptyState({ searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 bg-white border border-[#E5E2D9] rounded-2xl border-dashed shadow-sm"
    >
      <div className="mx-auto w-16 h-16 bg-[#F4C430]/10 text-[#F4C430] rounded-full flex items-center justify-center mb-4">
        <FileText size={24} />
      </div>

      <h3 className="text-lg font-display font-medium text-[#121212] mb-2">
        No notes found
      </h3>

      <p className="text-[#6B6A63] text-sm mb-6 max-w-sm mx-auto">
        {searchQuery
          ? "Try adjusting your search terms."
          : "Create your first note to start organizing your thoughts in your shiny new notebook."}
      </p>

      {!searchQuery && (
        <Link
          to="/notes/new"
          className="inline-flex items-center gap-2 bg-[#F4C430] text-[#121212] px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#e0b420] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Note
        </Link>
      )}
    </motion.div>
  );
}

export default EmptyState;