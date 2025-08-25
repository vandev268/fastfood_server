import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod } from 'src/shared/constants/http.constant'
import { RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prismaService = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3005)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  const permissionsInDB = await prismaService.permission.findMany({})

  const availableRoutes: { path: string; method: keyof typeof HTTPMethod; name: string; module: string }[] =
    router.stack
      .map((layer) => {
        if (layer.route) {
          const path = layer.route?.path
          const method = String(layer.route?.stack[0].method).toUpperCase()
          const name = method + '-' + path
          const module = String(path.split('/')[1]).toUpperCase()
          return {
            path,
            method,
            name,
            module
          }
        }
      })
      .filter((item) => item !== undefined)

  const availableRoutesObj = availableRoutes.reduce((acc, route) => {
    const key = route.method + '-' + route.path
    acc[key] = route
    return acc
  }, {})

  const permissionsInDBObj = permissionsInDB.reduce((acc, route) => {
    const key = route.method + '-' + route.path
    acc[key] = route
    return acc
  }, {})

  // Trong DB có nhưng không có trong routes hiện tại
  const permissionsToDelete = permissionsInDB.filter((permission) => {
    const key = permission.method + '-' + permission.path
    return availableRoutesObj[key] === undefined
  })

  // Trong routes hiện tại có nhưng không có trong DB
  const permissionsToCreate = availableRoutes.filter((route) => {
    const key = route.method + '-' + route.path
    return permissionsInDBObj[key] === undefined
  })

  if (permissionsToDelete.length > 0) {
    const result = await prismaService.permission.deleteMany({
      where: {
        id: {
          in: permissionsToDelete.map((permission) => permission.id)
        }
      }
    })
    console.log(`Deleted ${result.count} permissions`)
  } else {
    console.log('No permissions to delete')
  }

  if (permissionsToCreate.length > 0) {
    const result = await prismaService.permission.createMany({
      data: permissionsToCreate,
      skipDuplicates: true
    })
    console.log(`Created ${result.count} permissions`)
  } else {
    console.log('No permissions to add')
  }

  // Gán Permission cho các Role
  const updatedPermissionsInDB = await prismaService.permission.findMany({})
  const adminPermissionIds = updatedPermissionsInDB.map((permission) => ({ id: permission.id }))

  // const clientModulePermissions = ['AUTH', 'PROFILE', 'MEDIA', 'CART', 'ORDERS']
  // const clientPermissionIds = updatedPermissionsInDB
  //   .filter((permission) => clientModulePermissions.includes(permission.module))
  //   .map((permission) => ({ id: permission.id }))
  await Promise.all([updateRole(RoleName.Admin, adminPermissionIds)])

  process.exit(0)
}

const updateRole = async (name: string, permissionIds: { id: number }[]) => {
  const role = await prismaService.role.findFirstOrThrow({
    where: {
      name,
      deletedAt: null
    }
  })
  await prismaService.role.update({
    where: {
      id: role.id
    },
    data: {
      permissions: {
        set: permissionIds
      }
    }
  })
  console.log(`Updated role ${name} with ${permissionIds.length} permissions`)
}

bootstrap()
