import { NestInterceptor, ExecutionContext, Injectable, NotFoundException, CallHandler, BadRequestException, InternalServerErrorException, HttpException } from "@nestjs/common";
import { Observable } from 'rxjs';
import { catchError, tap } from "rxjs/operators";
import { BadRequestError, EntityNotFoundError, InactiveError, InternalServerError } from "../../infrastructure/error-handling/errors";

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    return next.handle().pipe(
      catchError(error => {

        if (error instanceof EntityNotFoundError){throw new NotFoundException(error.message);}
        else if(error instanceof BadRequestError){throw new BadRequestException(error.message);}
        else if(error instanceof InternalServerError){throw new InternalServerErrorException(error.message);}
        else if(error instanceof InactiveError){throw new HttpException(error.message, 423);}
        else{throw new BadRequestException(error.message);}
      }),
    );
  }
}

