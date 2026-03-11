'use client';

export function HabitForm() {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Habit Name</label>
        <input 
          id="name" 
          type="text" 
          placeholder="e.g., Lunch, Deep Work" 
          className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
          <input 
            id="duration" 
            type="number" 
            defaultValue={45}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">Priority Level</label>
          <select 
            id="priority"
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm bg-white"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="timeStart" className="text-sm font-medium">Earliest Start Time</label>
          <input 
            id="timeStart" 
            type="time" 
            defaultValue="11:30"
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="timeEnd" className="text-sm font-medium">Latest End Time</label>
          <input 
            id="timeEnd" 
            type="time" 
            defaultValue="13:30"
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit"
          className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900"
        >
          Save Habit
        </button>
      </div>
    </form>
  );
}
