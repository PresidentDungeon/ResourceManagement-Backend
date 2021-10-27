import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { User } from "../models/user";
import theoretically from "jest-theories";

describe('UserService', () => {
  let service: UserService;
  let authenticationMock: AuthenticationHelper;

  beforeEach(async () => {

    const MockProvider = {
      provide: AuthenticationHelper,
      useFactory: () => ({
        generateSalt: jest.fn(() => {return 'saltValue';}),
        generateHash: jest.fn((password: string, salt: string) => {return 'hashValue';}),
        generateJWTToken: jest.fn((password: string, salt: string) => {return 'signedToken';}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, MockProvider],
    }).compile();

    service = module.get<UserService>(UserService);
    authenticationMock = module.get<AuthenticationHelper>(AuthenticationHelper);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  //#region GenerateSalt
  it('Generate salt is called in authentication service', () => {
    service.generateSalt();
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
  //#endregion

  //#region generateJWTToken
  it('Generate JWT token AuthenticationService is called on valid user', () => {

    let user: User = {
      ID: 1,
      password: 'somePassword',
      salt: 'someSalt',
      userRole: 'Admin',
      username: 'Hans'
    }

    service.generateJWTToken(user);
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(1);
  });

  it('Generate JWT token AuthenticationService is not called on invalid user', () => {
    let user: User = null
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(0);
  });
  //#endRegion

  //#region verifyUser
  describe('Error handling with invalid users', () => {
    let user: User;
    const theories = [
      { input: user = null, expected: "User must be instantiated" },
      { input: user = undefined, expected: "User must be instantiated" },

      { input: user = {ID: undefined, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid ID" },
      { input: user = {ID: null, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: 'Admin' },
        expected: "User must have a valid ID" },
      { input: user = {ID: 0, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid ID" },
      { input: user = {ID: 1, username: undefined, password: 'somePassword', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: null, password: 'somePassword', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: '', password: 'somePassword', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Username" },
      { input: user = {ID: 1, username: 'Hans', password: undefined, salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: null, salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: '', salt: 'someSalt', userRole: 'Admin'},
        expected: "User must have a valid Password" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: undefined, userRole: 'Admin'},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: null, userRole: 'Admin'},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: '', userRole: 'Admin'},
        expected: "An error occurred with Salt" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: undefined},
        expected: "User must have a valid Role" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: null},
        expected: "User must have a valid Role" },
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: ''},
        expected: "User must have a valid Role" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyUser(theory.input as User); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid user does not throw error', () => {
    let user: User;
    const theories = [
      { input: user = {ID: 1, username: 'Hans', password: 'somePassword', salt: 'someSalt', userRole: 'Admin'}},
    ];

    theoretically('No error message is thrown on valid user', theories, theory => {
      expect(() => { service.verifyUser(theory.input as User);}).not.toThrow();
    })
  });
  //endRegion

});
