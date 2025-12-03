export default function SectionHeader({ 
  title, 
  actionLabel, 
  onAction 
}: { 
  title: string; 
  actionLabel?: string; 
  onAction?: () => void 
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-responsive-lg sm:text-responsive-xl font-bold text-gradient">
        {title}
      </h2>
      {actionLabel && (
        <button 
          onClick={onAction} 
          className="chip hover:scale-105 transition-transform duration-200 hover:bg-slate-700/60"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}



