const fs = require('fs')
const path = require('path')

const filesToUpdate = [
  'src/app/api/templates/[id]/validate/route.ts',
  'src/app/api/templates/[id]/submit/route.ts',
  'src/app/api/templates/[id]/route.ts'
]

const basePath = path.join(__dirname, '..')

for (const file of filesToUpdate) {
  const fullPath = path.join(basePath, file)
  let content = fs.readFileSync(fullPath, 'utf-8')
  
  content = content.replace(
    /export async function (GET|POST|PATCH|DELETE)\(request: Request, \{ params \}: \{ params: \{ id: string \} \}\) \{/g,
    `export async function $1(request: Request, props: { params: Promise<{ id: string }> }) {\n  const params = await props.params;`
  )
  
  fs.writeFileSync(fullPath, content)
  console.log('Updated', file)
}
