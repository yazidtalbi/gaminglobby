'use client'

import { NavbarSearchModal } from './NavbarSearchModal'
import { useState } from 'react'

export function PurpleMatchmakingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-title text-base font-bold uppercase transition-colors duration-200 rounded-md"
      >
        START MATCHMAKING
      </button>
      <NavbarSearchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

