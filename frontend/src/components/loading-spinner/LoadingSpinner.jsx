function LoadingSpinner() {
  return (
   <div className="flex justify-center py-20" role="status">
  <div className="w-8 h-8 border-4 border-[#E5E2D9] border-t-[#F4C430] rounded-full animate-spin"></div>
  <span className="sr-only">Loading...</span>
</div>
  );
}

export default LoadingSpinner;