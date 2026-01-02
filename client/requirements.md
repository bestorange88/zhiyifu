## Packages
framer-motion | Page transitions and UI animations
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes
date-fns | Date formatting for chat messages and articles

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
Chat uses SSE (Server-Sent Events) for streaming responses.
