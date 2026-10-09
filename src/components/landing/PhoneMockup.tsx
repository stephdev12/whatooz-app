'use client'

import React from 'react'

interface PhoneMockupProps {
  imageSrc?: string
  videoSrc?: string
  chatContactName?: string
  chatStatus?: string
  messages?: Array<{
    type: 'incoming' | 'outgoing' | 'catalog' | 'button'
    text?: string
    time?: string
    product?: {
      title: string
      price: string
      desc?: string
    }
  }>
}

export function PhoneMockup({
  imageSrc,
  videoSrc,
  chatContactName = 'Whatooz Assistant',
  chatStatus = 'en ligne',
  messages = [],
}: PhoneMockupProps) {
  return (
    <div className="phone-mockup-wrapper">
      <div className="phone-device">
        {/* Dynamic Island Notch */}
        <div className="phone-notch" />

        <div className="phone-inner-screen">
          {videoSrc ? (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt="Aperçu WhatsApp"
              className="w-full h-full object-cover"
            />
          ) : (
            /* Native WhatsApp Simulator Interface (Placeholder until user images) */
            <>
              {/* WhatsApp App Header */}
              <div className="wa-screen-header">
                <div className="w-2 h-2 border-l-2 border-b-2 border-white rotate-45 shrink-0 ml-1" />
                <div className="w-8 h-8 rounded-full bg-[#128c7e] text-white flex items-center justify-center font-bold text-xs shrink-0 ml-1 border border-white/20">
                  {chatContactName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-tight truncate text-white">
                    {chatContactName}
                  </p>
                  <p className="text-[10px] text-emerald-200 leading-tight">
                    {chatStatus}
                  </p>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="wa-screen-body">
                {messages.map((msg, idx) => {
                  if (msg.type === 'incoming') {
                    return (
                      <div key={idx} className="wa-bubble-incoming">
                        <p>{msg.text}</p>
                        {msg.time && (
                          <span className="text-[9px] text-zinc-400 block text-right mt-0.5">
                            {msg.time}
                          </span>
                        )}
                      </div>
                    )
                  }

                  if (msg.type === 'outgoing') {
                    return (
                      <div key={idx} className="wa-bubble-outgoing">
                        <p>{msg.text}</p>
                        {msg.time && (
                          <span className="text-[9px] text-emerald-700 block text-right mt-0.5">
                            {msg.time} ✓✓
                          </span>
                        )}
                      </div>
                    )
                  }

                  if (msg.type === 'catalog' && msg.product) {
                    return (
                      <div key={idx} className="wa-bubble-catalog">
                        <div className="h-20 bg-zinc-200 flex items-center justify-center text-zinc-400 text-[10px] font-medium border-b border-zinc-100">
                          Photo du produit
                        </div>
                        <div className="p-2.5">
                          <p className="font-semibold text-xs text-zinc-900 leading-tight">
                            {msg.product.title}
                          </p>
                          <p className="font-bold text-xs text-[#fe5105] mt-0.5 font-mono">
                            {msg.product.price}
                          </p>
                          <button
                            type="button"
                            className="mt-2 w-full py-1.5 rounded bg-[#fe5105] text-white text-[10px] font-semibold text-center border-0 cursor-default"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
