import { Module } from '@nestjs/common';
import { MailHelper } from "./mail.helper";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from 'path';
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { IMailHelperProvider } from "../../core/primary-ports/domain-services/mail.helper.interface";

@Module({

  imports: [MailerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      transport: {
        host: 'smtp.gmail.com',
        port: 465 ,
        secure: true,
        auth:{
          user: configService.get('EMAIL_USER'),
          pass: configService.get('EMAIL_PASS')
        },
        tls: {
          rejectUnauthorized: false
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  })],
  providers: [{provide: IMailHelperProvider, useClass: MailHelper}],
  exports: [IMailHelperProvider]
})

export class MailModule {}
