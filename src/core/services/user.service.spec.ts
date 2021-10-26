import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { User } from "../models/user";

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
    expect(() => { service.generateJWTToken(user); }).toThrow();
    expect(authenticationMock.generateJWTToken).toHaveBeenCalledTimes(0);
  });
  //#endRegion

  //#region verifyUser
  //endRegion

});
