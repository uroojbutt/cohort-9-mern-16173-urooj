import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Heading2,
    Undo,
    Redo,
} from "lucide-react";

function ToolbarButton({ onClick, isActive, disabled, children, label }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={isActive}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${isActive
                ? "bg-[#F4C430] text-[#121212] shadow-sm"
                : "text-[#121212]/60 hover:text-[#121212] hover:bg-black/5"
                }`} 
        >
            {children}
        </button>
    );
}

export default function NoteEditorToolbar({ editor }) {
    if (!editor) return null;
    return (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
            <ToolbarButton
                label="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
            >
                <Bold size={18} strokeWidth={editor.isActive("bold") ? 2.5 : 2} />
            </ToolbarButton>

            <ToolbarButton
                label="Italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
            >
                <Italic size={18} strokeWidth={editor.isActive("italic") ? 2.5 : 2} />
            </ToolbarButton>

            <ToolbarButton
                label="Strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
            >
                <Strikethrough size={18} strokeWidth={editor.isActive("strike") ? 2.5 : 2} />
            </ToolbarButton>

            <div className="w-px h-6 bg-black/10 mx-2" />

            <ToolbarButton
                label="Heading"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
            >
                <Heading2 size={18} strokeWidth={editor.isActive("heading", { level: 2 }) ? 2.5 : 2} />
            </ToolbarButton>

            <ToolbarButton
                label="Bullet list"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
            >
                <List size={18} strokeWidth={editor.isActive("bulletList") ? 2.5 : 2} />
            </ToolbarButton>

            <ToolbarButton
                label="Numbered list"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
            >
                <ListOrdered size={18} strokeWidth={editor.isActive("orderedList") ? 2.5 : 2} />
            </ToolbarButton>

            <div className="w-px h-6 bg-black/10 mx-2" />

            <ToolbarButton
                label="Undo"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                <Undo size={18} />
            </ToolbarButton>

            <ToolbarButton
                label="Redo"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                <Redo size={18} />
            </ToolbarButton>
        </div>
    );
}