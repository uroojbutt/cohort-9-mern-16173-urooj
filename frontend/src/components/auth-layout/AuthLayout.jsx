function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-white font-sans px-4 sm:px-6 py-8 relative"
      style={{
        backgroundImage: "radial-gradient(circle, #E5E2D9 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Wordmark with highlighter signature */}
      <div className="relative mb-5 inline-block">
        <span className="absolute left-[-6px] right-[-4px] top-[45%] h-[40%] bg-[#F4C430] -skew-x-6 z-0" />
        <span className="relative z-10 text-xl sm:text-2xl font-display font-semibold text-[#121212] tracking-tight">
          Notes
        </span>
      </div>

      <div className="w-full max-w-sm bg-[#FAFAF8] border border-[#E5E2D9] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;