import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from "@nestjs/config";
import { IMailHelper } from "../../core/primary-ports/domain-services/mail.helper.interface";

@Injectable()
export class MailHelper implements IMailHelper{

  constructor(private mailerService: MailerService, private configService: ConfigService) {}

  async sendUserConfirmation(email: string, verificationCode: string){

    const frontendRoute: string = this.configService.get('FRONTEND_ROUTE');
    const verificationLink = `${frontendRoute}/verifyLink?type=confirmation&email=${email}&verificationCode=${verificationCode}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Semco Maritime Resource Management Email Confirmation',
      template: './confirmation',
      context: {
        url: verificationLink,
        code: verificationCode
      }
    });
  }

  async sendUserRegistrationInvite(email: string, confirmationCode: string){

    const frontendRoute: string = this.configService.get('FRONTEND_ROUTE');
    const verificationLink = `${frontendRoute}/verifyLink?type=setup&email=${email}&verificationCode=${confirmationCode}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Semco Maritime Resource Management Invitation Link',
      template: './invitation',
      context: {
        url: verificationLink
      }
    });
  }


  async sendUserPasswordReset(email: string, passwordResetToken: string){

    const frontendRoute: string = this.configService.get('FRONTEND_ROUTE');
    const resetLink = `${frontendRoute}/verifyLink?type=password&email=${email}&verificationCode=${passwordResetToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Semco Maritime Resource Management Password Reset',
      template: './passwordReset',
      context: {
        url: resetLink
      }
    });
  }

  async sendUserPasswordResetConfirmation(email: string){

    await this.mailerService.sendMail({
      to: email,
      subject: 'Semco Maritime Resource Management Password Reset Confirmation',
      template: './passwordResetConfirmation',
      context: {}
    });
  }

}
