import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from "../../core/models/user";
import { IMailService } from "../../core/primary-ports/mail.service.interface";

@Injectable()
export class MailService implements IMailService{

  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User, verificationCode: string){

    const verificationLink = `frontpage.com/login/confirm?userID=${user.ID}&verification=${verificationCode}`;

    await this.mailerService.sendMail({
      to: user.username,
      subject: 'Semco Maritime Resource Management Email Confirmation',
      template: './confirmation',
      context: {
        url: verificationLink,
        code: user.verificationCode
      }
    })

  }

}
