import { cn } from '@/lib/utils'

interface NexusLogoProps {
  className?: string
}

export function NexusLogo({ className }: NexusLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-primary', className)}
    >
      <path
        d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M16 8L22.0622 11.5V18.5L16 22L9.93782 18.5V11.5L16 8Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M16 8L22.0622 11.5V18.5L16 22L9.93782 18.5V11.5L16 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="15" r="3" fill="currentColor" />
    </svg>
  )
}
