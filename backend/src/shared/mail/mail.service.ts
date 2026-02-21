import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mail transporter configured: ${host}`);
    } else {
      this.logger.warn('SMTP not configured – emails will be logged to console');
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    const from = this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER') || 'noreply@dealflow.app';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to, subject, text, html });
        this.logger.log(`Email sent to ${to}: ${subject}`);
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}: ${err}`);
        throw err;
      }
    } else {
      this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
    }
  }
}
