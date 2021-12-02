import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { Repository } from "typeorm";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Role } from "../models/role";
import theoretically from "jest-theories";

describe('RoleService', () => {
  let service: RoleService;
  let mockRepository: Repository<RoleEntity>;

  beforeEach(async () => {

    const MockProvider = {
      provide: getRepositoryToken(RoleEntity),
      useFactory: () => ({
        findOne: jest.fn(() => {let roleEntity: RoleEntity = {ID: 1, role: 'Admin'}; return new Promise(resolve => {resolve(roleEntity);});}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, MockProvider],
    }).compile();

    service = module.get<RoleService>(RoleService);
    mockRepository = module.get<Repository<RoleEntity>>(getRepositoryToken(RoleEntity));
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('mock repository should be defined', () => {
    expect(mockRepository).toBeDefined();
  });

  //#region FindRoleByName

  it('Calling findRoleByName with invalid name returns error', async () => {

    let role: string = '';
    let errorStringToExcept: string = 'Role must be instantiated';

    await expect(service.findRoleByName(null)).rejects.toEqual(errorStringToExcept);
    await expect(service.findRoleByName(undefined)).rejects.toEqual(errorStringToExcept);
    await expect(service.findRoleByName(role)).rejects.toEqual(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(0);
  });

  it('Calling findRoleByName with valid name returns role', async () => {

    let role: string = 'Admin';
    let mockRole: Role = {ID: 1, role: 'Admin'};

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(mockRole);

    await expect(await service.findRoleByName(role)).toBe(mockRole);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findRoleByName with valid name but without any results throws error', async () => {

    let role: string = 'Admin';
    let mockRole: Role = {ID: 1, role: 'User'};
    let errorStringToExcept: string = 'The specified role could not be found';

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findRoleByName(role)).rejects.toEqual(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  describe('Calling find role by name finds role with inserted role title', () => {

    let roleTitle: string;

    const theories = [
      { input: roleTitle = 'User'},
      { input: roleTitle = 'Admin'},
    ];

    theoretically('Correct calls are performed', theories, async theory => {

      await expect(await service.findRoleByName(theory.input)).resolves;
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({where: `"role" ILIKE '${theory.input}'`});
    })
  });

  //#endregion

  //#region GetRoles

  it('Calling getRoles returns all stored roles', async () => {

    const roles: Role[] = [
      {ID: 1, role: 'user'},
      {ID: 2, role: 'admin'},
    ]

    jest
      .spyOn(mockRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(roles);});});

    let foundRoles: Role[];

    await expect(foundRoles = await service.getRoles()).resolves;
    expect(mockRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(foundRoles).toBe(roles);
  });

  //#endregion

});
