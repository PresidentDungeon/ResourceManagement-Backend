import { IContractService } from "../primary-ports/contract.service.interface";
import { InjectConnection, InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { Contract } from "../models/contract";
import { IContractStatusService, IContractStatusServiceProvider } from "../primary-ports/contract-status.service.interface";
import { Status } from "../models/status";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { ResumeRequestEntity } from "../../infrastructure/data-source/postgres/entities/resume-request.entity";
import { CommentEntity } from "../../infrastructure/data-source/postgres/entities/comment.entity";
import { CommentDTO } from "src/api/dtos/comment.dto";
import { Comment } from "../models/comment";
import { BadRequestError, EntityNotFoundError, InternalServerError } from "../../infrastructure/error-handling/errors";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class ContractService implements IContractService{

  constructor(
    @InjectRepository(ContractEntity) private contractRepository: Repository<ContractEntity>,
    @InjectRepository(ResumeRequestEntity) private resumeRequestRepository: Repository<ResumeRequestEntity>,
    @InjectRepository(CommentEntity) private commentRepository: Repository<CommentEntity>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(IContractStatusServiceProvider) private statusService: IContractStatusService,
  ) {}

  async addContract(contract: Contract): Promise<Contract> {

    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);

    this.verifyContractEntity(contract);
    const newContract = await this.contractRepository.create(contract);

    try{
      const savedContract = await this.contractRepository.save(newContract);
      return savedContract;
    }
    catch (e) {throw new InternalServerError('Error saving contract to database')}
  }

  async addRequestContract(contract: Contract): Promise<Contract> {

    if(status.toLowerCase() != 'whitelisted'){
      throw new Error('The user must be whitelisted by an admin to request');
    }

    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);

    let requestStatus: Status = await this.statusService.findStatusByName('Request');
    contract.status = requestStatus;

    this.verifyContractEntity(contract);

    try{

      const savedContract = await this.connection.transaction<Contract>(async transactionalEntityManager => {

        const resumeRequests = this.resumeRequestRepository.create(contract.resumeRequests);
        await transactionalEntityManager.save(resumeRequests);

        contract.resumeRequests = resumeRequests;

        const newContract = await this.contractRepository.create(contract);

        const savedContract = await transactionalEntityManager.save(newContract);
        return savedContract;
      });
      return savedContract;
    }
    catch (e) {
      throw new InternalServerError('Error saving contract request');
    }
  }

  async saveComment(commentDTO: CommentDTO): Promise<void> {
    const commentEntity = this.commentRepository.create(commentDTO);
    commentEntity.user = JSON.parse(JSON.stringify({ID: commentDTO.userID}));
    commentEntity.contract = JSON.parse(JSON.stringify({ID: commentDTO.contractID}));
    try{await this.commentRepository.save(commentEntity);}
    catch (e) {throw new InternalServerError('Error saving comment to database');}
  }

  async getContractComments(ID: number): Promise<Comment[]>{
    if(ID == null || ID <= 0){
      throw new BadRequestError('Contract ID must be instantiated or valid');
    }

    let qb = this.commentRepository.createQueryBuilder('comment');
    qb.leftJoin('comment.contract', 'contract');
    qb.leftJoinAndSelect('comment.user', 'user');
    qb.andWhere('contract.ID = :contractID', {contractID: ID});
    let commentEntity: CommentEntity[] = await qb.getMany();

    let convertedComments: Comment[] = commentEntity.map((comment) => {return {comment: comment.comment, username: comment.user.username}});
    return convertedComments;
  }

  async getContractByID(ID: number, redact?: boolean, personalID?: number): Promise<Contract>{

    if(ID == null || ID <= 0){
      throw new BadRequestError('Contract ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    if(redact != null && !redact){qb.leftJoinAndSelect('contract.users', 'users');}

    if(personalID != null){

      if(personalID <= 0) {throw new BadRequestError('Invalid user ID entered');}

      qb.leftJoin(qb => qb.select("commentPersonal.comment as personal_comment, commentPersonal.contractID, commentPersonal.userID")
        .from(CommentEntity, 'commentPersonal').where('commentPersonal.userID = :personalID', {personalID: `${personalID}`}), 'commentPersonal', '"commentPersonal"."contractID" = contract.ID')
        .addGroupBy('"commentPersonal"."contractID", "commentPersonal"."userID", "commentPersonal"."personal_comment"');

      qb.addSelect(`COALESCE("personal_comment", '')`, 'personal_comment');
      qb.addGroupBy('"contract"."ID", "status"."ID", "resumes"."ID", "resumeRequests"."ID"');
    }

    qb.leftJoinAndSelect('contract.status', 'status');
    qb.leftJoinAndSelect('contract.resumes', 'resumes');
    qb.leftJoinAndSelect('contract.resumeRequests', 'resumeRequests');
    qb.andWhere(`contract.ID = :contractID`, { contractID: `${ID}`});

    const foundContract: Contract = await qb.getOne();
    if(foundContract == null) {throw new EntityNotFoundError('No contracts registered with such ID');}

    if (personalID != null){
      const contractRaw: any = await qb.getRawOne();
      foundContract.personalComment = {comment: contractRaw.personal_comment};
    }

    await this.verifyContractStatuses([foundContract]);

    return foundContract;
  }

  async getContractsByUserID(userID: number, statusID: number): Promise<Contract[]> {

    if(userID == null || userID <= 0){
      throw new BadRequestError('User ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoin('contract.users', 'users');
    qb.andWhere(`users.ID = :userID`, { userID: `${userID}`});
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.andWhere(`status.status NOT IN (:...status)`, { status: ['Rejected', 'Draft']});

    if(statusID > 0)
    {
      qb.andWhere(`status.ID = :statusID`, { statusID: `${statusID}` });
    }

    const foundContract: ContractEntity[] = await qb.getMany();
    await this.verifyContractStatuses(foundContract);
    return foundContract;
  }

  async getContractsByResume(ID: number): Promise<Contract[]> {

    if(ID == null || ID <= 0){
      throw new BadRequestError('Resume ID must be instantiated or valid');
    }

    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let acceptedStatus: Status = await this.statusService.findStatusByName('Accepted');
    let statusIDs: number[] = [pendingStatus.ID, acceptedStatus.ID];

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoin('contract.resumes', 'resumes');
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.andWhere(`resumes.ID = :resumeID`, { resumeID: `${ID}`});
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.orderBy('contract.startDate');

    const foundContract: ContractEntity[] = await qb.getMany();
    return foundContract;
  }

  async getContracts(filter: Filter): Promise<FilterList<Contract>> {

    if(filter == null || filter == undefined){
      throw new BadRequestError('Invalid filter entered');
    }

    if(filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0){
      throw new BadRequestError('Invalid items pr. page entered');
    }

    if(filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0){
      throw new BadRequestError('Invalid current page entered');
    }

    let enableMatchComplete: boolean = (filter.enableMatchComplete == null) ? false : JSON.parse(filter.enableMatchComplete as unknown as string);
    let enableCommentCount: boolean = (filter.enableCommentCount == null) ? false : JSON.parse(filter.enableCommentCount as unknown as string);

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.leftJoin('contract.users', 'users');

    if(filter.name != null && filter.name !== '')
    {
      qb.andWhere(`contract.title ILIKE :title`, { title: `%${filter.name}%` });
    }

    if(filter.contractUser != null && filter.contractUser !== '')
    {
      if(!enableMatchComplete){qb.andWhere(`users.username ILIKE :contractUser`, { contractUser: `%${filter.contractUser}%` });}
      else{qb.andWhere(`users.username ILIKE :contractUser`, {contractUser: `${filter.contractUser}` });}
    }

    if(filter.statusID != null && filter.statusID > 0)
    {
      qb.andWhere(`status.ID = :statusID`, { statusID: `${filter.statusID}` });
    }


    if(enableCommentCount){
      qb.leftJoin('contract.comments', 'comments');
      qb.addSelect('COALESCE(COUNT(comments), 0)', 'comment_count');
      qb.addGroupBy('"contract"."ID", "status"."ID"');
    }

    if(filter.sorting != null && filter.sorting === 'ASC' || filter.sorting != null && filter.sorting === 'DESC')
    {
      if(filter.sortingType != null && filter.sortingType === 'ALF')
      {
        qb.orderBy('contract.title', filter.sorting);
      }
      if(filter.sortingType != null && filter.sortingType === 'ADDED')
      {
        qb.orderBy('contract.ID', filter.sorting);
      }
    }

    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result: Contract[] = await qb.getMany();
    const count = await qb.getCount();

    if(filter.enableCommentCount){
      const resultRaw = await qb.getRawMany();
      result.map((contract, index) => {contract.commentCount = Number.parseInt(resultRaw[index].comment_count)});
    }

    await this.verifyContractStatuses(result);

    const filterList: FilterList<Contract> = {list: result, totalItems: count};
    return filterList;
  }

  async confirmContract(contract: Contract, isAccepted: boolean): Promise<Contract>{

    const storedContract: Contract = await this.getContractByID(contract.ID);

    if(storedContract.status.status.toLowerCase() != 'pending review'){
      throw new BadRequestError('Contract is not pending review and cannot be accepted or declined.');
    }

    contract.dueDate = new Date(contract.dueDate);
    let currentDate: Date = new Date();

    if(contract.dueDate.getTime() < currentDate.getTime()){
      throw new BadRequestError('The validation window for this contract is expired and cannot be accepted or declined');
    }

    let status: Status = await ((isAccepted) ? this.statusService.findStatusByName("Accepted") : this.statusService.findStatusByName("Rejected"));
    contract.status = status;
    contract.dueDate = null;
    const updatedContract = await this.update(contract);
    return updatedContract;
  }

  async requestRenewal(contract: Contract): Promise<Contract>{

    const storedContract: Contract = await this.getContractByID(contract.ID);

    if(storedContract.status.status.toLowerCase() != 'expired'){
      throw new BadRequestError('Contract is not expired and cannot be requested for renewal');
    }

    let pendingStatus: Status = await this.statusService.findStatusByName("Draft");
    contract.status = pendingStatus;
    const updatedContract = await this.update(contract);
    return updatedContract;
  }

  async update(contract: Contract): Promise<Contract> {
    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);
    await this.getContractByID(contract.ID);
    this.verifyContractEntity(contract);

    try{
      const savedContract = await this.connection.transaction<Contract>(async transactionalEntityManager => {

        await transactionalEntityManager.createQueryBuilder().from(ResumeRequestEntity, 'resumeRequest').delete()
          .where('contractID = :contractID', {contractID: `${contract.ID}`}).execute();

        const resumeRequests = this.resumeRequestRepository.create(contract.resumeRequests);
        await transactionalEntityManager.save(resumeRequests);

        contract.resumeRequests = resumeRequests;

        const newContract = await this.contractRepository.create(contract);

        const savedContract = await transactionalEntityManager.save(newContract);
        return savedContract;
      });
      return savedContract;
    }
    catch (e) {
      throw new InternalServerError('Error during update of contract');
    }

  }

  async delete(ID: number): Promise<void> {
    if(ID == null || ID <= 0){throw new BadRequestError('Contract ID must be instantiated or valid');}
    try{await this.contractRepository.createQueryBuilder().delete().from(ContractEntity).andWhere(`ID = :ID`, { ID: `${ID}`}).execute();}
    catch (e) {throw new InternalServerError('Error during delete of contract')}
  }

  verifyContractEntity(contract: Contract) {
    if(contract == null) {throw new BadRequestError('Contract must be instantiated');}
    if(contract.ID == null || contract.ID < 0){throw new BadRequestError('Contract must have a valid ID')}
    if(contract.title == null || contract.title.trim().length == 0){throw new BadRequestError('Contract must have a valid title');}
    if(contract.description == null || contract.description.length > 500){throw new BadRequestError('Contract must have a valid description under 500 characters');}
    if(contract.status == null || contract.status.ID <= 0){throw new BadRequestError('Contract must have a valid status');}
    if(contract.startDate == null ){throw new BadRequestError('Contract must contain a valid start date');}
    if(contract.endDate == null ){throw new BadRequestError('Contract must contain a valid end date');}
    if(contract.endDate.getTime() - contract.startDate.getTime() < 0 ){throw new BadRequestError('Start date cannot be after end date');}
  }

  async verifyContractStatuses(contracts: Contract[]): Promise<Contract[]>{

    const expiredStatus: Status = await this.statusService.findStatusByName('Expired');
    const completedStatus: Status = await this.statusService.findStatusByName('Completed');

    contracts.map((contract) => {

      if(contract.status.status.toLowerCase() == 'pending review' && contract.dueDate && contract.dueDate.getTime() < new Date().getTime()){
        contract.status = expiredStatus
        this.contractRepository.createQueryBuilder().update(ContractEntity).set({status: expiredStatus, dueDate: null}).where("ID = :contractID", {contractID: contract.ID}).execute();}


      if(contract.status.status.toLowerCase() == 'accepted' && contract.endDate.getTime() < new Date().getTime()){
        contract.status = completedStatus;
        this.contractRepository.createQueryBuilder().update(ContractEntity).set({status: completedStatus}).where("ID = :contractID", {contractID: contract.ID}).execute();
      }
    });

    return contracts;
  }

  async getAllStatuses(): Promise<Status[]>{
    return await this.statusService.getStatuses();
  }

  async getAllUserStatuses(): Promise<Status[]>{
    return await this.statusService.getUserStatus();
  }

}
