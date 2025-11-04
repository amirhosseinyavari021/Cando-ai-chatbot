import React from 'react'

const Ctx = React.createContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>({
  open: false,
  setOpen: () => {},
})

export const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>
}

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const { setOpen } = React.useContext(Ctx)
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
    </div>
  )
}

export const TooltipContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open } = React.useContext(Ctx)
  return (
    <div
      role="tooltip"
      className={`absolute z-50 bottom-full mb-2 start-1/2 -translate-x-1/2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg whitespace-nowrap transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0 invisible'}`}
    >
      {children}
      <div className="absolute top-full start-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
    </div>
  )
}
