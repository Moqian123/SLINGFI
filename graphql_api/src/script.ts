// 1
import { PrismaClient } from '@prisma/client'
 
// 2
const prisma = new PrismaClient()
 
// 3
async function main() {
  const newLink = await prisma.link.create({
        data: {
          description: 'Fullstack tutorial for GraphQL',
          url: 'www.howtographql.com'
        }
      })
  const allLinks = await prisma.link.findMany()

  const newPermitToken = await prisma.permit_tokens.create({
    data: {
        updatedAt: new Date(),//Date.now().toString(),
        permit_tokens_account: 'AT1LGpYqrbspehZ7jR7T9hv9dRgXG9Fd9JrbiQ1oDQXR',
        mint_token: 'DnQGc3gjqpSsJdNwnNt3cLZ2F9QVW5muTgJqC8W7toGS',
        mint_token_name: 'SOL',
        status: ''
    }
  })
  const allPermitTokens = await prisma.permit_tokens.findMany()
  console.log(allLinks)
  console.log(allPermitTokens)
}
 
// 4
main()
  // 5
  .finally(async () => {
    await prisma.$disconnect()
  })