'use client'

import { useState } from 'react'
import { FiZap, FiInfo, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <FiZap className="text-2xl text-primary-500" />
          <h1 className="text-2xl font-medium text-white/90">Flashified</h1>
        </div>
        <motion.button 
          className="p-2 text-white/70 hover:text-white/90 transition-colors"
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiInfo className="text-xl" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <motion.button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white/90"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="text-xl" />
              </motion.button>
              
              <h2 className="text-xl font-medium text-white mb-4">About Flashified</h2>
              <p className="text-white/70 mb-4">
                A powerful bulk image downloader and search tool created by Bhavesh Patil.
              </p>
              <div className="flex gap-4">
                <motion.a 
                  href="https://github.com/iambhvsh/flashified" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  GitHub
                </motion.a>
                <motion.a 
                  href="https://iambhvsh.vercel.app" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Portfolio
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 