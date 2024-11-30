'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  progress: number;
  status: string;
}

export default function ProgressIndicator({ progress, status }: ProgressIndicatorProps) {
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-primary">{status}</span>
        <span className="text-sm font-medium text-primary">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <motion.div
          className="bg-primary h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
} 