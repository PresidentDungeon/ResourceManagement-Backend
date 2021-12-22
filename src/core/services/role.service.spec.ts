import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { Repository } from "typeorm";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Role } from "../models/role";
import theoretically from "jest-theories";
import { MockRepositories } from "../../infrastructure/error-handling/mock-repositories";

describe('RoleService', () => {
  let service: RoleService;
  let mockRoleRepository: Repository<RoleEntity>;
  let mockContractFactory = new MockRepositories();

  beforeEach(async () => {

    const MockRoleRepository = mockContractFactory.getMockRepository(RoleEntity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, MockRoleRepository],
    }).compile();

    service = module.get<RoleService>(RoleService);
    mockRoleRepository = module.get<Repository<RoleEntity>>(getRepositoryToken(RoleEntity));
  });

  it('Role service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock role repository should be defined', () => {
    expect(mockRoleRepository).toBeDefined();
  });

  //#region FindRoleByName

  it('Calling findRoleByName with invalid name returns error', async () => {

    let role: string = '';
    let errorStringToExcept: string = 'Role must be instantiated';

    await expect(service.findRoleByName(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.findRoleByName(undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.findRoleByName(role)).rejects.toThrow(errorStringToExcept);
    expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(0);
  });

  it('Calling findRoleByName with valid name returns role', async () => {

    let role: string = 'Admin';
    let mockRole: Role = {ID: 1, role: 'Admin'};

    jest.spyOn(mockRoleRepository, "findOne").mockResolvedValueOnce(mockRole);

    await expect(await service.findRoleByName(role)).toBe(mockRole);
    expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findRoleByName with valid name but without any results throws error', async () => {

    let role: string = 'Admin';
    let errorStringToExcept: string = 'The specified role could not be found';

    jest.spyOn(mockRoleRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findRoleByName(role)).rejects.toThrow(errorStringToExcept);
    expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
  });

  describe('Calling find role by name finds role with inserted role title', () => {

    let roleTitle: string;

    const theories = [
      { input: roleTitle = 'User'},
      { input: roleTitle = 'Admin'},
    ];

    theoretically('Correct calls are performed', theories, async theory => {

      jest.spyOn(mockRoleRepository, 'findOne').mockImplementation(() => {let roleEntity: RoleEntity = {ID: 1, role: 'Admin'}; return new Promise(resolve => {resolve(roleEntity);});});

      await expect(await service.findRoleByName(theory.input)).resolves;
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({where: `"role" ILIKE '${theory.input}'`});
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
      .spyOn(mockRoleRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(roles);});});

    let foundRoles: Role[];

    await expect(foundRoles = await service.getRoles()).resolves;
    expect(mockRoleRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(foundRoles).toBe(roles);
  });

  //#endregion

});
