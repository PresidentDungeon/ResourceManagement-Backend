import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationHelper } from './authentication.helper';
import { User } from "../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import theoretically from "jest-theories";
import { PasswordToken } from "../core/models/password.token";

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

  //#region GenerateRandomString

  describe('Generated token throws error on invalid token length', () => {
    let tokenLength: Number;
    let errorStringToExpect: string = 'Token length must be a positive numeric number';

    const theories = [
      { input: tokenLength = null},
      { input: tokenLength = 0},
      { input: tokenLength = -1},
      { input: tokenLength = Number.MIN_SAFE_INTEGER},
      { input: tokenLength = 1.1},
      { input: tokenLength = -1.1},
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.generateToken(theory.input); }).toThrow(errorStringToExpect);
    })
  });

   describe('Generated token returns token of expected length', () => {
     let tokenLength: Number;

     const theories = [
       { input: tokenLength = 1},
     ];

     theoretically('The token is of expected length', theories, theory => {
       const token: string = service.generateToken(theory.input);
       expect(token.length).toBe(theory.input);
     })
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

     let saltSize: number = 16;

     let userPassword: string = 'somePassword';
     let generatedSalt: string = service.generateToken(saltSize);
     let generatedHash: string = service.generateHash(userPassword, generatedSalt);

     let user: User = {
       ID: 1,
       password: generatedHash,
       salt: generatedSalt,
       role: {ID: 1, role: 'admin'},
       status: {ID: 1, status: 'active'},
       username: 'Hans'
     }

     let errorStringToExcept: string = 'Entered password is incorrect';

     expect(() => { service.validateLogin(user, userPassword)}).not.toThrow(errorStringToExcept);
   });

   it('Invalid login for user throws error', () => {

     let saltSize: number = 16;

     let userPassword: string = 'somePassword';
     let generatedSalt: string = service.generateToken(saltSize);
     let generatedHash: string = service.generateHash(userPassword, generatedSalt);

     const user: User = {
       ID: 1,
       username: 'Hans',
       password: generatedHash,
       salt: generatedSalt,
       role: {ID: 1, role: 'admin'},
       status: {ID: 1, status: 'active'}

     }

     let errorStringToExcept: string = 'Entered password is incorrect';

     expect(() => { service.validateLogin(user, 'someDifferentPassword')}).toThrow(errorStringToExcept);
   });

   //#endregion

   //#region GenerateJWTToken

   it('Generation of JWT token is successful on valid user', () => {

     const user: User = {
       ID: 1,
       username: 'Hans',
       password: 'someHash',
       salt: 'someSalt',
       role: {ID: 1, role: 'admin'},
       status: {ID: 1, status: 'active'}
     }

     const result = service.generateJWTToken(user);

     expect(result).toBeDefined();
     expect(typeof result).toBe('string');
     expect(jwtMock.sign).toHaveBeenCalledTimes(1);
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

   //#region ValidatePasswordToken

   it('Validation of expired password token throws error',  () => {

     const date: Date = new Date();
     date.setHours(date.getHours() - 1);

     let errorStringToExcept = 'Password reset link has expired';

     const passwordToken: PasswordToken = {user: null, time: date, hashedResetToken: ''}

     expect(() => { service.validatePasswordToken(passwordToken); }).toThrow(errorStringToExcept);
   });

   it('Validation of valid password token returns true',  () => {

     const date: Date = new Date();
     date.setHours(date.getHours() - 1);
     date.setMinutes(date.getMinutes() + 1);

     const passwordToken: PasswordToken = {user: null, time: date, hashedResetToken: ''}

     expect(service.validatePasswordToken(passwordToken)).toBe(true);
   });

   //#endregion

});
