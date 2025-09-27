'use client'

import { useMutation } from 'convex/react'
import { api } from '../../react-native-app/convex/_generated/api'
import { useState } from 'react'

export default function SeedButton() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<any>(null)
  const seedData = useMutation(api.seedData.seedData)

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const result = await seedData()
      setResult(result)
    } catch (error) {
      setResult({ error: error?.toString() })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-2">Database Seeding</h3>
      <button
        onClick={handleSeedData}
        disabled={isSeeding}
        className={`px-4 py-2 rounded-lg font-medium ${
          isSeeding 
            ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
        }`}
      >
        {isSeeding ? 'Seeding Database...' : 'Seed Database with Sample Data'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-white rounded border">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}