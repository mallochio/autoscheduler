export function RightPanel() {
  return (
    <aside className="w-80 border-l border-zinc-200 bg-white flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-zinc-100">
        <h2 className="text-lg font-medium">Priorities</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="p-3 border border-zinc-200 rounded-lg bg-zinc-50">
            <h3 className="text-sm font-medium">Launch MVP</h3>
            <p className="text-xs text-zinc-500 mt-1">High Priority</p>
          </div>
          <div className="p-3 border border-zinc-200 rounded-lg bg-zinc-50">
            <h3 className="text-sm font-medium">Write Documentation</h3>
            <p className="text-xs text-zinc-500 mt-1">Medium Priority</p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-zinc-100">
        <h2 className="text-lg font-medium mb-4">Tasks</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-zinc-300" />
            <span className="text-sm">Review PRs</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-zinc-300" />
            <span className="text-sm">Email Investors</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
