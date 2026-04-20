export interface IRepository<T, TId extends string = string> {
  findById(id: TId): Promise<T | null>;
  save(entity: T): Promise<T>;
}
