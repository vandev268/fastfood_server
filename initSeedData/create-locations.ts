import { PrismaService } from 'src/shared/services/prisma.service'
const prismaService = new PrismaService()

const createLocation = async () => {
  const provinceCount = await prismaService.province.count()
  if (provinceCount > 0) {
    console.log('Locations already exist in the database.')
    throw new Error('Locations already exist in the database.')
  }
  console.log('Fetching locations from API...')

  const locations = await fetch('https://esgoo.net/api-tinhthanh/4/0.htm')
    .then((res) => res.json())
    .then((data) => data.data)

  for (const province of locations) {
    const p = await prismaService.province.create({
      data: {
        name: province.full_name,
        nameEn: province.full_name_en,
        latitude: province.latitude,
        longitude: province.longitude
      }
    })

    for (const district of province.data2) {
      const d = await prismaService.district.create({
        data: {
          name: district.full_name,
          nameEn: district.full_name_en,
          latitude: district.latitude,
          longitude: district.longitude,
          provinceId: p.id
        }
      })

      for (const ward of district.data3) {
        await prismaService.ward.create({
          data: {
            name: ward.full_name,
            nameEn: ward.full_name_en,
            latitude: ward.latitude,
            longitude: ward.longitude,
            districtId: d.id
          }
        })
      }
    }
  }
  console.log('Locations created successfully!')
}

console.log('Creating locations...')
createLocation()
