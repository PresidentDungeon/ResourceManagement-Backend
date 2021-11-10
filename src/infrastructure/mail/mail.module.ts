import { Module } from '@nestjs/common';
import { IMailServiceProvider } from "../../core/primary-ports/mail.service.interface";
import { MailService } from "./mail.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from 'path';
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";

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
  providers: [{provide: IMailServiceProvider, useClass: MailService}],
  exports: [IMailServiceProvider]
})

export class MailModule {}
