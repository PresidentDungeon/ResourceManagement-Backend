import { Test, TestingModule } from "@nestjs/testing";
import { WhitelistService } from "./whitelist.service";
import { Repository } from "typeorm";
import { WhitelistDomainEntity } from "../../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Whitelist } from "../models/whitelist";
import { Filter } from "../models/filter";
import theoretically from "jest-theories";
import { FilterList } from "../models/filterList";
import { MockRepositories } from "../../infrastructure/error-handling/mock-repositories";

describe("WhitelistService", () => {
  let service: WhitelistService;
  let mockWhitelistRepository: Repository<WhitelistDomainEntity>;

  let mockContractFactory = new MockRepositories();

  beforeEach(async () => {

    const MockWhitelistRepository = mockContractFactory.getMockRepository(WhitelistDomainEntity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhitelistService, MockWhitelistRepository]
    }).compile();

    service = module.get<WhitelistService>(WhitelistService);
    mockWhitelistRepository = module.get<Repository<WhitelistDomainEntity>>(getRepositoryToken(WhitelistDomainEntity));
  });

  it("Whitelist service should be defined", () => {
    expect(service).toBeDefined();
  });

  //#region CreateWhitelist

  it("Creating a whitelist-item with valid parameters returns whitelist object", async () => {

    let whitelist: Whitelist = {
      ID: 0,
      domain: "@semcomaritime.com"
    };

    await expect(service.addWhitelist(whitelist)).resolves;
  });

  it("Creating a whitelist with invalid parameters throws error", async () => {

    let whitelist: Whitelist = {
      ID: 0,
      domain: null
    };

    await expect(service.addWhitelist(whitelist)).rejects.toThrow();
  });

  //#endregion

  //#region GetWhitelists

  describe("Get whitelist throws error when invalid filter", () => {

    let filter: Filter;
    let expectedError: string;

    const theories = [
      { filter: filter = null, expectedError: "Invalid filter entered" },
      { filter: filter = undefined, expectedError: "Invalid filter entered" },
      { filter: filter = { itemsPrPage: null, currentPage: 1 }, expectedError: "Invalid items pr. page entered" },
      { filter: filter = { itemsPrPage: undefined, currentPage: 1 }, expectedError: "Invalid items pr. page entered" },
      { filter: filter = { itemsPrPage: 0, currentPage: 1 }, expectedError: "Invalid items pr. page entered" },
      {
        filter: filter = { itemsPrPage: Number.MIN_SAFE_INTEGER, currentPage: 1 },
        expectedError: "Invalid items pr. page entered"
      },
      { filter: filter = { itemsPrPage: 1, currentPage: null }, expectedError: "Invalid current page entered" },
      { filter: filter = { itemsPrPage: 1, currentPage: undefined }, expectedError: "Invalid current page entered" },
      { filter: filter = { itemsPrPage: 1, currentPage: -1 }, expectedError: "Invalid current page entered" },
      {
        filter: filter = { itemsPrPage: 1, currentPage: Number.MIN_SAFE_INTEGER },
        expectedError: "Invalid current page entered"
      }
    ];

    theoretically("The correct error message is thrown during user filtering", theories, async theory => {
      await expect(service.getWhitelists(theory.filter)).rejects.toThrow(theory.expectedError);
      expect(mockWhitelistRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
      expect(mockWhitelistRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
    });
  });

  it("Get whitelists with valid filterlist", async () => {

    let storedWhitelist: WhitelistDomainEntity[] = [
      { ID: 1, domain: "@semcomaritime.com", contracts: []},
      { ID: 2, domain: "@easv365.dk", contracts: []}
    ];

    let expectedTotalListSize: number = 2;
    let expectedListSize: number = 2;

    let filter: Filter = { currentPage: 1, itemsPrPage: 1 };

    jest
      .spyOn(mockWhitelistRepository.createQueryBuilder(), "getMany")
      .mockImplementation(() => {
        return new Promise(resolve => {
          resolve(storedWhitelist);
        });
      });

    jest
      .spyOn(mockWhitelistRepository.createQueryBuilder(), "getCount")
      .mockImplementation(() => {
        return new Promise(resolve => {
          resolve(storedWhitelist.length);
        });
      });

    let filterList: FilterList<Whitelist>;

    await expect(filterList = await service.getWhitelists(filter)).resolves;
    expect(filterList.list).toStrictEqual(storedWhitelist);
    expect(filterList.list.length).toBe(expectedListSize);
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockWhitelistRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockWhitelistRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

    jest.spyOn(mockWhitelistRepository, "createQueryBuilder").mockReset();
  });

  //#endregion

  //#region GetWhitelistByID

  it("Invalid ID results in error", async () => {

    let ID: number = 0;

    let errorStringToExpect = "Whitelist ID must be instantiated or valid";

    await expect(service.getWhitelistByID(null)).rejects.toThrow(errorStringToExpect);
    await expect(service.getWhitelistByID(undefined)).rejects.toThrow(errorStringToExpect);
    await expect(service.getWhitelistByID(ID)).rejects.toThrow(errorStringToExpect);
    expect(mockWhitelistRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
  });

  it("Valid whitelist entry returns the whitelist entity", async () => {

    let storedWhitelist: WhitelistDomainEntity = {
      ID: 1,
      domain: "@semcomaritime.com",
      contracts: []
    };

    jest
      .spyOn(mockWhitelistRepository.createQueryBuilder(), "getOne")
      .mockImplementation(() => {
        return new Promise(resolve => {
          resolve(storedWhitelist);
        });
      });

    let ID: number = 1;
    let foundWhitelist;

    await expect(foundWhitelist = await service.getWhitelistByID(ID)).resolves;

    expect(foundWhitelist).toStrictEqual(storedWhitelist);
    expect(mockWhitelistRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);

    jest.spyOn(mockWhitelistRepository, "createQueryBuilder").mockReset();

  });
  //#endregion

  //#region UpdateWhitelist

  it("Update invalid whitelist throws error", async () => {

    let whitelistToUpdate: WhitelistDomainEntity = { ID: 0, domain: "@gmail.com", contracts: [] };
    let expectedErrorMessage: string = "Whitelist must have a valid ID";

    jest
      .spyOn(service, "getWhitelistByID")
      .mockImplementationOnce((ID: number) => {
        throw new Error("Whitelist must have a valid ID");
      });

    await expect(service.updateWhitelist(whitelistToUpdate)).rejects.toThrow(expectedErrorMessage);
    expect(service.getWhitelistByID).toHaveBeenCalledTimes(1);
    expect(mockWhitelistRepository.save).toHaveBeenCalledTimes(0);

  });


  it("Update whitelist with valid data returns", async () => {

    let storedWhitelist: WhitelistDomainEntity = {
      ID: 1,
      domain: "@semco.dk",
      contracts: []
    };

    let expectedWhitelist: WhitelistDomainEntity = {
      ID: 1,
      domain: "@semcomaritime.com",
      contracts: []
    };

    let whitelistObject: WhitelistDomainEntity = { ID: 1, domain: "@semcomaritime.com", contracts: [] };

    jest
      .spyOn(service, "getWhitelistByID")
      .mockImplementationOnce((ID: number) => {
        return new Promise(resolve => {
          return resolve(storedWhitelist);
        });
      });

    jest
      .spyOn(service, "verifyWhitelist")
      .mockImplementationOnce((whitelist: WhitelistDomainEntity) => {
      });

    jest
      .spyOn(mockWhitelistRepository, "save")
      .mockImplementationOnce((whitelist: WhitelistDomainEntity) => {
        return new Promise(resolve => {
          return resolve(whitelist);
        });
      });

    let updatedWhitelist: Whitelist;

    await expect(updatedWhitelist = await service.updateWhitelist(whitelistObject)).resolves;
    expect(updatedWhitelist).toStrictEqual(expectedWhitelist);
    expect(service.getWhitelistByID).toHaveBeenCalledTimes(1);
    expect(service.getWhitelistByID).toHaveBeenCalledWith(whitelistObject.ID);
    expect(service.verifyWhitelist).toHaveBeenCalledTimes(1);
    expect(service.verifyWhitelist).toHaveBeenCalledWith(storedWhitelist);
    expect(mockWhitelistRepository.save).toHaveBeenCalledTimes(1);
    expect(mockWhitelistRepository.save).toHaveBeenCalledWith(storedWhitelist);

  });

  //#endregion

  //#region DeleteWhitelist

  it("Error during delete throws correct error", async () => {

    let storedWhitelist: WhitelistDomainEntity = {
      ID: 1,
      domain: "@semco.dk",
      contracts: []
    };
    jest
      .spyOn(service, "getWhitelistByID")
      .mockImplementation(() => {
        return new Promise(resolve => {
          return resolve(storedWhitelist);
        });
      });

    let expectedErrorMessage: string = "Internal server error";

    jest.spyOn(mockWhitelistRepository, "delete").mockImplementation(() => {
      throw new Error();
    });
    await expect(service.deleteWhitelist(storedWhitelist)).rejects.toThrow(expectedErrorMessage);
    expect(mockWhitelistRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockWhitelistRepository.delete).toHaveBeenCalledWith(storedWhitelist);

    jest.restoreAllMocks();
  });

  it("Delete valid ID is successful", async () => {

    let storedWhitelist: WhitelistDomainEntity = {
      ID: 1,
      domain: "@semco.dk",
      contracts: []
    };
    jest
      .spyOn(service, "getWhitelistByID")
      .mockImplementation(() => {
        return new Promise(resolve => {
          return resolve(storedWhitelist);
        });
      });

    await expect(await service.deleteWhitelist(storedWhitelist)).resolves;
    expect(mockWhitelistRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockWhitelistRepository.delete).toHaveBeenCalledWith(storedWhitelist);
  });

  //#endregion

  //#region Verify
  describe("error handling invalid whitelist", () => {
    let whitelist: Whitelist;
    const theories = [
      { input: whitelist = null, expected: "Whitelist must be instantiated" },
      { input: whitelist = undefined, expected: "Whitelist must be instantiated" },

      { input: whitelist = { ID: null, domain: "@semcomaritime.com" }, expected: "Whitelist must have a valid ID" },
      {
        input: whitelist = { ID: undefined, domain: "@semcomaritime.com" },
        expected: "Whitelist must have a valid ID"
      },
      { input: whitelist = { ID: -1, domain: "@semcomaritime.com" }, expected: "Whitelist must have a valid ID" },

      { input: whitelist = { ID: 1, domain: null }, expected: "Whitelist domain must be valid" },
      { input: whitelist = { ID: 1, domain: undefined }, expected: "Whitelist domain must be valid" },
      {
        input: whitelist = { ID: 1, domain: "Bobbynielsen@semcomaritime.com" },
        expected: "Whitelist domain must be valid"
      },
      { input: whitelist = { ID: 1, domain: "@semco.dk@" }, expected: "Whitelist domain must be valid" },
      { input: whitelist = { ID: 1, domain: "@semco*.dk" }, expected: "Whitelist domain must be valid" }

    ];

    theoretically("The error matches the correct errormessage", theories, theory => {
      expect(() => {
        service.verifyWhitelist(theory.input as Whitelist);
      }).toThrow(theory.expected);
    });

  });

  //#endregion


  //#region UserVerify

  it("username without At returns false", async () => {
    let domainStored: string[] = ["@total.dk", "@semcomaritime.com", "@easv365.dk"];

    let searchString: string = "AndersAnderseneasv365.dk";
    let slicedString: string;

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "andWhere").mockImplementation( (searchString:string, parameters:any) => {
      slicedString = parameters.whitelist;
      return mockWhitelistRepository.createQueryBuilder();
    })

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "getCount").mockImplementation(() => {

      let count = 0;
      for (let domain of domainStored) {
        if (domain.toLowerCase() == slicedString.toLowerCase()) {
          count++;
        }
      }

      return new Promise(resolve => {
        return resolve(count);
      });
    });
    let result;
    await expect(result = await service.verifyUserWhitelist(searchString)).resolves;
    expect(result).toBe(false);
    expect(mockWhitelistRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);

  });

  it("domain that doesnt exist returns false", async () => {
    let domainStored: string[] = ["@total.dk", "@semcomaritime.com", "@easv365.dk"];

    let searchString: string = "AndersAndersen@gmail.dk";
    let slicedString: string;

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "andWhere").mockImplementation( (searchString:string, parameters:any) => {
      slicedString = parameters.whitelist;
      return mockWhitelistRepository.createQueryBuilder();
    })

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "getCount").mockImplementation(() => {

      let count = 0;
      for (let domain of domainStored) {
        if (domain.toLowerCase() == slicedString.toLowerCase()) {
          count++;
        }
      }

      return new Promise(resolve => {
        return resolve(count);
      });
    });
    let result;
    await expect(result = await service.verifyUserWhitelist(searchString)).resolves;
    expect(result).toBe(false);
    expect(mockWhitelistRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

  });

  it("username with At returns true", async () => {
    let domainStored: string[] = ["@total.dk", "@semcomaritime.com", "@easv365.dk"];

    let searchString: string = "AndersAndersen@easv365.dk";
    let slicedString: string;

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "andWhere").mockImplementation( (searchString:string, parameters:any) => {
      slicedString = parameters.whitelist;
      return mockWhitelistRepository.createQueryBuilder();
    })

    jest.spyOn(mockWhitelistRepository.createQueryBuilder(), "getCount").mockImplementation(() => {

      let count = 0;
      for (let domain of domainStored) {
        if (domain.toLowerCase() == slicedString.toLowerCase()) {
          count++;
        }
      }

      return new Promise(resolve => {
        return resolve(count);
      });
    });
    let result;
    await expect(result = await service.verifyUserWhitelist(searchString)).resolves;
    expect(result).toBe(true);
    expect(mockWhitelistRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

  });


    //endregion




  });


