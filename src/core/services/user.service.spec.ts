import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { User } from "../models/user";
import theoretically from "jest-theories";
import { FindManyOptions, Repository, SelectQueryBuilder } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import exp from "constants";
import { UnauthorizedException } from "@nestjs/common";

describe('UserService', () => {
  let service: UserService;
  let authenticationMock: AuthenticationHelper;
  let mockUserRepository: Repository<UserEntity>;

  beforeEach(async () => {

    const AuthenticationMock = {
      provide: AuthenticationHelper,
      useFactory: () => ({
        generateSalt: jest.fn(() => {return 'saltValue';}),
        generateHash: jest.fn((password: string, salt: string) => {return 'hashValue';}),
        validateLogin: jest.fn((user: User, password: string) => {return true;}),
        generateJWTToken: jest.fn((user: User) => {return 'signedToken';}),
        generateVerificationToken: jest.fn(() => {return 'verificationToken';}),
        validateJWTToken: jest.fn((token: string) => {return true;}),
      })
    }

    const MockUserRepository = {
      provide: getRepositoryToken(UserEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<UserEntity>) => {}),
        save: jest.fn((userEntity: UserEntity) => { return new Promise(resolve => {resolve(userEntity);});}),
        create: jest.fn((userEntity: UserEntity) => {return new Promise(resolve => {resolve(userEntity);});}),
        createQueryBuilder: jest.fn(() => {}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, AuthenticationMock, MockUserRepository],
    }).compile();

    service = module.get<UserService>(UserService);
    authenticationMock = module.get<AuthenticationHelper>(AuthenticationHelper);
    mockUserRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
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

  //#region CreateUser
  it('Creation of user with invalid username fails', () => {
    expect(service).toBeDefined();
  });

  describe('Creation of user with invalid username or password fails', () => {
      let username: string;
      let password: string;

    const theories = [
      { username: username = null, password: password = 'password', expectedError: "Username must be between 8-60 characters" },
      { username: username = 'Jensen', password: password = 'password', expectedError: "Username must be between 8-60 characters" },
      { username: username = 'ThisUsernameIsTooLongAndShouldResultInAnError................', password: password = 'password', expectedError: "Username must be between 8-60 characters" },
      { username: username = 'username', password: password = 'passwor', expectedError: "Password must be minimum 8 characters long" },
    ];

    theoretically('The correct error message is thrown during user creation', theories, theory => {
      expect(() => { service.createUser(theory.username, theory.password); }).toThrow(theory.expectedError);
      expect(authenticationMock.generateSalt).toHaveBeenCalledTimes(0);
      expect(authenticationMock.generateHash).toHaveBeenCalledTimes(0);
    })
  });

  describe('Creation of user with valid username or password returns user object', () => {
    let username: string;
    let password: string;

    const theories = [
      { username: username = 'username', password: password = 'password'},
      { username: username = 'ThisUsernameIsAlmostTooLongForRegistrationButIsWithinLimit..', password: password = 'password'},
    ];

    theoretically('User creation is successful with correct values', theories, theory => {

      const user: User = service.createUser(theory.username, theory.password);

      expect(user).toBeDefined();
      expect(user.salt).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.role).toBeNull();

      expect(user.username).toBe(theory.username);
      expect(user.password).not.toBe(theory.password);

      expect(authenticationMock.generateSalt).toHaveBeenCalledTimes(1);
      expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
    })
  });

  //#endregion

  //#region AddUser

  it('Saving user with invalid data fails', async () => {

    let user: User = {
      ID: 0,
      username: '',
      password: 'Password',
      salt: 'SaltValue',
      role: null
    }

    await expect(service.addUser(user)).rejects.toThrow();
    expect(mockUserRepository.count).toHaveBeenCalledTimes(0);
    expect(authenticationMock.generateVerificationToken).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Saving user is successful on valid data', async () => {

    jest.spyOn(mockUserRepository, "count").mockResolvedValueOnce(0);

    let user: User = {
      ID: 0,
      username: 'Peter@gmail.com',
      password: 'Password',
      salt: 'SaltValue',
      role: null
    }

    let returnedUser: User;

    await expect(returnedUser = await service.addUser(user)).resolves;

    expect(user).toBe(returnedUser);
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateVerificationToken).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Saving user throws error when registering with same username', async () => {

    jest.spyOn(mockUserRepository, "count").mockResolvedValueOnce(1);

    let errorStringToExcept: string = 'User with the same name already exists';

    let user: User = {
      ID: 0,
      username: 'Peter@gmail.com',
      password: 'Password',
      salt: 'SaltValue',
      role: null
    }

    await expect(service.addUser(user)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.count).toHaveBeenCalledTimes(1);
    expect(authenticationMock.generateVerificationToken).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
  });
  //#endregion

  //#region GetUserByUsername

  it('Find user with username of null results in error', async () => {

    let username: string = null;

    let errorStringToExcept = 'Username must be instantiated or valid';

    await expect(service.getUserByUsername(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByUsername(undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.getUserByUsername(username)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it('Find non-existing user results in error', async () => {

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {return new Promise(resolve => {resolve(null);});}),
    };

    jest
      .spyOn(mockUserRepository, 'createQueryBuilder')
      .mockImplementation(() => createQueryBuilder);

    let username: string = 'nonExistingUser';
    let errorStringToExcept = 'No user registered with such a name';

    await expect(service.getUserByUsername(username)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  it('Find existing user returns valid user information', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      status: 'pending',
      verificationCode: '2xY3b4',
      role: {ID: 1, role: 'user'}};

    let expectedUser: User = {
      ID: 1,
      username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      verificationCode: '2xY3b4',
      role: {ID: 1, role: 'user'}};

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {return new Promise(resolve => {resolve(storedUser);});}),
    };

    jest
      .spyOn(mockUserRepository, 'createQueryBuilder')
      .mockImplementation(() => {return createQueryBuilder});

    let username: string = 'Username';
    let foundUser, status

    await expect([foundUser, status] = await service.getUserByUsername(username)).resolves;

    expect(foundUser).toStrictEqual(expectedUser);
    expect(status).toBe(storedUser.status);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  //#endregion

  //#region VerifyUser

  it('Verification of user with invalid ID throws error', async () => {

    let ID: number = 0;
    let verificationCode = "X2TMM6";

    let errorStringToExcept: string = 'Invalid ID entered';

    await expect(service.verifyUser(null, verificationCode)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUser(undefined, verificationCode)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUser(ID, verificationCode)).rejects.toThrow(errorStringToExcept);

    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with invalid verificationCode throws error', async () => {

    let ID: number = 1;
    let verificationCode = "X2TMM";

    let errorStringToExcept: string = 'Invalid verification code entered';

    await expect(service.verifyUser(ID, null)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUser(ID, undefined)).rejects.toThrow(errorStringToExcept);
    await expect(service.verifyUser(ID, verificationCode)).rejects.toThrow(errorStringToExcept);

    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);
    expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it('Verification of user with wrong verificationCode throws error', async () => {

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {return new Promise(resolve => {resolve(null);});}),
    };

    jest
      .spyOn(mockUserRepository, 'createQueryBuilder')
      .mockImplementation(() => {return createQueryBuilder});

    let ID: number = 1;
    let verificationCode = "X2TMM6";

    let errorStringToExcept: string = 'Wrong verification code entered';

    await expect(service.verifyUser(ID, verificationCode)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  it('Verification of user with active status throws error', async () => {

    let user: UserEntity = {
      ID: 1, username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      status: 'active',
      verificationCode: '2xY3b4',
      role: {ID: 1, role: 'user'}};

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {return new Promise(resolve => {resolve(user);});}),
    };

    jest
      .spyOn(mockUserRepository, 'createQueryBuilder')
      .mockImplementation(() => {return createQueryBuilder});

    let ID: number = 1;
    let verificationCode = "2xY3b4";

    let errorStringToExcept: string = 'This user has already been verified';

    await expect(service.verifyUser(ID, verificationCode)).rejects.toThrow(errorStringToExcept);
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(0);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });

  it('Verification of user with pending status and correct verification code is successful', async () => {

    let user: UserEntity = {
      ID: 1, username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      status: 'pending',
      verificationCode: '2xY3b4',
      role: {ID: 1, role: 'user'}};

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {return new Promise(resolve => {resolve(user);});}),
    };

    jest
      .spyOn(mockUserRepository, 'createQueryBuilder')
      .mockImplementation(() => {return createQueryBuilder});

    let ID: number = 1;
    let verificationCode = "2xY3b4";

    await expect(service.verifyUser(ID, verificationCode)).resolves;
    expect(mockUserRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);

    jest.spyOn(mockUserRepository, 'createQueryBuilder').mockReset();
  });
  //#endregion

  //#region GenerateSalt
  it('Generate salt is called in authentication service', () => {
    service.generateSalt();
    expect(authenticationMock.generateSalt).toHaveBeenCalledTimes(1);
  });

  it('Generate salt returns valid string', () => {
    expect(service.generateSalt()).toBeDefined();
    expect(authenticationMock.generateSalt).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GenerateHash
  it('Generate hash is called in authenticationService', () => {

    let password: string = 'somePassword';
    let salt: string = "someSalt";

    service.generateHash(password, salt);
    expect(authenticationMock.generateHash).toHaveBeenCalledTimes(1);
  });

  it('Generate hash throws error if password is undefined, null or empty', () => {
    let password: string = '';
    let salt: string = "someSalt";

    let errorStringToExcept: string = 'Password must be instantiated';

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
  });
  //#endregion

  //#region generateJWTToken
  it('Generate JWT token AuthenticationService is called on valid user', () => {

    let user: User = {
      ID: 1,
      password: 'somePassword',
      salt: 'someSalt',
      role: {ID: 1, role: 'admin'},
      username: 'Hans'
    }

    service.generateJWTToken(user);
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(1);
  });

  it('Generate JWT token AuthenticationService is not called on invalid user', () => {
    let user: User = null
    expect(() => { service.generateJWTToken(user); }).toThrow();
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(0);
  });
  //#endregion

  //#region Login

  it('Login with username of null results in error', async () => {

    let username: string = null;
    let password: string = 'password';
    let errorStringToExcept = 'Username or Password is non-existing';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);
  });

  it('Login with password of null results in error', async () => {

    let username: string = 'username';
    let password: string = null;
    let errorStringToExcept = 'Username or Password is non-existing';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);
  });

  it('Login with non-existing users results in error', async () => {

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementation((username: string) => {throw new Error('No user registered with such a name');});

    let username: string = 'nonExistingUser';
    let password: string = 'somePassword';
    let errorStringToExcept = 'No user registered with such a name';

    await expect(service.login(username, password)).rejects.toThrow(errorStringToExcept);
    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(0);

    jest.spyOn(service, 'getUserByUsername').mockReset();
  });

  it('Login with existing user completes without error', async () => {

    let storedUser: UserEntity = {
      ID: 1,
      username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      status: 'pending',
      verificationCode: '2xY3b4',
      role: {ID: 1, role: 'user'}};

    let expectedUser: User = {
      ID: 1,
      username: 'Username',
      password: 'Password',
      salt: 'someSalt',
      role: {ID: 1, role: 'user'}};

    jest
      .spyOn(service, 'getUserByUsername')
      .mockImplementation((username: string) => {return new Promise(resolve => {resolve([expectedUser, storedUser.status]);});});


    let username: string = 'Username';
    let password: string = 'Password';
    let foundUser, status

    await expect([foundUser, status] = await service.login(username, password)).resolves;
    expect(foundUser).toStrictEqual(expectedUser);
    expect(status).toBe(storedUser.status);

    expect(service.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(authenticationMock.validateLogin).toHaveBeenCalledTimes(1);

    jest.spyOn(service, 'getUserByUsername').mockReset();
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
  });

  it('Validation of invalid token should throw exception', () => {

    jest.spyOn(authenticationMock, "validateJWTToken").mockImplementationOnce(() => {throw new UnauthorizedException()});

    let invalidToken = 'token';
    expect(() => { service.verifyJWTToken(invalidToken); }).toThrow();
    expect(authenticationMock.validateJWTToken).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region verifyUser
  describe('Error handling with invalid users', () => {
    let user: User;
    const theories = [
      { input: user = null, expected: "User must be instantiated" },
      { input: user = undefined, expected: "User must be instantiated" },

      { input: user = {ID: undefined, username: 'Hans', password: 'somePassword', salt: 'someSalt', role: null},
        expected: "User must have a valid ID" },
      { input: user = {ID: null, username: 'Hans', password: 'somePassword', salt: 'someSalt', role: null },
        expected: "User must have a valid ID" },
      { input: user = {ID: -1, username: 'Hans', password: 'somePassword', salt: 'someSalt', role: null},
        expected: "User must have a valid ID" },
      { input: user = {ID: 1, username: undefined, password: 'somePassword', salt: 'someSalt', role: null},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: null, password: 'somePassword', salt: 'someSalt', role: null},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: '', password: 'somePassword', salt: 'someSalt', role: null},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Hans', password: undefined, salt: 'someSalt', role: null},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: null, salt: 'someSalt', role: null},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: '', salt: 'someSalt', role: null},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: undefined, role: null},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: null, role: null},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: '', role: null},
        expected: "An error occurred with Salt" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyUserEntity(theory.input as User); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid user does not throw error', () => {
    let user: User;
    const theories = [
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: 'someSalt', role: null}},
    ];

    theoretically('No error message is thrown on valid user', theories, theory => {
      expect(() => { service.verifyUserEntity(theory.input as User);}).not.toThrow();
    })
  });
  //#endregion
});










