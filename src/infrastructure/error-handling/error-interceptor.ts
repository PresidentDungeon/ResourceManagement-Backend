import {
  NestInterceptor,
  ExecutionContext,
  Injectable,
  NotFoundException,
  CallHandler,
  BadRequestException, InternalServerErrorException, HttpException
} from "@nestjs/common";
import { Observable } from 'rxjs';
import { catchError, tap } from "rxjs/operators";
import { BadRequestError, EntityNotFoundError, InternalServerError } from "./errors";

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    return next.handle().pipe(
      catchError(error => {

        if (error instanceof EntityNotFoundError){throw new NotFoundException(error.message);}
        else if(error instanceof BadRequestError){throw new BadRequestException(error.message);}
        else if(error instanceof InternalServerError){throw new InternalServerErrorException(error.message);}
        else{throw new BadRequestException(error.message);}

      }),
    );
  }
}
