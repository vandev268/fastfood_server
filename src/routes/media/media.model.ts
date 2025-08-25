import { z } from 'zod'

export const UploadFilesResSchema = z.object({
  data: z.array(
    z.object({
      url: z.string()
    })
  )
})

export type UploadFilesResType = z.infer<typeof UploadFilesResSchema>
