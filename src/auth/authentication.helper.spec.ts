import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationHelper } from './authentication.helper';
import { User } from "../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

class JwtServiceMock {

  sign(payload: any, options: JwtSignOptions): string
  {
    return 'token';
  }

  verify(token: string, options: JwtSignOptions): boolean
  {
    return true;
  }
}

describe('AuthenticationService', () => {
  let service: AuthenticationHelper;
  let jwtMock: JwtService;

  beforeEach(async () => {

    const MockProvider = {
      provide: JwtService,
      useClass: JwtServiceMock
    };

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

  it('Generate hash throws error if password is undefined, null or empty', () => {
    let password: string = '';
    let salt: string = "someSalt";

    let errorStringToExcept: string = 'Password must be instantiated';

    expect(() => { service.generateHash(null, salt); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(undefined, salt); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, salt); }).toThrow(errorStringToExcept);
  });

  it('Generate hash throws error if salt is undefined, null or empty', () => {
    let password: string = "somePassword";
    let salt: string = '';

    let errorStringToExcept = 'Salt must be instantiated';

    expect(() => { service.generateHash(password, null); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, undefined); }).toThrow(errorStringToExcept);
    expect(() => { service.generateHash(password, salt); }).toThrow(errorStringToExcept);
  });
  //#endregion

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

  it('Invalid login throws error if user is undefined or null', () => {
    let userToValidate: User = null;
    let password: string = "somePassword";

    let errorStringToExcept = 'User must be instantiated';

    expect(() => { service.validateLogin(null, password); }).toThrow(errorStringToExcept);
    expect(() => { service.validateLogin(undefined, password); }).toThrow(errorStringToExcept);
    expect(() => { service.validateLogin(userToValidate, password); }).toThrow(errorStringToExcept);
  });

  it('Invalid login for user throws error', () => {
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

    expect(() => { service.validateLogin(user, 'someDifferentPassword')}).toThrow(errorStringToExcept);
  });

  //#endRegion
});
