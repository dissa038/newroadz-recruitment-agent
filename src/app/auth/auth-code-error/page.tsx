export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't complete your authentication. This could be due to:
        </p>
        <ul className="text-left text-sm text-gray-500 mb-6 space-y-2">
          <li>• The authentication link has expired</li>
          <li>• The link has already been used</li>
          <li>• There was a network error</li>
        </ul>
        <div className="space-y-3">
          <a
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
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