import { z } from 'zod'
import { OrderDetailSchema } from 'src/shared/models/shared-order.model'
import { UserDetailSchema, UserSchema } from 'src/shared/models/shared-user.model'
import { ReservationDetailSchema } from 'src/shared/models/shared-reservation.model'

export const ProfileSchema = UserDetailSchema

export const ProfileDetailSchema = ProfileSchema.extend({
  orders: z.array(OrderDetailSchema),
  reservations: z.array(ReservationDetailSchema)
})

export const UpdateProfileBodySchema = UserSchema.pick({
  name: true,
  avatar: true,
  phoneNumber: true,
  dateOfBirth: true
}).strict()

export const ChangeProfilePasswordBodySchema = UserSchema.pick({
  password: true
})
  .extend({
    newPassword: z.string().min(3),
    confirmNewPassword: z.string()
  })
  .strict()
  .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
    if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password and confirm new password must match',
        path: ['confirmNewPassword']
      })
    }
  })

export type ProfileType = z.infer<typeof ProfileSchema>
export type ProfileDetailType = z.infer<typeof ProfileDetailSchema>
export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>
export type ChangeProfilePasswordBodyType = z.infer<typeof ChangeProfilePasswordBodySchema>
