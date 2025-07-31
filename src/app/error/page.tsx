export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          An error occurred while processing your request. Please try again.
        </p>
        <div className="space-y-3">
          <a
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </a>
          <a
            href="/"
            className="block w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}