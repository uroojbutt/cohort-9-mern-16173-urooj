import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import Header from "../../components/header/Header";
import DashboardActions from "../../components/dashboard-actions/DashboardActions";
import LoadingSpinner from "../../components/loading-spinner/LoadingSpinner";
import EmptyState from "../../components/empty-state/EmptyState";
import NotesGrid from "../../components/notes-grid/NotesGrid";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/notes");
      if (Array.isArray(response.data)) {
        setNotes(response.data);
      } else if (response.data && Array.isArray(response.data.notes)) {
        setNotes(response.data.notes);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch notes", err);
      setError("Couldn't load your notes. Please try again.");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDelete = async (id) => {
  try {
    await api.delete(`/notes/${id}`);
    setNotes((currentNotes) => currentNotes.filter(n => n._id !== id));
  } catch (err) {
    console.error("Delete failed", err); //add alert when delete fails
    alert("Failed to delete note");

  }
};

  const filteredNotes = Array.isArray(notes) ? notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div
      className="min-h-screen font-sans text-[#121212] flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: "radial-gradient(circle, #E5E2D9 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Header */}
      <Header
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Sub Header (Search & Actions) */}
        <DashboardActions
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Notes List */}
        {isLoading ? (
  <LoadingSpinner />
) : error ? (
  <div className="text-center py-20 text-[#6B6A63]">
    <p className="mb-4">{error}</p>
    <button
      onClick={fetchNotes}
      className="px-4 py-2 bg-[#F4C430] text-[#121212] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
    >
      Retry
    </button>
  </div>
) : filteredNotes.length === 0 ? (
  <EmptyState searchQuery={searchQuery} />
) : (
  <NotesGrid filteredNotes={filteredNotes} handleDelete={handleDelete} />
)}
      </main>
    </div>
  );
}

export default Dashboard;