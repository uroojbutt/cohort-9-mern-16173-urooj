import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit3, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";

function NoteCard({ note, index, handleDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative bg-[#FAFAF8] border border-[#E5E2D9] rounded-2xl p-5 shadow-xl shadow-black/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 hover:border-[#F4C430]/50 transition-all duration-300 flex flex-col h-64 overflow-hidden"
    >
      {/* Yellow Tape */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 bg-[#e0b420]/80 -rotate-2 backdrop-blur-sm shadow-sm z-10" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3 mt-1">
        <h3 className="font-display font-semibold text-lg text-[#121212] line-clamp-1 flex-1 pr-2">
          {note.title || "Untitled"}
        </h3>

        <div className="flex gap-1">
          <Link
            to={`/notes/${note._id}/edit`}
            aria-label="Edit note"
            className="p-1.5 text-[#6B6A63] hover:text-[#F4C430] bg-white border border-transparent hover:border-[#E5E2D9] rounded-md transition-all shadow-sm"
          >
            <Edit3 size={14} />
          </Link>

          <button
            onClick={() => handleDelete(note._id)}
            aria-label="Delete note"
            className="p-1.5 text-[#6B6A63] hover:text-red-500 bg-white border border-transparent hover:border-[#E5E2D9] rounded-md transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {note.content ? (
        <div 
          className="text-[#6B6A63] text-sm flex-1 overflow-hidden whitespace-pre-wrap leading-relaxed prose prose-sm prose-p:my-0 max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
        />
      ) : (
        <p className="text-[#6B6A63] text-sm flex-1 overflow-hidden whitespace-pre-wrap leading-relaxed">
          No content...
        </p>
      )}

      {/* Footer */}
      <div className="pt-4 mt-auto border-t border-[#E5E2D9]/60 flex justify-between items-center text-xs text-[#6B6A63]">
        <span>
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>

        <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]"></div>
      </div>
    </motion.div>
  );
}

export default NoteCard;