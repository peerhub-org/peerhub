import { ObjectId, type Collection, type OptionalUnlessRequiredId, type Filter } from 'mongodb'
import type { Mapper } from '../mappers/base_mapper.ts'

/** Base repository with shared CRUD operations. */
export abstract class BaseRepository<
  TEntity extends { id: string | null },
  TDocument extends { _id: ObjectId },
> {
  protected readonly collection: Collection<TDocument>
  protected readonly mapper: Mapper<TEntity, TDocument>

  constructor(collection: Collection<TDocument>, mapper: Mapper<TEntity, TDocument>) {
    this.collection = collection
    this.mapper = mapper
  }

  async create(entity: TEntity): Promise<TEntity> {
    const document = {
      _id: entity.id === null ? new ObjectId() : new ObjectId(entity.id),
      ...this.mapper.toFields(entity),
    } as TDocument
    await this.collection.insertOne(document as OptionalUnlessRequiredId<TDocument>)
    return this.mapper.toEntity(document)
  }

  async update(entity: TEntity): Promise<TEntity> {
    if (entity.id === null) throw new Error('Cannot update entity without an id')

    const current = await this.findById(entity.id)
    if (current === null) throw new Error(`Document with id ${entity.id} not found`)

    const fields = this.mapper.toFields(entity, current)
    await this.collection.updateOne({ _id: current._id } as Filter<TDocument>, {
      $set: fields as Partial<TDocument>,
    })
    return this.mapper.toEntity({ ...current, ...fields })
  }

  /** Create the entity, or update it when it has an id. */
  async save(entity: TEntity): Promise<TEntity> {
    return entity.id === null ? this.create(entity) : this.update(entity)
  }

  protected async findById(id: string): Promise<TDocument | null> {
    return (await this.collection.findOne({
      _id: new ObjectId(id),
    } as Filter<TDocument>)) as TDocument | null
  }
}
