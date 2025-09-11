export function ImportCsvHint() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-blue-900 mb-1">CSV Import Format</h4>
          <p className="text-sm text-blue-700">
            Required columns: <span className="font-mono bg-blue-100 px-1 rounded">name</span>,{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">mobile</span>,{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">email</span>,{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">address</span>,{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">tags</span> (comma-separated)
          </p>
        </div>
      </div>
    </div>
  )
}
