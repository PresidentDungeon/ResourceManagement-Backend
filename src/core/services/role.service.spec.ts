import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { Repository } from "typeorm";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Role } from "../models/role";

describe('RoleService', () => {
  let service: RoleService;
  let mockRepository: Repository<RoleEntity>;

  beforeEach(async () => {

    const MockProvider = {
      provide: getRepositoryToken(RoleEntity),
      useFactory: () => ({
        findOne: jest.fn(() => {return 'saltValue';}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService, MockProvider],
    }).compile();

    service = module.get<RoleService>(RoleService);
    mockRepository = module.get<Repository<RoleEntity>>(getRepositoryToken(RoleEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //#Region findRoleByName

  it('Calling findRoleByName with invalid name returns error', async () => {

    let role: string = '';
    let errorStringToExcept: string = 'Role must be instantiated';

    await expect(service.findRoleByName(null)).rejects.toEqual(errorStringToExcept);
    await expect(service.findRoleByName(undefined)).rejects.toEqual(errorStringToExcept);
    await expect(service.findRoleByName(role)).rejects.toEqual(errorStringToExcept);
    await expect(mockRepository.findOne).toHaveBeenCalledTimes(0);
  });

  it('Calling findRoleByName with valid name returns role', async () => {

    let role: string = 'Admin';
    let mockRole: Role = {ID: 1, role: 'Admin'};

    //We mock findOne method for the repository to return the mockRole
    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(mockRole);

    await expect(await service.findRoleByName(role)).toBe(mockRole);
    await expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findRoleByName with valid name but without any results throws error', async () => {

    let role: string = 'Admin';
    let mockRole: Role = {ID: 1, role: 'User'};
    let errorStringToExcept: string = 'The specified role could not be found';

    //We mock findOne method for the repository to return the mockRole
    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findRoleByName(role)).rejects.toEqual(errorStringToExcept);
    await expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });
  //#Endregion

});
