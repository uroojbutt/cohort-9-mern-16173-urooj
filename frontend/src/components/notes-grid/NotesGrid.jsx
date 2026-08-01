import NoteCard from "../note-card/NoteCard";

function NotesGrid({ filteredNotes, handleDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {filteredNotes.map((note, index) => (
        <NoteCard
          key={note._id}
          note={note}
          index={index}
          handleDelete={handleDelete}
        />
      ))}
    </div>
  );
}

export default NotesGrid;