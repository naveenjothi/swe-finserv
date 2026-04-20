import { randomUUID } from 'crypto';

export abstract class BaseEntity<TId extends string = string> {
  protected readonly _id: TId;
  protected readonly _createdAt: Date;

  protected constructor(id?: TId, createdAt?: Date) {
    this._id = (id ?? (randomUUID() as TId)) as TId;
    this._createdAt = createdAt ?? new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  equals(other?: BaseEntity<TId>): boolean {
    if (other === undefined || other === null) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
