import BackendTest from '../../components/BackendTest'
import SeedButton from '../../components/SeedButton'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <SeedButton />
        </div>
        <BackendTest />
      </div>
    </div>
  )
}