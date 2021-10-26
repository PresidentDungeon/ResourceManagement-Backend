import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationHelper } from './authentication.helper';
import { User } from "../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

describe('AuthenticationService', () => {
  let service: AuthenticationHelper;
  let jwtMock: JwtService;

  beforeEach(async () => {

    const MockProvider = {
      provide: JwtService,
      useFactory: () => ({
        sign: jest.fn((payload: any, options: JwtSignOptions) => {return 'token';}),
        verify: jest.fn((token: string, options: JwtSignOptions) => {return 'token';})
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationHelper, MockProvider],
    }).compile();

    service = module.get<AuthenticationHelper>(AuthenticationHelper);
    jwtMock = module.get<JwtService>(JwtService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Secret key should be defined', () => {
    expect(service.secretKey.length).toBeDefined();
  });

  //#region GenerateSalt
  it('Generated salt should be defined', () => {
    expect(service.generateSalt().length).toBeDefined();
  });

  it('Generated salt should be 16 characters', () => {
    expect(service.generateSalt().length).toBe(16);
  });
  //#endregion

  //#region GenerateHash
  it('Generated hash value should be defined', () => {
    let password: string = "somePassword";
    let salt: string = "someSalt";
    expect(service.generateHash(password, salt)).toBeDefined();
  });

  it('Generated hash from same password and salt must be identical', () => {
    let password: string = "somePassword";
    let salt: string = "someSalt";

    let firstHash = service.generateHash(password, salt);
    let secondHash = service.generateHash(password, salt);

    expect(firstHash).toBe(secondHash);
  });

  //#region validateLogin
  it('Valid login for user', () => {
    let userPassword: string = 'somePassword';
    let generatedSalt: string = service.generateSalt();
    let generatedHash: string = service.generateHash(userPassword, generatedSalt);

    let user: User = {
      ID: 1,
      password: generatedHash,
      salt: generatedSalt,
      userRole: 'Admin',
      username: 'Hans'
    }

    let errorStringToExcept: string = 'Entered password is incorrect';

    expect(() => { service.validateLogin(user, userPassword)}).not.toThrow(errorStringToExcept);
  });

  it('Invalid login for user throws error', () => {
    let userPassword: string = 'somePassword';
    let generatedSalt: string = service.generateSalt();
    let generatedHash: string = service.generateHash(userPassword, generatedSalt);

    const user: User = {
      ID: 1,
      password: generatedHash,
      salt: generatedSalt,
      userRole: 'Admin',
      username: 'Hans'
    }

    let errorStringToExcept: string = 'Entered password is incorrect';

    expect(() => { service.validateLogin(user, 'someDifferentPassword')}).toThrow(errorStringToExcept);
  });
  //#endRegion

  it('Generation of JWT token is successful on valid user', () => {

    const user: User = {
      ID: 1,
      password: 'someHash',
      salt: 'someSalt',
      userRole: 'Admin',
      username: 'Hans'
    }

    const result = service.generateJWTToken(user);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(jwtMock.sign).toHaveBeenCalledTimes(1);
  });
  //#endRegion

  //#region validateJWTToken
  it('Validate valid token should return true', () => {
    let token: string = 'SomeToken';

    expect(service.validateJWTToken(token)).toBe(true);
    expect(jwtMock.verify).toHaveBeenCalledTimes(1);
  });

  it('Validate token with undefined, null or empty token results in error', () => {
    let token: string = '';

    let errorStringToExcept = 'Must enter a valid token';

    expect(() => { service.validateJWTToken(null); }).toThrow(errorStringToExcept);
    expect(() => { service.validateJWTToken(undefined); }).toThrow(errorStringToExcept);
    expect(() => { service.validateJWTToken(token); }).toThrow(errorStringToExcept);
    expect(jwtMock.verify).toHaveBeenCalledTimes(0);
  });

  it('Invalid token should result in error', async () => {

    const MockProviderTest = {
      provide: JwtService,
      useFactory: () => ({ verify: jest.fn((token: string, options: JwtSignOptions) => {throw 'Token is not valid';})
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationHelper, MockProviderTest],
    }).compile();

    service = module.get<AuthenticationHelper>(AuthenticationHelper);
    jwtMock = module.get<JwtService>(JwtService);

    let token: string = 'invalidToken';
    let errorStringToExcept = 'Token is not valid';

    expect(() => { service.validateJWTToken(token); }).toThrow(errorStringToExcept);
    expect(jwtMock.verify).toHaveBeenCalledTimes(1);
  });
  //#endRegion
});
