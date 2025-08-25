import { config } from 'dotenv'
import { RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UtilService } from 'src/shared/services/util.service'

config()

const prismaService = new PrismaService()
const utilService = new UtilService()

const createBaseData = async () => {
  const roles = await prismaService.role.findMany()
  if (roles.length > 0) {
    console.log('Base data already exists in the database.')
    throw new Error('Base data already exists in the database.')
  }

  await prismaService.role.createMany({
    data: [
      {
        name: RoleName.Admin,
        description: 'Administrator with full access'
      },
      {
        name: RoleName.Manager,
        description: 'Manager with limited access'
      },
      {
        name: RoleName.Employee,
        description: 'Employee with basic access'
      },
      {
        name: RoleName.Client,
        description: 'Client with access to their own data'
      }
    ]
  })
  console.log('Roles created successfully.')
  const email = process.env.EMAIL_ADMIN_INIT as string
  const password = await utilService.hash(process.env.PASSWORD_ADMIN_INIT as string)
  const adminRole = await prismaService.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin
    }
  })
  await prismaService.user.create({
    data: {
      email,
      password,
      roleId: adminRole.id,
      name: 'Admin',
      phoneNumber: '0123456789',
      dateOfBirth: new Date('2003-08-26')
    }
  })
  console.log('Admin user created successfully')
  console.log('Base data creation completed successfully.')
}

console.log('Creating base data...')
createBaseData()
