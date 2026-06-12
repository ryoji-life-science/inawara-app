import { getFields } from '@/actions/fields'
import { MainApp } from '@/components/main-app'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const fields = await getFields()
    return <MainApp initialFields={fields} />
  } catch (error) {
    console.error('DB接続エラー:', error)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">接続エラー</h1>
          <p className="text-muted-foreground">
            データベースに接続できませんでした。環境変数を確認してください。
          </p>
          <pre className="mt-4 text-xs text-red-500 bg-red-50 p-3 rounded-lg max-w-md overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    )
  }
}
