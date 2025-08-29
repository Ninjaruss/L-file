'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the admin app to avoid SSR issues with react-admin
const AdminApp = dynamic(() => import('./AdminApp'), {
  ssr: false,
  loading: () => <div>Loading admin dashboard...</div>
})

export default function AdminPage() {
  return <AdminApp />
}