import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { User } from "../models/user";
import theoretically from "jest-theories";
import { FindManyOptions, Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { UnauthorizedException } from "@nestjs/common";
import { PasswordTokenEntity } from "../../infrastructure/data-source/postgres/entities/password-token.entity";
import { Filter } from "../models/filter";
import { UserDTO } from "../../api/dtos/user.dto";
import { FilterList } from "../models/filterList";
import { RoleService } from "./role.service";
import { IRoleServiceProvider } from "../primary-ports/role.service.interface";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { UserStatusService } from "./user-status.service";
import { UserStatusEntity } from "../../infrastructure/data-source/postgres/entities/user-status.entity";
import { ConfirmationTokenEntity } from "../../infrastructure/data-source/postgres/entities/confirmation-token.entity";
import { ConfirmationToken } from "../models/confirmation.token";
import { IUserStatusServiceProvider } from "../primary-ports/user-status.service.interface";
import { Contract } from "../models/contract";

describe('UserService', () => {
  let service: UserService;
  let authenticationMock: AuthenticationHelper;
  let mockUserRepository: Repository<UserEntity>;
  let mockPasswordTokenRepository: Repository<PasswordTokenEntity>
  let mockConfirmationTokenRepository: Repository<ConfirmationTokenEntity>
  let mockRoleService: RoleService
  let mockStatusService: UserStatusService

  beforeEach(async () => {

    const AuthenticationMock = {
      provide: AuthenticationHelper,
      useFactory: () => ({
        generateToken: jest.fn((tokenLength: number) => {return 'tokenValue';}),
        generateHash: jest.fn((password: string, salt: string) => {return 'hashValue';}),
        validateLogin: jest.fn((user: User, password: string) => {return true;}),
        generateJWTToken: jest.fn((user: User) => {return 'signedToken';}),
        generateVerificationToken: jest.fn(() => {return 'verificationToken';}),
        validateJWTToken: jest.fn((token: string) => {return true;}),
        validatePasswordToken: jest.fn((token: string) => {return true;}),
      })
    }

    const MockUserRepository = {
      provide: getRepositoryToken(UserEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<UserEntity>) => {}),
        save: jest.fn((userEntity: UserEntity) => { return new Promise(resolve => {resolve(userEntity);});}),
        create: jest.fn((userEntity: UserEntity) => {return new Promise(resolve => {resolve(userEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const MockPasswordTokenRepository = {
      provide: getRepositoryToken(PasswordTokenEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<PasswordTokenEntity>) => {}),
        save: jest.fn((passwordTokenEntity: PasswordTokenEntity) => { return new Promise(resolve => {resolve(PasswordTokenEntity);});}),
        create: jest.fn((passwordTokenEntity: PasswordTokenEntity) => {return new Promise(resolve => {resolve(PasswordTokenEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const MockConfirmationTokenRepository = {
      provide: getRepositoryToken(ConfirmationTokenEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<ConfirmationTokenEntity>) => {}),
        save: jest.fn((confirmationTokenEntity: ConfirmationTokenEntity) => { return new Promise(resolve => {resolve(ConfirmationTokenEntity);});}),
        create: jest.fn((confirmationTokenEntity: ConfirmationTokenEntity) => {return new Promise(resolve => {resolve(ConfirmationTokenEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      update: jest.fn(() => {return updateQueryBuilder}),
      delete: jest.fn(() => {return deleteQueryBuilder}),
      select: jest.fn(() => {return selectQueryBuilder}),
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
    };

    const selectQueryBuilder: any = {
      getMany: jest.fn(() => {}),
    };

    const updateQueryBuilder: any = {
      set: () => updateQueryBuilder,
      where: () => updateQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const deleteQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      from: () => deleteQueryBuilder,
      andWhere: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const RoleServiceMock = {
      provide: IRoleServiceProvider,
      useFactory: () => ({
        findRoleByName: jest.fn((name: string) => {let roleEntity: RoleEntity = {ID: 1, role: name}; return roleEntity;}),
        getRoles: jest.fn(() => {let roleEntities: RoleEntity[] = [{ID: 1, role: 'user'}, {ID: 2, role: 'admin'},]; return new Promise(resolve => {resolve(roleEntities);});}),
      })
    }

    const StatusServiceMock = {
      provide: IUserStatusServiceProvider,
      useFactory: () => ({
        findStatusByName: jest.fn((name: string) => {let statusEntity: UserStatusEntity = {ID: 1, status: name}; return statusEntity;}),
        getStatuses: jest.fn(() => {let statusEntities: UserStatusEntity[] = [{ID: 1, status: 'pending'}, {ID: 2, status: 'active'}]; return new Promise(resolve => {resolve(statusEntities);});}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, AuthenticationMock, MockUserRepository, MockConfirmationTokenRepository, MockPasswordTokenRepository, RoleServiceMock, StatusServiceMock],
    }).compile();

    service = module.get<UserService>(UserService);
    authenticationMock = module.get<AuthenticationHelper>(AuthenticationHelper);
    mockUserRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    mockPasswordTokenRepository = module.get<Repository<PasswordTokenEntity>>(getRepositoryToken(PasswordTokenEntity));
    mockConfirmationTokenRepository = module.get<Repository<ConfirmationTokenEntity>>(getRepositoryToken(ConfirmationTokenEntity));
    mockRoleService = module.get<RoleService>(IRoleServiceProvider);
    mockStatusService = module.get<UserStatusService>(IUserStatusServiceProvider);
  });

    it('User service Should be defined', () => {
      expect(service).toBeDefined();
    });

    it('Authentication mock Should be defined', () => {
      expect(authenticationMock).toBeDefined();
    });

    it('Mock user repository Should be defined', () => {
      expect(mockUserRepository).toBeDefined();
    });

    it('Mock confirmation token repository Should be defined', () => {
      expect(mockConfirmationTokenRepository).toBeDefined();
    });

    it('Mock password token repository Should be defined', () => {
      expect(mockPasswordTokenRepository).toBeDefined();
    });

    it('Mock role service Should be defined', () => {
      expect(mockRoleService).toBeDefined();
    });

    it('Mock status service Should be defined', () => {
      expect(mockStatusService).toBeDefined();
    });

  //#region CreateUser

   describe('Creation of user with invalid username or password fails', () => {

     let username: string;
     let password: string;

     const theories = [
       { username: username = null, password: password = 'password', expectedError: "Username must be a valid email" },
       { username: username = '', password: password = 'password', expectedError: "Username must be a valid email" },
       { username: username = 'Jensen', password: password = 'password', expectedError: "Username must be a valid email" },
       { username: username = 'Jensen@@gmail', password: password = 'password', expectedError: "Username must be a valid email" },
       { username: username = 'Jensen@@hotmail.com', password: password = 'password', expectedError: "Username must be a valid email" },
       { username: username = 'Jensen@gmail.com', password: password = null, expectedError: "Password must be minimum 8 characters long" },
       { username: username = 'Jensen@gmail.com', password: password = 'passwor', expectedError: "Password must be minimum 8 characters long" },
       { username: username = 'Jensen@gmail.com', password: password = '        ', expectedError: "Password must be minimum 8 characters long" },
     ];

     theoretically('The correct error message is thrown during user creation', theories, async theory => {

       await expect(service.createUser(theory.username, theory.password)).rejects.toThrow(theory.expectedError);
       expect(mockRoleService.findRoleByName).toHaveBeenCalledTimes(0);
       expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
       expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
       expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
     })
   });

   describe('Creation of user with valid username or password returns user object', () => {

     let username: string;
     let password: string;

     let expectedRoleSearchName: string = 'user';
     let expectedStatusSearchName: string = 'pending';

     let expectedRole: RoleEntity = {ID: 1, role: 'user'};
     let expectedStatus: UserStatusEntity = {ID: 1, status: 'pending'};

     const theories = [
       { username: username = 'Jensen@hotmail.com', password: password = 'password'},
       { username: username = 'Jensen@gmail.com', password: password = 'k2vLqEW>m_k?s^2]'},
       { username: username = 'Jensen@gmail.de', password: password = 'password'},
     ];

     theoretically('User creation is successful with correct values', theories, async theory => {

       const user: User = await service.createUser(theory.username, theory.password);

       expect(user).toBeDefined();
       expect(user.salt).toBeDefined();
       expect(user.password).toBeDefined();
       expect(user.role).toStrictEqual(expectedRole);
       expect(user.status).toStrictEqual(expectedStatus);

       expect(user.username).toBe(theory.username);
       expect(user.password).not.toBe(theory.password);

       expect(mockRoleService.findRoleByName).toHaveBeenCalledTimes(1);
       expect(mockRoleService.findRoleByName).toHaveBeenCalledWith(expectedRoleSearchName);
       expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
       expect(mockStatusService.findStatusByName).toHaveBeenCalledWith(expectedStatusSearchName);
       expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
       expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
       expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
     })
   });

  //#endregion

  //#region RegisterUsers

  it('Registration of user throws error if username is invalid', async () => {

    let user1: User = { ID: 0, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }
    let user2: User = { ID: 0, username: 'Hans@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }
    let user3: User = { ID: 0, username: 'Jens', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }

    let usersToRegister: User[] = [user1, user2, user3];
    let expectedErrorMessage = 'Username must be a valid email';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(null);});});


    await expect(service.registerUsers(usersToRegister)).rejects.toThrow(expectedErrorMessage);
    expect(mockRoleService.findRoleByName).toHaveBeenCalledTimes(1);
    expect(mockRoleService.findRoleByName).toHaveBeenCalledWith('user');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('pending');
    expect(service.getUserByUsername).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Registration of unregistered users saves all to database', async () => {

    let user1: User = { ID: 0, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }
    let user2: User = { ID: 0, username: 'Hans@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }
    let user3: User = { ID: 0, username: 'Jens@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }

    let usersToRegister: User[] = [user1, user2, user3];
    let allUsers: User[] = [];
    let addedUsers: User[] = [];
    let confirmationTokens: string[] = [];

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementation((username: string) => {throw new Error();});

    await expect([allUsers, addedUsers, confirmationTokens] = await service.registerUsers(usersToRegister)).resolves;
    expect(allUsers).toStrictEqual(usersToRegister);
    expect(addedUsers).toStrictEqual(usersToRegister);
    expect(confirmationTokens.length).toStrictEqual(allUsers.length);

    expect(mockRoleService.findRoleByName).toHaveBeenCalledTimes(1);
    expect(mockRoleService.findRoleByName).toHaveBeenCalledWith('user');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('pending');
    expect(service.getUserByUsername).toHaveBeenCalledTimes(3);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(9);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(3);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(3);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(3);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(3);

    jest.restoreAllMocks();
  });

  it('Registration saves only unregistered users to database', async () => {

    let user1: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Active'} }
    let user2: User = { ID: 0, username: 'Hans@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} }
    let user3: User = { ID: 2, username: 'Jens@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Active'} }

    let usersToRegister: User[] = [user1, user2, user3];
    let expectedRegisteredUsers = [user2];

    let allUsers: User[] = [];
    let addedUsers: User[] = [];
    let confirmationTokens: string[] = [];

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user1);})})
      .mockImplementationOnce((username: string) => {throw new Error();})
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user3);})})

    await expect([allUsers, addedUsers, confirmationTokens] = await service.registerUsers(usersToRegister)).resolves;
    expect(allUsers).toStrictEqual(usersToRegister);
    expect(addedUsers).toStrictEqual(expectedRegisteredUsers);
    expect(confirmationTokens.length).toStrictEqual(addedUsers.length);

    expect(mockRoleService.findRoleByName).toHaveBeenCalledTimes(1);
    expect(mockRoleService.findRoleByName).toHaveBeenCalledWith('user');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('pending');
    expect(service.getUserByUsername).toHaveBeenCalledTimes(3);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(3);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region AddUser

  it('Saving user with invalid data fails', async () => {

    let user: User = {
      ID: 0,
      username: '',
      password: 'Password',
      salt: 'SaltValue',
      role: {ID: 1, role: 'User'},
      status: {ID: 1, status: 'Pending'}
    }

    await expect(service.addUser(user)).rejects.toThrow();
    expect(mockUserRepository.count).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Saving user throws error when registering with same username', async () => {

    jest.spyOn(mockUserRepository, "count").mockResolvedValueOnce(1);

    let errorStringToExcept: string = 'User with the same name already exists';

    let user: User = {
      ID: 0,
      username: 'Peter@gmail.com',
      password: 'Password',
      salt: 'SaltValue',
      role: {ID: 1, role: 'User'},
      status: {ID: 1, status: 'Pending'}
    }

    await expect(service.addUser(user)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);
  });

   it('Error during saving of user throws correct error', async () => {

     jest.spyOn(mockUserRepository, "save").mockImplementationOnce(resolve => {throw new Error()});

     let errorStringToExcept: string = 'Internal server error';

     let user: User = {
       ID: 0,
       username: 'Peter@gmail.com',
       password: 'Password',
       salt: 'SaltValue',
       role: {ID: 1, role: 'User'},
       status: {ID: 1, status: 'Pending'}
     }

     await expect(service.addUser(user)).rejects.toThrow(errorStringToExcept);
     expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
     expect(authenticationMock.generateToken).toHaveBeenCalledTimes(2);
     expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
     expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
     expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
     expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
     expect(mockUserRepository.create).toHaveBeenCalledWith(user);
     expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
     expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);
   });

    it('Error during saving of user confirmation throws correct error', async () => {

      jest.spyOn(mockConfirmationTokenRepository, "save").mockImplementationOnce(resolve => {throw new Error()});

      let errorStringToExcept: string = 'Internal server error';

      let user: User = {
        ID: 0,
        username: 'Peter@gmail.com',
        password: 'Password',
        salt: 'SaltValue',
        role: {ID: 1, role: 'User'},
        status: {ID: 1, status: 'Pending'}
      }

      await expect(service.addUser(user)).rejects.toThrow(errorStringToExcept);
      expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
      expect(authenticationMock.generateToken).toHaveBeenCalledTimes(2);
      expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
      expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
      expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).toHaveBeenCalledWith(user);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(1);
    });

  it('Saving user is successful on valid data', async () => {

    jest.spyOn(mockUserRepository, "count").mockResolvedValueOnce(0);

    let user: User = {
      ID: 0,
      username: 'Peter@gmail.com',
      password: 'Password',
      salt: 'saltValue',
      role: {ID: 1, role: 'User'},
      status: {ID: 1, status: 'Pending'}
    }

    let savedUser: User;
    let verificationCode: string;

    await expect([savedUser, verificationCode] = await service.addUser(user)).resolves;
    expect(verificationCode).toBeDefined();
    expect(savedUser).toBeDefined();
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(2);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.create).toHaveBeenCalledWith(user);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetUserByUsername

  it('Find user with invalid username results in error', async () => {

    let username: string = '';

    let errorStringToExcept = 'Username must be instantiated or valid';

    await expect(service.getUserByUsername(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByUsername(undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByUsername(username)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it('Find non-existing user results in error', async () => {

    jest
      .spyOn(mockUserRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null)});});

    let username: string = 'peter@gmail.com';
    let errorStringToExcept = 'No user registered with such a name';

    await expect(service.getUserByUsername(username)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

  it('Find existing user returns valid user information', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 1, status: 'Pending'},
      role: {ID: 1, role: 'user'}};

    jest
      .spyOn(mockUserRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedUser);});});

    let username: string = 'Username@gmail.com';
    let foundUser

    await expect(foundUser = await service.getUserByUsername(username)).resolves;
    expect(foundUser).toStrictEqual(storedUser);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

   //#endregion

  //#region GetUserByID
  it('Find user with invalid ID results in error', async () => {

    let ID: number = 0;

    let errorStringToExcept = 'User ID must be instantiated or valid';

    await expect(service.getUserByID(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByID(undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByID(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it('Non-existing user results in error', async () => {

    jest
      .spyOn(mockUserRepository.createQueryBuilder(), 'getOne')
      .mockImplementation(() => {return new Promise(resolve => {resolve(null)});});

    let ID: number = 1234;
    let errorStringToExcept = 'No user registered with such ID';

    await expect(service.getUserByID(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  it('Find existing user returns valid user information', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 1, status: 'Pending'},
      role: {ID: 1, role: 'user'}};

    jest
      .spyOn(mockUserRepository.createQueryBuilder(), 'getOne')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedUser);});});

    let ID: number = 1;
    let foundUser

    await expect(foundUser = await service.getUserByID(ID)).resolves;

    expect(foundUser).toStrictEqual(storedUser);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  //#endregion

  //#region GetUsers

   describe('Get users throws error when inserting invalid filter',  () => {

     let filter: Filter;
     let expectedError: string;

     const theories = [
       { filter: filter = null, expectedError: 'Invalid filter entered'},
       { filter: filter = undefined, expectedError: 'Invalid filter entered'},
       { filter: filter = {itemsPrPage: null, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
       { filter: filter = {itemsPrPage: undefined, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
       { filter: filter = {itemsPrPage: 0, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
       { filter: filter = {itemsPrPage: Number.MIN_SAFE_INTEGER, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
       { filter: filter = {itemsPrPage: 1, currentPage: null}, expectedError: 'Invalid current page entered'},
       { filter: filter = {itemsPrPage: 1, currentPage: undefined}, expectedError: 'Invalid current page entered'},
       { filter: filter = {itemsPrPage: 1, currentPage: -1}, expectedError: 'Invalid current page entered'},
       { filter: filter = {itemsPrPage: 1, currentPage: Number.MIN_SAFE_INTEGER}, expectedError: 'Invalid current page entered'},
     ];

     theoretically('The correct error message is thrown during user filtering', theories,  async theory => {
       await expect(service.getUsers(theory.filter)).rejects.toThrow(theory.expectedError);
       expect(mockUserRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
       expect(mockUserRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
     });
   });

   it('Get users returns valid filterList', async () => {

     let storedUsers: UserEntity[] = [
       {ID: 1, username: 'Peter@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 2, status: 'active'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 2, username: 'Hans@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 3, username: 'Lars@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 2, role: 'admin'}, passwordToken: undefined},
     ]

     let expectedTotalListSize: number = 3;
     let expectedListSize: number = 3;

     let expectedList: UserDTO[] = [
       {ID: 1, username: 'Peter@gmail.com', status: {ID: 2, status: 'active'}, role: {ID: 1, role: 'user'}},
       {ID: 2, username: 'Hans@gmail.com', status: {ID: 1, status: 'pending'}, role: {ID: 1, role: 'user'}},
       {ID: 3, username: 'Lars@gmail.com', status: {ID: 1, status: 'pending'}, role: {ID: 2, role: 'admin'}},
     ]

     let filter: Filter = {currentPage: 1, itemsPrPage: 2};

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getMany')
       .mockImplementation(() => {return new Promise(resolve => {resolve(storedUsers);});});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getCount')
       .mockImplementation(() => {return new Promise(resolve => {resolve(storedUsers.length);});});

     let filterList: FilterList<UserDTO>;
     await expect(filterList = await service.getUsers(filter)).resolves;
     expect(filterList.list).toStrictEqual(expectedList);
     expect(filterList.list.length).toBe(expectedListSize)
     expect(filterList.totalItems).toBe(expectedTotalListSize);
     expect(mockUserRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
     expect(mockUserRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

     jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
   });

   it('Get users returns valid filterList when offset', async () => {

     let storedUsers: UserEntity[] = [
       {ID: 1, username: 'Peter@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 2, status: 'active'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 2, username: 'Hans@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 3, username: 'Lars@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 2, role: 'admin'}, passwordToken: undefined},
     ]

     let expectedTotalListSize: number = 3;
     let expectedListSize: number = 1;

     let expectedList: UserDTO[] = [
       {ID: 3, username: 'Lars@gmail.com', status: {ID: 1, status: 'pending'}, role: {ID: 2, role: 'admin'}},
     ]

     let filter: Filter = {currentPage: 2, itemsPrPage: 1};
     let offsetValue: number;
     let limitValue: number;

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'offset')
       .mockImplementation((offset?: number) => {offsetValue = offset; return null;});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'limit')
       .mockImplementation((limit?: number) => {limitValue = limit; return null;});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getMany')
       .mockImplementation(() => {
         let storedValue: UserEntity[] = [...storedUsers];
         for(let i = 0; i < offsetValue; i++){storedValue.shift();}
         let resizedValue = storedValue.slice(0, limitValue);
         return new Promise(resolve => {resolve(resizedValue);});});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getCount')
       .mockImplementation(() => {return new Promise(resolve => {resolve(storedUsers.length);});});


     let filterList: FilterList<UserDTO>;
     await expect(filterList = await service.getUsers(filter)).resolves;
     expect(filterList.list).toStrictEqual(expectedList);
     expect(filterList.list.length).toBe(expectedListSize)
     expect(filterList.totalItems).toBe(expectedTotalListSize);
     expect(mockUserRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
     expect(mockUserRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

     jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
   });

   it('Get users returns valid filterList when limit', async () => {

     let storedUsers: UserEntity[] = [
       {ID: 1, username: 'Peter@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 2, status: 'active'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 2, username: 'Hans@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 1, role: 'user'}, passwordToken: undefined},
       {ID: 3, username: 'Lars@gmail.com', password: 'somePassword', salt: 'someSalt', status: {ID: 1, status: 'pending'}, role: {ID: 2, role: 'admin'}, passwordToken: undefined},
     ]

     let expectedTotalListSize: number = 3;
     let expectedListSize: number = 2;

     let expectedList: UserDTO[] = [
       {ID: 1, username: 'Peter@gmail.com', status: {ID: 2, status: 'active'}, role: {ID: 1, role: 'user'}},
       {ID: 2, username: 'Hans@gmail.com', status: {ID: 1, status: 'pending'}, role: {ID: 1, role: 'user'}},
     ]

     let filter: Filter = {currentPage: 0, itemsPrPage: 2};
     let offsetValue: number;
     let limitValue: number;

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'offset')
       .mockImplementation((offset?: number) => {offsetValue = offset; return null;});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'limit')
       .mockImplementation((limit?: number) => {limitValue = limit; return null;});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getMany')
       .mockImplementation(() => {
         let storedValue: UserEntity[] = [...storedUsers];
         for(let i = 0; i < offsetValue; i++){storedValue.shift();}
         let resizedValue = storedValue.slice(0, limitValue);
         return new Promise(resolve => {resolve(resizedValue);});});

     jest
       .spyOn(mockUserRepository.createQueryBuilder(), 'getCount')
       .mockImplementation(() => {return new Promise(resolve => {resolve(storedUsers.length);});});


     let filterList: FilterList<UserDTO>;
     await expect(filterList = await service.getUsers(filter)).resolves;
     expect(filterList.list).toStrictEqual(expectedList);
     expect(filterList.list.length).toBe(expectedListSize)
     expect(filterList.totalItems).toBe(expectedTotalListSize);
     expect(mockUserRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
     expect(mockUserRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

     jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
   });

  //#endregion

  //#region GetUsernames

  describe('Get usernames maps correctly', () => {
    let users: User[];
    let returnValue: User[]
    let expectedNames: string[];
    let searchString: string;

    const theories = [
      { input: users = [
          {ID: 1, username: 'Kim Hansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''},
          {ID: 2, username: 'Hans Christiansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''},
          {ID: 3, username: 'Michael Elis Madsen', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'}, salt: '', password: ''},
          {ID: 4, username: 'Josefine', role: {ID: 2, role: 'Admin'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''}],

        returnValue: returnValue = [
          {ID: 1, username: 'Kim Hansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''},
          {ID: 2, username: 'Hans Christiansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''},
          {ID: 3, username: 'Michael Elis Madsen', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'}, salt: '', password: ''},
          {ID: 4, username: 'Josefine', role: {ID: 2, role: 'Admin'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''}],

        expected: expectedNames = ['Kim Hansen', 'Hans Christiansen', 'Michael Elis Madsen', 'Josefine'],
        searchString: searchString = ''
      },
      { input: users = [
          {ID: 1, username: 'Mads Hansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''},
          {ID: 2, username: 'Jonas Hansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''}
        ],

        returnValue: returnValue = [
          {ID: 2, username: 'Jonas Hansen', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'Active'}, salt: '', password: ''}],

        expected: expectedNames = ['Jonas Hansen'],
        searchString: searchString = 'Jonas'
      },
    ];

    theoretically('The correct usernames are returned', theories, async theory => {

      jest.spyOn(mockUserRepository.createQueryBuilder(), 'select').mockImplementation(() => {return selectQueryBuilder});

      const selectQueryBuilder: any = {
        getMany: jest.fn(() => {return new Promise(resolve => {resolve(theory.returnValue);});}),
        andWhere: () => selectQueryBuilder,
        limit: () => selectQueryBuilder
      };

      let result: string[];



      await expect(result = await service.getUsernames(theory.searchString)).resolves;
      expect(result).toStrictEqual(theory.expected);
      expect(mockUserRepository.createQueryBuilder().select().getMany).toHaveBeenCalledTimes(1);
    })
  });

  //#endregion

  //#region UpdateUser

  it('Update invalid user throws error', async () => {

    let userDTO: UserDTO = {ID: 0, username: 'peter@gmail.com', status: {ID: 2, status: 'active'}, role: {ID: 2, role: 'admin'}};
    let expectedErrorMessage: string = 'User ID must be instantiated or valid'

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((ID: number) => {throw new Error('User ID must be instantiated or valid');});

    await expect(service.updateUser(userDTO)).rejects.toThrow(expectedErrorMessage);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);

  });

  it('Update user with invalid data throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let userDTO: UserDTO = {ID: 1, username: null, status: {ID: 2, status: 'active'}, role: {ID: 2, role: 'admin'}};

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: UserEntity) => {throw new Error('User must have a valid Username')});

    let expectedErrorMessage: string = 'User must have a valid Username'

    await expect(service.updateUser(userDTO)).rejects.toThrow(expectedErrorMessage);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(userDTO.ID);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(storedUser);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);

  });

  it('Updating user with return value of null throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let userDTO: UserDTO = {ID: 1, username: null, status: {ID: 2, status: 'active'}, role: {ID: 2, role: 'admin'}};

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: UserEntity) => {});

    jest
      .spyOn(mockUserRepository, 'save')
      .mockImplementationOnce((user: UserEntity) => {return new Promise(resolve => {return resolve(null);});});

    let expectedErrorMessage: string = 'Error updating user'

    await expect(service.updateUser(userDTO)).rejects.toThrow(expectedErrorMessage);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(userDTO.ID);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(storedUser);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(storedUser);
  });

  it('Error while updating user throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let userDTO: UserDTO = {ID: 1, username: null, status: {ID: 2, status: 'active'}, role: {ID: 2, role: 'admin'}};

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: UserEntity) => {});

    jest
      .spyOn(mockUserRepository, 'save')
      .mockImplementationOnce((user: UserEntity) => {return new Promise(resolve => {throw new Error()});});

    let expectedErrorMessage: string = 'Internal server error'

    await expect(service.updateUser(userDTO)).rejects.toThrow(expectedErrorMessage);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(userDTO.ID);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(storedUser);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(storedUser);
  });

  it('Updating user with valid data resolves correctly', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let expectedUser: UserEntity = {
      ID: 1,
      username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 2, role: 'admin'}};


    let userDTO: UserDTO = {ID: 1, username: 'peter@gmail.com', status: {ID: 2, status: 'active'}, role: {ID: 2, role: 'admin'}};

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: UserEntity) => {});

    jest
      .spyOn(mockUserRepository, 'save')
      .mockImplementationOnce((user: UserEntity) => {return new Promise(resolve => {return resolve(user);});});

    let updatedUser: User;

    await expect(updatedUser = await service.updateUser(userDTO)).resolves;
    expect(updatedUser).toStrictEqual(expectedUser);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(userDTO.ID);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(storedUser);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(storedUser);
  });

  //#endregion UpdateUser



  //#region Login

  it('Login with username of null results in error', async () => {

    let username: string = null;
    let password: string = 'password';

    let errorStringToExcept = 'Username or Password is non-existing';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);
  });

  it('Login with password of null results in error', async () => {

    let username: string = 'Username@gmail.com';
    let password: string = null;

    let errorStringToExcept = 'Username or Password is non-existing';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);
  });

  it('Login with non-existing users results in error', async () => {

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {throw new Error('No user registered with such a name');});

    let username: string = 'nonExistingUser';
    let password: string = 'somePassword';

    let errorStringToExcept = 'No user registered with such a name';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(username);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);

  });

  it('Login with existing user with status of disabled throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 3, status: 'disabled'},
      role: {ID: 1, role: 'user'}};

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(storedUser);});});

    let username: string = 'Username@gmail.com';
    let password: string = 'Password';

    let errorStringToExcept = 'This user has been disabled';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(username);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledWith(storedUser, password);

  });

  it('Login with existing user completes without error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(storedUser);});});

    let username: string = 'Username@gmail.com';
    let password: string = 'Password';
    let foundUser

    await expect(foundUser = await service.login(username, password)).resolves;
    expect(foundUser).toStrictEqual(storedUser);

    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(username);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledWith(storedUser, password);

  });

  //#endregion

  //#region GenerateNewVerificationToken

  it('Generation of new token for already active user fails', async () => {

    let user: User = {
      ID: 0,
      username: 'peter@gmail.com',
      password: 'somePassword',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'admin'},
    }

    let expectedErrorMessage: string = 'This user has already been verified';

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: User) => {});

    await expect(service.generateNewVerificationCode(user)).rejects.toThrow(expectedErrorMessage);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);;
  });

  it('Generation of new token with invalid user fails', async () => {

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: User) => {throw new Error('User must have a valid username');});

    let user: User = {
      ID: 0,
      username: '',
      password: 'somePassword',
      salt: 'someSalt',
      status: {ID: 1, status: 'pending'},
      role: {ID: 1, role: 'admin'},
    }

    let expectedErrorMessage: string = 'User must have a valid username';

    await expect(service.generateNewVerificationCode(user)).rejects.toThrow(expectedErrorMessage);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(user);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Generation of new token with error during save throws correct error code', async () => {

    let user: User = {
      ID: 0,
      username: 'Username@gmail.com',
      password: 'somePassword',
      salt: 'someSalt',
      status: {ID: 1, status: 'pending'},
      role: {ID: 1, role: 'admin'},
    }

    let expectedErrorMessage: string = 'Internal server error';

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: User) => {});

    jest
      .spyOn(mockConfirmationTokenRepository, 'save')
      .mockImplementationOnce((confirmationToken: ConfirmationToken) => {throw new Error()});

    await expect(service.generateNewVerificationCode(user)).rejects.toThrow(expectedErrorMessage);
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(user);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(2);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Generation of new token with valid data is successful', async () => {

    let user: User = {
      ID: 0,
      username: 'Username@gmail.com',
      password: 'somePassword',
      salt: 'someSalt',
      status: {ID: 1, status: 'pending'},
      role: {ID: 1, role: 'admin'},
    }

    let verificationToken: string;

    jest
      .spyOn(service, 'verifyUserEntity')
      .mockImplementationOnce((user: User) => {});

    await expect(verificationToken = await service.generateNewVerificationCode(user)).resolves;
    expect(verificationToken).toBeDefined();
    expect(service.verifyUserEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyUserEntity).toHaveBeenCalledWith(user);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(2);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.verificationTokenCount);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GeneratePasswordResetToken

  it('Error code is thrown when saving token to database fails', async () => {

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(mockPasswordTokenRepository, 'save')
      .mockImplementationOnce(() => {throw new Error('Error saving data to database')});

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let errorStringToExcept: string = 'Internal server error. Please try again later.';

    await expect(service.generatePasswordResetToken(user.username)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.passwordResetStringCount);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);

    expect(mockPasswordTokenRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete).toHaveBeenCalledTimes(1);
    expect(mockPasswordTokenRepository.save).toHaveBeenCalledTimes(1);

  });

  it('Generation of password reset token is successful on valid username', async () => {

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordResetString: string;

    await expect(passwordResetString = await service.generatePasswordResetToken(user.username)).resolves;

    expect(passwordResetString).toBeDefined();
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.passwordResetStringCount);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);

    expect(mockPasswordTokenRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete).toHaveBeenCalledTimes(1);
    expect(mockPasswordTokenRepository.save).toHaveBeenCalledTimes(1);

  });

  //#endregion

  //#region VerifyUser

  it('Verification of user with active status throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1, username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let verificationCode = "2xY3b4";

    const storedConfirmationToken: ConfirmationTokenEntity = {user: storedUser, salt: 'saltValue', hashedConfirmationToken: 'someHashedToken'};

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserConfirmationToken')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    jest
      .spyOn(service, 'deleteUserConfirmationToken')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    let username: string = "peter@gmail.com";
    let errorStringToExcept: string = 'This user has already been verified';

    await expect(service.verifyUser(username, verificationCode)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(username);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledTimes(0);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(service.deleteUserConfirmationToken).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with pending status and correct verification code is successful', async () => {

    let storedUser: UserEntity = {
      ID: 1, username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'pending'},
      role: {ID: 1, role: 'user'}};

    let verificationCode = "2xY3b4";

    const storedConfirmationToken: ConfirmationTokenEntity = {user: storedUser, salt: 'saltValue', hashedConfirmationToken: 'someHashedToken'};

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(storedUser);});});

    jest
      .spyOn(service, 'verifyUserConfirmationToken')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    jest
      .spyOn(service, 'deleteUserConfirmationToken')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    let username: string = "peter@gmail.com";

    await expect(await service.verifyUser(username, verificationCode)).resolves;
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(username);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('active');
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(service.deleteUserConfirmationToken).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region VerifyUserConfirmationToken

  it('Verification of user with invalid verification token throws error', async () => {

    let user: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} };
    let verificationCode = "";

    let errorStringToExcept: string = 'Invalid verification code entered';

    await expect(service.verifyUserConfirmationToken(user, null)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUserConfirmationToken(user, undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUserConfirmationToken(user, verificationCode)).rejects.toThrow(errorStringToExcept);

    expect(mockConfirmationTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with invalid verificationToken throws error', async () => {

    let user: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} };
    let verificationCode = "X2TMM";

    let errorStringToExcept: string = 'Invalid verification code entered';

    await expect(service.verifyUserConfirmationToken(user, verificationCode)).rejects.toThrow(errorStringToExcept);

    expect(mockConfirmationTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with missing verification code throws error', async () => {

    jest
      .spyOn(mockConfirmationTokenRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    let user: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 1, status: 'Pending'} };
    let verificationCode = "X2TMM6";

    let errorStringToExcept: string = 'Invalid verification code entered';

    await expect(service.verifyUserConfirmationToken(user, verificationCode)).rejects.toThrow(errorStringToExcept);
    expect(mockConfirmationTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with wrong verificationCode throws error', async () => {

    let storedUser: UserEntity = {
      ID: 1, username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let storedToken: ConfirmationToken = {user: storedUser, salt: 'saltValue', hashedConfirmationToken: 'differentHashValue'}

    let user: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'user'}, status: {ID: 2, status: 'active'} };
    let verificationCode = "X2TMM6";

    let errorStringToExcept: string = 'Invalid verification code entered';

    jest
      .spyOn(mockConfirmationTokenRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedToken);});});

    await expect(service.verifyUserConfirmationToken(user, verificationCode)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

  it('Verification of user confirm token with valid token resolves', async () => {

    let storedUser: UserEntity = {
      ID: 1, username: 'peter@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let storedToken: ConfirmationToken = {user: storedUser, salt: 'saltValue', hashedConfirmationToken: 'x4T32Ae5u'}

    let user: User = { ID: 1, username: 'Peter@gmail.com', password: 'Password', salt: 'SaltValue', role: {ID: 1, role: 'User'}, status: {ID: 2, status: 'active'} };
    let verificationCode = "X2TMM6";

    jest
      .spyOn(mockConfirmationTokenRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedToken);});});

    jest
      .spyOn(authenticationMock, 'generateHash')
      .mockImplementationOnce((password: string, salt: string) => {return 'x4T32Ae5u'});

    await expect(await service.verifyUserConfirmationToken(user, verificationCode)).resolves;
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(mockConfirmationTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region VerifyPasswordToken

  it('Verify password token with invalid password throws error', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = ''

    let errorStringToExcept: string = 'Invalid password token entered';

    await expect(service.verifyPasswordToken(user, null)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyPasswordToken(user, undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyPasswordToken(user, passwordToken)).rejects.toThrow(errorStringToExcept);

    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockPasswordTokenRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
    expect(authenticationMock.validatePasswordToken).toHaveBeenCalledTimes(0);
  });

  it('Invalid password token returns error', async () => {

    jest
      .spyOn(mockPasswordTokenRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null);});});

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken'

    let errorStringToExcept: string = 'Wrong password token entered';

    await expect(service.verifyPasswordToken(user, passwordToken)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(passwordToken, user.salt);
    expect(mockPasswordTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validatePasswordToken).toHaveBeenCalledTimes(0);
  });

  it('Verify password token with invalid password throws error', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = '';

    let errorStringToExcept: string = 'Invalid password token entered';

    await expect(service.verifyPasswordToken(user, null)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyPasswordToken(user, undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyPasswordToken(user, passwordToken)).rejects.toThrow(errorStringToExcept);

    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    expect(mockPasswordTokenRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
    expect(authenticationMock.validatePasswordToken).toHaveBeenCalledTimes(0);
  });

  it('Verification of correct password token is successful', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken'
    const passwordTokenEntity: PasswordTokenEntity = {user: JSON.parse(JSON.stringify({ID: user.ID})), hashedResetToken: passwordToken};

    jest
      .spyOn(mockPasswordTokenRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(passwordTokenEntity);});});

    await expect(await service.verifyPasswordToken(user, passwordToken)).resolves;
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(passwordToken, user.salt);
    expect(mockPasswordTokenRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validatePasswordToken).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region DeleteUserConfirmationToken

  it('Delete user confirmation token with invalid ID results in error', async () => {

    let ID: number = 0;

    let errorStringToExcept = 'User ID must be instantiated or valid';

    await expect(service.deleteUserConfirmationToken(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.deleteUserConfirmationToken(undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.deleteUserConfirmationToken(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(0);
  });

  it('Error during delete of user confirmation token results in correct error code', async () => {

    let ID: number = 1;

    let errorStringToExcept = 'Internal server error';

    jest.spyOn(mockConfirmationTokenRepository.createQueryBuilder().delete(), 'execute')
      .mockImplementationOnce(() => {return new Promise(resolve => {throw new Error();});})


    await expect(service.deleteUserConfirmationToken(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockConfirmationTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(1);
  });

  it('Deletion of valid user confirmation token resolves correctly', async () => {

    let ID: number = 1;

    await expect(await service.deleteUserConfirmationToken(ID)).resolves;
    expect(mockConfirmationTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(1);
  });

  //#endregion



  //#region UpdatePasswordWithConfirmationToken

  it('Password with confirmation code is not updated in case of non-existing user', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let confirmationCode: string = 'someConfirmationCode';
    let password: string = 'password';

    let errorStringToExcept: string = 'No user registered with such a name';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {throw new Error('No user registered with such a name');});

    jest.spyOn(service, 'verifyUserConfirmationToken').mockImplementation();
    jest.spyOn(service, 'updatePassword').mockImplementation();
    jest.spyOn(service, 'verifyUser').mockImplementation();

    await expect(service.updatePasswordWithConfirmationToken(user.username, confirmationCode, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledTimes(0);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
    expect(service.verifyUser).toHaveBeenCalledTimes(0);
  });

  it('Password with confirmation code is not updated in case of wrong confirmation token', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let confirmationCode: string = 'someConfirmationCode';
    let password: string = 'password';

    let errorStringToExcept: string = 'Invalid confirmation token entered';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(service, 'verifyUserConfirmationToken')
      .mockImplementationOnce((user: User, confirmationToken: string) => {throw new Error('Invalid confirmation token entered')});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    jest.spyOn(service, 'verifyUser').mockImplementation();

    await expect(service.updatePasswordWithConfirmationToken(user.username, confirmationCode, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledTimes(1);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledWith(user, confirmationCode);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
    expect(service.verifyUser).toHaveBeenCalledTimes(0);
  });

  it('Update password with confirmation token calls update password method if successful', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let confirmationCode: string = 'someConfirmationCode';
    let password: string = 'Password';
    let expectedBooleanResult: boolean = true;

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(service, 'verifyUserConfirmationToken')
      .mockImplementationOnce((user: User, confirmationToken: string) => {return new Promise(resolve => {resolve(null);});});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    jest.spyOn(service, 'verifyUser').mockImplementation();

    let booleanResult: boolean;

    await expect(booleanResult = await service.updatePasswordWithConfirmationToken(user.username, confirmationCode, password)).resolves;
    expect(booleanResult).toBe(expectedBooleanResult);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledTimes(1);
    expect(service.verifyUserConfirmationToken).toHaveBeenCalledWith(user, confirmationCode);
    expect(service.updatePassword).toHaveBeenCalledTimes(1);
    expect(service.updatePassword).toHaveBeenCalledWith(user, password);
    expect(service.verifyUser).toHaveBeenCalledTimes(1);
    expect(service.verifyUser).toHaveBeenCalledWith(user.username, confirmationCode);
  });

  //#endregion

  //#region UpdatePasswordWithToken

  it('Password is not updated in case of non-existing user', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken';
    let password: string = 'password';

    let errorStringToExcept: string = 'No user registered with such a name';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {throw new Error('No user registered with such a name');});

    jest.spyOn(service, 'verifyPasswordToken').mockImplementation();
    jest.spyOn(service, 'updatePassword').mockImplementation();

    await expect(service.updatePasswordWithToken(user.username, passwordToken, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyPasswordToken).toHaveBeenCalledTimes(0);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(0);
  });

  it('Password with password token is not updated in case of wrong password token', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken';
    let password: string = 'password';

    let errorStringToExcept: string = 'Wrong password token entered';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(service, 'verifyPasswordToken')
      .mockImplementationOnce((user: User, passwordToken: string) => {throw new Error('Wrong password token entered')});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    await expect(service.updatePasswordWithToken(user.username, passwordToken, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyPasswordToken).toHaveBeenCalledTimes(1);
    expect(service.verifyPasswordToken).toHaveBeenCalledWith(user, passwordToken);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(0);
  });

  it('Correct error code is thrown when deleting password token', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken';
    let password: string = 'password';

    let errorStringToExcept: string = 'Internal server error';

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(service, 'verifyPasswordToken')
      .mockImplementationOnce((user: User, passwordToken: string) => {return new Promise(resolve => {resolve(null);});});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    jest
      .spyOn(mockPasswordTokenRepository.createQueryBuilder().delete(), 'execute')
      .mockImplementationOnce(() => {return new Promise(resolve => {throw new Error()})})

    await expect(service.updatePasswordWithToken(user.username, passwordToken, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyPasswordToken).toHaveBeenCalledTimes(1);
    expect(service.verifyPasswordToken).toHaveBeenCalledWith(user, passwordToken);
    expect(service.updatePassword).toHaveBeenCalledTimes(1);
    expect(service.updatePassword).toHaveBeenCalledWith(user, password);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(1);
  });

  it('Update password with password token calls update password method if successful', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let passwordToken: string = 'somePasswordToken';
    let password: string = 'Password';

    let expectedBooleanResult: boolean = true;

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementationOnce((username: string) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(service, 'verifyPasswordToken')
      .mockImplementationOnce((user: User, passwordToken: string) => {return new Promise(resolve => {resolve(null);});});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    let booleanResult: boolean;

    await expect(booleanResult = await service.updatePasswordWithToken(user.username, passwordToken, password)).resolves;
    expect(booleanResult).toBe(expectedBooleanResult);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(service.getUserByUsername).toHaveBeenCalledWith(user.username);
    expect(service.verifyPasswordToken).toHaveBeenCalledTimes(1);
    expect(service.verifyPasswordToken).toHaveBeenCalledWith(user, passwordToken);
    expect(service.updatePassword).toHaveBeenCalledTimes(1);
    expect(service.updatePassword).toHaveBeenCalledWith(user, password);
    expect(mockPasswordTokenRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region UpdatePasswordWithID

  it('Password is not updated in case of non-existing user', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string = 'newPassword';
    let oldPassword: string = 'Password';

    let errorStringToExcept: string = 'No user registered with such ID';

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((userID: number) => {throw new Error('No user registered with such ID');});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(false);});});

    await expect(service.updatePasswordWithID(user.ID, newPassword, oldPassword)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(user.ID);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
  });

  it('Password is not updated in case of wrong password', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string = 'newPassword';
    let oldPassword: string = 'wrongPassword';

    let errorStringToExcept: string = 'Entered password is incorrect';

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((userID: number) => {return new Promise(resolve => {resolve(user);});});

    jest
      .spyOn(authenticationMock, 'validateLogin')
      .mockImplementationOnce((user: User, oldPassword: string) => {throw new Error('Entered password is incorrect')});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(false);});});

    await expect(service.updatePasswordWithID(user.ID, newPassword, oldPassword)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(user.ID);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledWith(user, oldPassword);
    expect(service.updatePassword).toHaveBeenCalledTimes(0);
  });

  it('Update password with ID calls update password method if successful', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string = 'newPassword';
    let oldPassword: string = 'Password';
    let expectedBooleanResult: boolean = true;

    jest
      .spyOn(service, 'getUserByID')
      .mockImplementationOnce((userID: number) => {return new Promise(resolve => {resolve(user);});});

    jest.spyOn(service, 'updatePassword')
      .mockImplementationOnce((user: User, password: string) => {return new Promise(resolve => {resolve(true);});});

    let booleanResult: boolean;

    await expect(booleanResult = await service.updatePasswordWithID(user.ID, newPassword, oldPassword)).resolves;
    expect(booleanResult).toBe(expectedBooleanResult)
    expect(service.getUserByID).toHaveBeenCalledTimes(1);
    expect(service.getUserByID).toHaveBeenCalledWith(user.ID);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledWith(user, oldPassword);
    expect(service.updatePassword).toHaveBeenCalledTimes(1);
    expect(service.updatePassword).toHaveBeenCalledWith(user, newPassword);
  });

  //#endregion

  //#region UpdatePassword

  describe('Update password with invalid password throws error',  () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string;

    let expectedError: string = 'Password must be minimum 8 characters long'

    const theories = [
      { password: newPassword = null},
      { password: newPassword = undefined},
      { password: newPassword = ''},
      { password: newPassword = 'passwor'},
    ];

    theoretically('The correct error message is thrown during password change', theories,  async theory => {
      await expect(service.updatePassword(user, theory.password)).rejects.toThrow(expectedError);
      expect(authenticationMock.generateToken).toHaveBeenCalledTimes(0);
      expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    });
  });

  it('Error code is thrown when password update fails to save', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string = 'password';

    let errorStringToExcept: string = 'Internal server error';

    jest
      .spyOn(mockUserRepository, 'save')
      .mockImplementationOnce(() => {return new Promise(resolve => {throw new Error()})});

    await expect(service.updatePassword(user, newPassword)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(newPassword, user.salt);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it('True is returned when password update is successful', async () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'Password',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'user'}};

    let newPassword: string = 'password';

    let result: boolean;

    await expect(result = await service.updatePassword(user, newPassword)).resolves;
    expect(result).toBe(true);
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateToken).toHaveBeenCalledWith(service.saltLength);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(newPassword, user.salt);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  //#endregion



  //#region GenerateSalt

  it('Generate salt is called in authentication service', () => {
    service.generateSalt();
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
  });

  it('Generate salt returns valid string', () => {
    expect(service.generateSalt()).toBeDefined();
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
  });

  it('Generate salt returns string of ', () => {
    expect(service.generateSalt()).toBeDefined();
    expect(authenticationMock.generateToken).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GenerateHash

  it('Generate hash is called in authenticationService', () => {

    let password: string = 'somePassword';
    let salt: string = "someSalt";

    service.generateHash(password, salt);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(password, salt);
  });

  it('Generate hash throws error if password is undefined, null or empty', () => {

    let password: string = '';
    let salt: string = "someSalt";

    let errorStringToExcept: string = 'Value to hash must be instantiated';

    expect(() => { service.generateHash(null, salt); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(undefined, salt); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, salt); }).toThrow(errorStringToExcept);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
  });

  it('Generate hash throws error if salt is undefined, null or empty', () => {

    let password: string = "somePassword";
    let salt: string = '';

    let errorStringToExcept = 'Salt must be instantiated';

    expect(() => { service.generateHash(password, null); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, undefined); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, salt); }).toThrow(errorStringToExcept);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
  });

  it('Generate hash returns valid string', () => {

    let password: string = 'somePassword';
    let salt: string = "someSalt";

    expect(service.generateHash(password, salt)).toBeDefined();
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateHash).toHaveBeenCalledWith(password, salt);
  });

  //#endregion

  //#region GenerateJWTToken

  it('Generate JWT token AuthenticationService is called on valid user', () => {

    let user: User = {
      ID: 1,
      username: 'Username@gmail.com',
      password: 'somePassword',
      salt: 'someSalt',
      status: {ID: 2, status: 'active'},
      role: {ID: 1, role: 'admin'},
    }

    let JWTToken: string;

    expect(JWTToken = service.generateJWTToken(user)).resolves;
    expect(JWTToken).toBeDefined();
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledWith(user);
  });

  it('Generate JWT token AuthenticationService is not called on invalid user', () => {
    let user: User = null
    expect(() => { service.generateJWTToken(user); }).toThrow();
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(0);
  });

  //#endregion

  //#region VerifyJWTToken

  it('Validate token with undefined, null or empty token results in error', () => {
    let token: string = '';

    let errorStringToExcept = 'Must enter a valid token';

    expect(() => { service.verifyJWTToken(null); }).toThrow(errorStringToExcept);
    expect(() => { service.verifyJWTToken(undefined); }).toThrow(errorStringToExcept);
    expect(() => { service.verifyJWTToken(token); }).toThrow(errorStringToExcept);
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledTimes(0);
  });

  it('Validation of valid token should return true', () => {
    let validToken = 'token';
    expect(service.verifyJWTToken(validToken)).toBe(true);
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledWith(validToken);
  });

  it('Validation of invalid token should throw exception', () => {

    jest.spyOn(authenticationMock, "validateJWTToken").mockImplementationOnce(() => {throw new UnauthorizedException()});

    let invalidToken = 'token';
    expect(() => { service.verifyJWTToken(invalidToken); }).toThrow();
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledWith(invalidToken);
  });

  //#endregion



  //#region verifyUserEntity

  describe('Error handling with invalid users', () => {
    let user: User;
    const theories = [
      { input: user = null, expected: "User must be instantiated" },
      { input: user = undefined, expected: "User must be instantiated" },

      { input: user = {ID: undefined, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid ID" },
      { input: user = {ID: null, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid ID" },
      { input: user = {ID: -1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid ID" },
      { input: user = {ID: 1, username: undefined, password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: null, password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: '', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Jensen', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Jensen@@gmail', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Jensen@@hotmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: undefined, role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: null, role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: '', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: ' ', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: null, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with user role" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: undefined, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with user role" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 0, role: 'user'}, status: {ID: 1, status: 'pending'}},
        expected: "An error occurred with user role" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: null},
        expected: "An error occurred with user status" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: undefined},
        expected: "An error occurred with user status" },
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 0, status: 'pending'}},
        expected: "An error occurred with user status" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyUserEntity(theory.input as User); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid user does not throw error', () => {
    let user: User;
    const theories = [
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 1, status: 'pending'}}},
      { input: user = {ID: 1, username: 'Jan@hotmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: ''}, status: {ID: 1, status: 'pending'}}},
      { input: user = {ID: 1, username: 'Petrud@hotmail.de', password: 'somePassword', salt: 'someSalt', role: {ID: 2, role: 'admin'}, status: {ID: 1, status: 'pending'}}},
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 2, status: 'active'}}},
      { input: user = {ID: 1, username: 'Username@gmail.com', password: 'somePassword', salt: 'someSalt', role: {ID: 1, role: 'user'}, status: {ID: 2, status: ''}}},
    ];

    theoretically('No error message is thrown on valid user', theories, theory => {
      expect(() => { service.verifyUserEntity(theory.input as User);}).not.toThrow();
    })
  });

  //#endregion



  //#region GetAllUserRoles

  it('Get all user roles calls role service', async () => {
    let result;

    await expect(result = await service.getAllUserRoles()).resolves;
    await expect(result).toBeDefined();
    expect(mockRoleService.getRoles).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetAllStatuses

  it('Get all user statuses calls status service', async () => {
    let result;

    await expect(result = await service.getAllStatuses()).resolves;
    await expect(result).toBeDefined();
    expect(mockStatusService.getStatuses).toHaveBeenCalledTimes(1);
  });

  //#endregion

});










