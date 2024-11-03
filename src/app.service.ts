import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private mailerService: MailerService) {}

  async sendMail(data: any): Promise<any> {
    const { date, name, email, message , host } = data;
      const hostDetail =host?host: 'Lewis Luu'
    try {
      const result = await this.mailerService.sendMail({
        to: 'loc.luu.1990@gmail.com',
        from: 'emailluu90@gmail.com',
        subject: `LOC JOB ON MY WEB + ${hostDetail}`,
        text: `Date: ${date}\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p>Date: ${date}</p><p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`,
      });
      const reply = await this.mailerService.sendMail({
          to: email,
          from: 'emailluu90@gmail.com',
          subject: `${hostDetail.toUpperCase()} -- WEB DEVELOPER`,
          text: `Hello ${name}, \nThank you for sending me a message! I will get back to you as soon as possible.\nBest! \n ${hostDetail}`,
          html: `<p>Hello ${name}, </p><p>Thank you for sending me a message! I will get back to you as soon as possible.</p><p>Best! </p><p>${hostDetail}<p>`,
      });
      return { message: 'Email sent successfully' };
    } catch (error) {
      console.error(error); // Log the error if needed

      return { message: 'Failed to send email' };
    }
  }

  
  getHello() {
    return {mess:'Hello World Email!'};
  }

  async createEmail(name: string, email: string, message:string): Promise<any> {
    try {
      const result = await this.mailerService.sendMail({
        to: 'loc.luu.1990@gmail.com',
        from: 'email',
        subject: 'LOC JOB ON MY WEB',
        text: `\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`,
      });
      if(result)
      return { message: 'Email sent successfully' };
    } catch (error) {
      console.error(error); // Log the error if needed

      return { message: 'Failed to send email' };
    }
  }
}
