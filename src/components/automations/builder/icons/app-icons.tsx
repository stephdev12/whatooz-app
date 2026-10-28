import React from 'react'

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
}

/**
 * Official Telegram SVG Logo
 */
export function TelegramIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="120" cy="120" r="120" fill="url(#tg_grad)" />
      <path
        d="M54 117.5L174.5 68.5C180 66 186 70.5 184 76.5L163.5 173C162 180 154 182.5 149 178.5L114.5 150.5L98 166.5C95.5 169 91.5 167.5 91 164L95.5 130L159 72.5C161 70.5 158.5 68 156 69.5L77.5 119L56 112C50.5 110.5 50.5 103 56 101"
        fill="white"
      />
      <defs>
        <linearGradient id="tg_grad" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Official WhatsApp SVG Logo
 */
export function WhatsAppIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M17.5 14.3c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3.1-.1 0-.3 0-.4 0-.1-.5-1.2-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3 1 2.6 1.1 2.7.1.2 1.9 2.9 4.6 4.1.6.3 1.1.5 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"
        fill="white"
      />
    </svg>
  )
}

/**
 * Official Google Sheets SVG Logo
 */
export function GoogleSheetsIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="12" y="6" width="40" height="52" rx="4" fill="#0F9D58" />
      <path d="M38 6L52 20H38V6Z" fill="#87CEAC" opacity="0.8" />
      <rect x="20" y="26" width="24" height="24" rx="2" fill="white" />
      <path d="M20 34H44" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 42H44" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 26V50" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Official Google Calendar SVG Logo
 */
export function GoogleCalendarIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="10" y="10" width="44" height="44" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M10 18C10 13.5817 13.5817 10 18 10H46C50.4183 10 54 13.5817 54 18V24H10V18Z" fill="#4285F4" />
      <text
        x="32"
        y="45"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize="18"
        fontWeight="bold"
        fill="#1A73E8"
      >
        31
      </text>
    </svg>
  )
}

/**
 * Official Notion SVG Logo
 */
export function NotionIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="currentColor" fillOpacity="0.06" />
      <path
        d="M21.5 24.5L64.5 18C67 17.6 69.2 19.5 69.4 22L78.5 76C78.8 77.8 77.5 79.5 75.6 79.7L31.5 84.5C29 84.8 26.8 83 26.5 80.5L18.5 28C18.2 26.2 19.6 24.7 21.5 24.5Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M33 34L59 30.5L62.5 66.5L36.5 70L33 34Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <text
        x="48"
        y="60"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="34"
        fontWeight="900"
        fill="currentColor"
      >
        N
      </text>
    </svg>
  )
}

/**
 * Payment / SasPay Wallet Logo
 */
export function PaymentCardIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="8" y="14" width="48" height="36" rx="6" fill="#10B981" />
      <rect x="8" y="22" width="48" height="8" fill="#047857" />
      <rect x="14" y="36" width="12" height="7" rx="2" fill="#FBBF24" />
      <circle cx="44" cy="40" r="4" fill="white" fillOpacity="0.7" />
      <circle cx="48" cy="40" r="4" fill="white" fillOpacity="0.5" />
    </svg>
  )
}

/**
 * Webhook / HTTP API Logo
 */
export function WebhookIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="32" cy="32" r="26" fill="#6366F1" fillOpacity="0.1" stroke="#6366F1" strokeWidth="3" />
      <path d="M16 32C16 32 22 20 32 20C42 20 48 32 48 32C48 32 42 44 32 44C22 44 16 32 16 32Z" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="5" fill="#6366F1" />
      <path d="M32 6V12M32 52V58M6 32H12M52 32H58" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * AI Agent Whatooz Logo
 */
export function AiAgentIcon({ size = 28, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="32" cy="32" r="26" fill="url(#ai_grad)" />
      <path
        d="M32 18L35.5 28.5L46 32L35.5 35.5L32 46L28.5 35.5L18 32L28.5 28.5L32 18Z"
        fill="white"
      />
      <circle cx="44" cy="20" r="3" fill="#FDE047" />
      <defs>
        <linearGradient id="ai_grad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FE5105" />
          <stop offset="1" stopColor="#9333EA" />
        </linearGradient>
      </defs>
    </svg>
  )
}
