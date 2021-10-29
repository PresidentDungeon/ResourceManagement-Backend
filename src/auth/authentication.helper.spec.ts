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
        verify: jest.fn((token: string, options: JwtSignOptions) => {})
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationHelper, MockProvider],
    }).compile();

    service = module.get<AuthenticationHelper>(AuthenticationHelper);
    jwtMock = module.get<JwtService>(JwtService);
  });

  it('Service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock JWT Service should be defined', () => {
    expect(jwtMock).toBeDefined();
  });

  //#region SecretKey
  it('Secret key should be defined', () => {
    expect(service.secretKey.length).toBeDefined();
  });

  it('Secret key should be 16 characters long', () => {
    expect(service.secretKey.length).toBe(16);
  });
  //#endregion

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
      role: {ID: 1, role: 'admin'},
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
      role: {ID: 1, role: 'admin'},
      username: 'Hans'
    }

    let errorStringToExcept: string = 'Entered password is incorrect';

    expect(() => { service.validateLogin(user, 'someDifferentPassword')}).toThrow(errorStringToExcept);
  });
  //#endregion

  //#region GenerateJWTToken
  it('Generation of JWT token is successful on valid user', () => {

    const user: User = {
      ID: 1,
      password: 'someHash',
      salt: 'someSalt',
      role: {ID: 1, role: 'admin'},
      username: 'Hans'
    }

    const result = service.generateJWTToken(user);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(jwtMock.sign).toHaveBeenCalledTimes(1);
  });
  //#endregion

  //#region GenerateVerificationToken
  it('Generated verification code should be defined', () => {
    expect(service.generateVerificationToken()).toBeDefined();
  });

  it('Generated verification code should be 6 characters', () => {
    expect(service.generateVerificationToken().length).toBe(6);
  });
  //#endregion

  //#region validateJWTToken
  it('Validate valid token should return true', () => {
    let token: string = 'SomeToken';

    expect(service.validateJWTToken(token)).toBe(true);
    expect(jwtMock.verify).toHaveBeenCalledTimes(1);
  });

  it('Invalid token should result in error',  () => {

    jest.spyOn(jwtMock, "verify").mockImplementationOnce(() => {throw new Error('Token is not valid')});

    let token: string = 'invalidToken';
    let errorStringToExcept = 'Token is not valid';

    expect(() => { service.validateJWTToken(token); }).toThrow(errorStringToExcept);
    expect(jwtMock.verify).toHaveBeenCalledTimes(1);
  });
  //#endregion

});
