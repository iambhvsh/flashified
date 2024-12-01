'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiGlobe } from 'react-icons/fi'
import Link from 'next/link'

export default function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <Link 
          href="https://github.com/iambhvsh/flashified" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FiGithub className="text-xl" />
        </Link>
        <Link 
          href="https://iambhvsh.vercel.app" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FiGlobe className="text-xl" />
        </Link>
      </div>
    </div>
  )
} 