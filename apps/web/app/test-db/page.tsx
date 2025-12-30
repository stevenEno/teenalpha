import { createBrowserClient } from "@teen-alpha/database/client";

export default async function TestDBPage() {
    const supabase = createBrowserClient();

    // Test connection by querying profiles
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
  
    return (<div className="p-8">
        <h1 className="text-2xl font-bold">Test Database Connection</h1>
        <p className="text-gray-600">This page tests the connection to the database.</p>
        {error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">Error:</p>
                <pre className="text-sm">{JSON.stringify(error, null, 2)}</pre>
            </div>
        ) : (
            <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-green-800 font-semibold">✓ Connected successfully!</p>
                <p className="text-sm mt-2">Found {data?.length || 0} profiles</p>
                {data && data.length > 0 && (
                    <pre className="text-xs mt-2 overflow-auto">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>
        )}
        </div>
    );
}