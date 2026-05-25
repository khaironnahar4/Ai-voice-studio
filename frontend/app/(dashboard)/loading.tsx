// Next.js automatically shows this while page data loads

'use client';

import { useMemo } from 'react';

const generateBarHeights = () => 
  Array.from({ length: 7 }).map(() => 30 + Math.random() * 30);

export default function DashboardLoading() {
  const barHeights = useMemo(() => generateBarHeights(), []);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl space-y-6">

      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg skeleton"/>
          <div className="h-4 w-72 rounded skeleton"/>
        </div>
        <div className="h-10 w-36 rounded-xl skeleton shrink-0"/>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}
               className="rounded-xl border border-[#282846] bg-[#141424] p-4 md:p-5">
            <div className="w-8 h-8 rounded-lg skeleton mb-3"/>
            <div className="h-7 w-20 rounded skeleton mb-1.5"/>
            <div className="h-3 w-28 rounded skeleton"/>
          </div>
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-xl border border-[#282846]
                        bg-[#141424] p-5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded skeleton"/>
              <div className="h-3 w-24 rounded skeleton"/>
            </div>
            <div className="h-4 w-16 rounded skeleton"/>
          </div>
          <div className="h-2 w-full rounded-full skeleton"/>
          <div className="flex items-end gap-1.5 h-16 mt-4">
            {barHeights.map((height, i) => (
              <div key={i} className="flex-1 rounded-sm skeleton"
                   style={{ height: `${height}%` }}/>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[#282846]
                        bg-[#141424] p-5 space-y-3">
          <div className="flex justify-between mb-4">
            <div className="h-4 w-32 rounded skeleton"/>
            <div className="h-4 w-12 rounded skeleton"/>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 rounded-full skeleton shrink-0"/>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full rounded skeleton"/>
                <div className="h-2.5 w-2/3 rounded skeleton"/>
              </div>
              <div className="h-3 w-10 rounded skeleton shrink-0"/>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}