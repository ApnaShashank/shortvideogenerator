import { auth, currentUser } from '@clerk/nextjs/server'
import { connectToDatabase } from '@/lib/mongodb/client'
import { User } from '@/lib/mongodb/models'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  let authResult: any = null
  let userResult: any = null
  let dbStatus = 'Not Connected'
  let mongoUser: any = null

  try {
    authResult = await auth()
  } catch (e: any) {
    authResult = { error: e.message }
  }

  try {
    const user = await currentUser()
    if (user) {
      userResult = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    } else {
      userResult = 'No current user'
    }
  } catch (e: any) {
    userResult = { error: e.message }
  }

  try {
    await connectToDatabase()
    dbStatus = 'Connected Successfully'
    if (authResult?.userId) {
      const u = await User.findOne({ userId: authResult.userId })
      mongoUser = u ? JSON.parse(JSON.stringify(u)) : 'Not found in MongoDB'
    }
  } catch (e: any) {
    dbStatus = `Error: ${e.message}`
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-card border rounded-lg shadow-sm space-y-6">
      <h1 className="text-2xl font-bold">LyricsFlow AI Authentication & DB Debugger</h1>

      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Clerk Auth Status</h2>
        <pre className="p-3 bg-muted rounded text-xs overflow-auto">
          {JSON.stringify({
            userId: authResult?.userId,
            sessionId: authResult?.sessionId,
            orgId: authResult?.orgId,
          }, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Clerk Current User Status</h2>
        <pre className="p-3 bg-muted rounded text-xs overflow-auto">
          {JSON.stringify(userResult, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">MongoDB Status</h2>
        <p className="text-sm font-medium">Connection: <span className="text-primary">{dbStatus}</span></p>
        <h3 className="text-sm font-semibold mt-2">MongoDB User Record:</h3>
        <pre className="p-3 bg-muted rounded text-xs overflow-auto">
          {JSON.stringify(mongoUser, null, 2)}
        </pre>
      </div>
    </div>
  )
}
