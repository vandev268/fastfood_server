import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { DraftItemRepo } from './draft-item.repo'
import { SharedTableRepo } from 'src/shared/repositories/shared-table.repo'
import { SharedVariantRepo } from 'src/shared/repositories/shared-variant.repo'
import {
  AllDraftItemQueryType,
  ChangeDraftItemStatusBodyType,
  ChangeDraftItemTablesBodyType,
  CreateDraftItemBodyType,
  DeleteDraftItemsBodyType,
  DraftItemQueryType,
  UpdateDraftItemBodyType
} from './draft-item.model'
import { DraftItemStatus } from 'src/shared/constants/draft-item.constant'

@Injectable()
export class DraftItemService {
  constructor(
    private readonly draftItemRepo: DraftItemRepo,
    private readonly sharedTableRepo: SharedTableRepo,
    private readonly sharedVariantRepo: SharedVariantRepo
  ) {}

  async verifyDraftItemExists(draftItemId: number) {
    const draftItem = await this.draftItemRepo.findUnique({ id: draftItemId })
    if (!draftItem) {
      throw new NotFoundException('Draft item not found')
    }
    return draftItem
  }

  async verifyTableIdsExist(tableIds: number[]) {
    for (const tableId of tableIds) {
      const table = await this.sharedTableRepo.findUnique({ id: tableId })
      if (!table) {
        throw new NotFoundException(`Table with ID ${tableId} not found`)
      }
    }
  }

  private async verifyVariantAndQuantity(variantId: number, quantity: number) {
    const variant = await this.sharedVariantRepo.findUnique({ id: variantId })
    if (!variant) {
      throw new NotFoundException(`Variant not found`)
    }
    if (variant.stock < 1 || variant.stock < quantity) {
      throw new ConflictException(`Out of stock for variant`)
    }
    return variant
  }

  async list(query: DraftItemQueryType) {
    return await this.draftItemRepo.list(query)
  }

  async findAll(query: AllDraftItemQueryType) {
    return await this.draftItemRepo.findAll(query)
  }

  async create(data: CreateDraftItemBodyType) {
    const variant = await this.verifyVariantAndQuantity(data.variantId, data.quantity)
    const existingDraftItem = await this.draftItemRepo.findUnique({
      draftCode_variantId: { draftCode: data.draftCode, variantId: data.variantId }
    })
    if (existingDraftItem) {
      if (existingDraftItem.quantity + data.quantity > variant.stock) {
        throw new ConflictException('Out of stock for variant')
      }
    }
    return await this.draftItemRepo.create(data)
  }

  async update({ draftItemId, data }: { draftItemId: number; data: UpdateDraftItemBodyType }) {
    const { quantity, status, draftCode, variantId } = await this.verifyDraftItemExists(draftItemId)
    await this.verifyVariantAndQuantity(data.variantId, data.quantity)
    await this.draftItemRepo.update({ where: { id: draftItemId }, data })
    if (quantity !== data.quantity) {
      if (status === DraftItemStatus.Ready || status === DraftItemStatus.Served) {
        await this.draftItemRepo.create({
          draftCode: draftCode + '-term',
          variantId,
          quantity: data.quantity - quantity,
          tableIds: []
        })
      }
    }
    return { message: 'Draft item updated successfully' }
  }

  async changeStatus({ draftItemId, data }: { draftItemId: number; data: ChangeDraftItemStatusBodyType }) {
    const { id, draftCode } = await this.verifyDraftItemExists(draftItemId)
    await this.draftItemRepo.changeStatus({ where: { id }, data })
    if (data.status === DraftItemStatus.Served && draftCode.includes('term')) {
      await this.draftItemRepo.delete({ id })
    }
    return { message: 'Draft item status updated successfully' }
  }

  async changeTables(data: ChangeDraftItemTablesBodyType) {
    const draftItems = await this.draftItemRepo.findManyWithDraftCode({
      draftCode: data.draftCode
    })

    if (draftItems.length === 0) {
      throw new NotFoundException('No draft items found for the given draft code')
    }
    await this.verifyTableIdsExist(data.tableIds)
    await this.draftItemRepo.changeTables({
      draftItemsExist: draftItems,
      data: { tableIds: data.tableIds, draftCode: data.draftCode },
      tablesExist: draftItems[0].tables
    })
    return { message: 'Draft item tables updated successfully' }
  }

  async delete(draftItemId: number) {
    await this.verifyDraftItemExists(draftItemId)
    await this.draftItemRepo.delete({ id: draftItemId })
    return { message: 'Draft item deleted successfully' }
  }

  async deleteMany(data: DeleteDraftItemsBodyType) {
    const draftItems = await this.draftItemRepo.findManyWithDraftCode({
      draftCode: data.draftCode
    })
    if (draftItems.length === 0) {
      throw new NotFoundException('No draft items found for the given draft code')
    }

    for (const draftItem of draftItems) {
      await this.draftItemRepo.delete({ id: draftItem.id })
    }
    return { message: 'Draft items deleted successfully' }
  }
}
