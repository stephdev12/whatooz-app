const fs = require('fs')
const path = require('path')

const filesToUpdate = [
  'src/app/api/templates/[id]/validate/route.ts',
  'src/app/api/templates/[id]/submit/route.ts',
  'src/app/api/templates/[id]/route.ts',
  'src/app/api/templates/route.ts'
]

const basePath = path.join(__dirname, '..')

for (const file of filesToUpdate) {
  const fullPath = path.join(basePath, file)
  let content = fs.readFileSync(fullPath, 'utf-8')
  
  content = content.replace(/createClient\(cookies\(\)\)/g, `await createClient()`)
  // Also remove import { cookies } from 'next/headers' if it's there
  content = content.replace(/import \{ cookies \} from 'next\/headers'\n?/, '')
  
  fs.writeFileSync(fullPath, content)
  console.log('Updated', file)
}
