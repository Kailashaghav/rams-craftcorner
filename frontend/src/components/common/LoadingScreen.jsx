export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎁</div>
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">Crafting your experience...</p>
      </div>
    </div>
  );
}
