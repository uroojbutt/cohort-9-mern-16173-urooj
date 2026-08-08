import { useState, useEffect, useCallback, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { X, Save, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/api";
import NoteEditorToolbar from "../../components/note-editor-toolbar/NoteEditorToolbar";

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Forces this component to re-render on every editor transaction so the
  // toolbar's editor.isActive() checks (Bold/H2/Bullet List highlighting)
  // reflect the current cursor position and formatting state.
  const [, forceToolbarUpdate] = useReducer((x) => x + 1, 0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something amazing...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] max-w-none px-6 py-6 text-[#121212]/90 focus:outline-none prose prose-sm sm:prose-base font-sans selection:bg-[#F4C430]/30",
      },
    },
    onTransaction: () => {
      forceToolbarUpdate();
    },
  });

  // Fetch existing note when editing
  useEffect(() => {
    if (!isEditMode || !editor) return;

    let isMounted = true;

    async function fetchNote() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/notes/${id}`);
        if (!isMounted) return;
        // Adjust for potential nesting based on dashboard fetch logic
        const noteData = response.data.note || response.data;
        setTitle(noteData.title || "");
        editor.commands.setContent(noteData.content || "");
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.status === 404
            ? "Note not found."
            : "Couldn't load this note. Please try again."
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchNote();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, editor]);

  const handleCancel = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please add a title before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content: editor.getHTML(),
    };

    try {
      if (isEditMode) {
        await api.put(`/api/notes/${id}`, payload);
      } else {
        await api.post("/api/notes", payload);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Couldn't save your note. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        className="min-h-screen flex items-center justify-center bg-[#ffffff]"
        style={{
          backgroundImage: "radial-gradient(circle, #E5E2D9 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="text-[#F4C430]" size={40} />
        </motion.div>
        <span className="sr-only">Loading note...</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans text-[#121212] flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: "radial-gradient(circle, #E5E2D9 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Back to dashboard"
            className="group flex items-center gap-2 px-3 py-2 -ml-3 rounded-xl text-[#121212]/60 hover:text-[#121212] hover:bg-black/5 transition-all font-medium"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform " />
            <span className="cursor-pointer">Back</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md px-4 py-2.5  bg-[#F4C430] text-[#121212] font-semibold shadow-sm hover:bg-[#e3b52a] hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : <span className="cursor-pointer">Save Note</span>}
          </button>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 flex items-center gap-3 shadow-sm"
          >


            <button onClick={() => setError(null)}
              className="cursor-pointer"
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          {/* Main Editor Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-[#E5E2D9] shadow-sm overflow-hidden flex flex-col flex-1">

            {/* Title Section */}
            <div className="px-6 sm:px-10 pt-8 pb-4 border-b border-[#E5E2D9]/50">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of your brilliant note..."
                maxLength={150}
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-[#121212] placeholder-[#121212]/20 focus:outline-none font-[Space_Grotesk] tracking-tight"
              />
            </div>

            {/* Toolbar */}
            <div className="px-4 sm:px-8 py-2 bg-black/[0.02] border-b border-[#E5E2D9]/50">
              <NoteEditorToolbar editor={editor} />
            </div>

            {/* Rich text editor area */}
            <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
              <div className="min-h-full sm:px-4 pb-12">
                <EditorContent editor={editor} />
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}