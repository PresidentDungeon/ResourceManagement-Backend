import { getRepositoryToken } from "@nestjs/typeorm";
import { FindManyOptions } from "typeorm";
import { EntityClassOrSchema } from "@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type";

export class MockRepositories {

  constructor() {}

  public getMockRepository<T extends EntityClassOrSchema>(entitySchema: T): any{

    const mockRepository = {
      provide: getRepositoryToken(entitySchema),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<T>) => {}),
        findOne: jest.fn(() => {}),
        save: jest.fn((entitySchema: T) => { return new Promise(resolve => {resolve(entitySchema);});}),
        delete: jest.fn((entitySchema: T) => { return new Promise(resolve => {resolve(entitySchema);});}),
        create: jest.fn((entitySchema: T) => {return new Promise(resolve => {resolve(entitySchema);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return selectQueryBuilder}),
      })
    }

    const selectQueryBuilder: any = {
      leftJoinAndSelect: jest.fn(() => selectQueryBuilder),
      leftJoin: () => selectQueryBuilder,
      select: () => selectQueryBuilder,
      addSelect: () => selectQueryBuilder,
      groupBy: () => selectQueryBuilder,
      addGroupBy: () => selectQueryBuilder,
      andWhere: jest.fn(() => selectQueryBuilder),
      where: jest.fn(() => selectQueryBuilder),
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getRawOne: jest.fn(() => {}),
      getRawMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
      orderBy: jest.fn(() => {}),
      update: jest.fn(() => {return updateQueryBuilder}),
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const updateQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const deleteQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      from: () => deleteQueryBuilder,
      andWhere: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    return mockRepository;
  }
}

