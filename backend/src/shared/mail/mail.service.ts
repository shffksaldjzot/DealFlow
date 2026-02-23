import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    this.fromAddress = this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER') || 'noreply@dealflow.app';

    // Priority 1: Resend (HTTP API — works on all platforms)
    const resendKey = this.configService.get('RESEND_API_KEY');
    if (resendKey) {
      this.resend = new Resend(resendKey);
      this.logger.log('Mail configured: Resend API');
      return;
    }

    // Priority 2: SMTP (fallback for local dev)
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
      this.logger.log(`Mail configured: SMTP ${host}`);
    } else {
      this.logger.warn('Mail not configured – emails will be logged to console');
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    // Resend API
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: this.fromAddress,
          to,
          subject,
          text,
          html: html || undefined,
        });
        this.logger.log(`[Resend] Email sent to ${to}: ${subject}`);
        return;
      } catch (err) {
        this.logger.error(`[Resend] Failed to send email to ${to}: ${err}`);
        throw err;
      }
    }

    // SMTP fallback
    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from: this.fromAddress, to, subject, text, html });
        this.logger.log(`[SMTP] Email sent to ${to}: ${subject}`);
      } catch (err) {
        this.logger.error(`[SMTP] Failed to send email to ${to}: ${err}`);
        throw err;
      }
      return;
    }

    // Dev: log only
    this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
  }
}
