import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { renderPasswordResetEmail, renderVerifyEmail } from './mail.templates';

interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  private readonly from = process.env.MAIL_FROM ?? 'eArbore <no-reply@earbore.ro>';

  sendPasswordReset(to: string, name: string, link: string, lang?: string) {
    return this.send(to, renderPasswordResetEmail(lang, name, link), link, 'resetare parolă');
  }

  sendVerifyEmail(to: string, name: string, link: string, lang?: string) {
    return this.send(to, renderVerifyEmail(lang, name, link), link, 'confirmare email');
  }

  private async send(to: string, mail: RenderedMail, link: string, label: string) {
    if (!this.resend) {
      // fără cheie (ex. dezvoltare locală) nu trimitem; afișăm linkul în consolă
      // DOAR în afara producției, ca să nu ajungă tokenuri în loguri
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(`RESEND_API_KEY lipsește — emailul de ${label} NU a fost trimis.`);
      } else {
        this.logger.warn(`[DEV] Email (${label}) către ${to}. Link: ${link}`);
      }
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error) {
      throw new Error(`Resend a refuzat emailul: ${error.name} — ${error.message}`);
    }
  }
}