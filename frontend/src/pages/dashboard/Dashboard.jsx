import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Plus, LogOut, FileText, Trash2, Edit3, User } from "lucide-react";
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

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setIsLoading(true);
    try {
      const response = await api.get("/api/notes");
      if (Array.isArray(response.data)) {
        setNotes(response.data);
      } else if (response.data && Array.isArray(response.data.notes)) {
        setNotes(response.data.notes);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch notes, using fallback for UI demo", err);
      // Dummy data for frontend preview
      setNotes([
        { _id: "1", title: "Groceries", content: "Milk, Eggs, Bread, Butter, Coffee beans, Oat milk...", updatedAt: new Date().toISOString() },
        { _id: "2", title: "Trip to Paris", content: "Eiffel tower, Louvre, Disneyland, Seine river cruise.", updatedAt: new Date(Date.now() - 86400000).toISOString() },
        { _id: "3", title: "Project Ideas", content: "A notebook themed notes app, maybe use React and Framer Motion.", updatedAt: new Date(Date.now() - 172800000).toISOString() },
        { _id: "4", title: "Daily Journal", content: "Today was a good day. Finally figured out that tricky React bug.", updatedAt: new Date(Date.now() - 259200000).toISOString() },
      ]);
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
      await api.delete(`/api/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      // Optimistic delete for demo
      setNotes(notes.filter(n => n._id !== id));
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