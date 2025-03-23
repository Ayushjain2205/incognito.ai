import { LockOpenIcon as LockClosedIcon } from "lucide-react"

export function Header() {
  return (
    <header className="w-full py-6 px-4 flex justify-center items-center border-b border-foreground/5">
      <div className="flex items-center gap-2">
        <LockClosedIcon className="w-5 h-5 text-accent" />
        <h1 className="text-xl font-mono tracking-tighter text-foreground">incognito.ai</h1>
      </div>
      <div className="absolute right-4 hidden sm:flex items-center gap-2 text-xs text-fg-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="font-mono">SECURE</span>
        </span>
      </div>
    </header>
  )
}

