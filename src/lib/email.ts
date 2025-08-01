import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export interface EmailTemplate {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}

export interface ContactEmailData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    projectType: string;
    budget: string;
    timeline: string;
    preferredStartDate: string;
    preferredStartTime?: string;
    projectDeadline?: string;
    message: string;
    newsletter: boolean;
}

export class EmailService {
    private static instance: EmailService;

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    async sendEmail(template: EmailTemplate): Promise<boolean> {
        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            sendSmtpEmail.to = [{ email: template.to }];
            sendSmtpEmail.subject = template.subject;
            sendSmtpEmail.htmlContent = template.htmlContent;
            sendSmtpEmail.textContent = template.textContent;
            sendSmtpEmail.sender = {
                name: process.env.BREVO_SENDER_NAME || 'Website Contact',
                email: process.env.BREVO_SENDER_EMAIL || 'noreply@example.com'
            };

            await apiInstance.sendTransacEmail(sendSmtpEmail);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    async sendContactNotification(data: ContactEmailData): Promise<boolean> {
        const template: EmailTemplate = {
            to: process.env.CONTACT_EMAIL || 'contact@example.com',
            subject: `Nieuwe contactaanvraag van ${data.firstName} ${data.lastName}`,
            htmlContent: this.generateContactNotificationHTML(data),
            textContent: this.generateContactNotificationText(data)
        };

        return await this.sendEmail(template);
    }

    async sendContactConfirmation(data: ContactEmailData): Promise<boolean> {
        const template: EmailTemplate = {
            to: data.email,
            subject: 'Bedankt voor je contactaanvraag',
            htmlContent: this.generateContactConfirmationHTML(data),
            textContent: this.generateContactConfirmationText(data)
        };

        return await this.sendEmail(template);
    }

    private generateContactNotificationHTML(data: ContactEmailData): string {
        return `
      <h2>Nieuwe contactaanvraag</h2>
      <p><strong>Naam:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p><strong>Telefoon:</strong> ${data.phone}</p>` : ''}
      <p><strong>Project type:</strong> ${data.projectType}</p>
      <p><strong>Budget:</strong> ${data.budget}</p>
      <p><strong>Timeline:</strong> ${data.timeline}</p>
      <p><strong>Gewenste startdatum:</strong> ${data.preferredStartDate}</p>
      ${data.preferredStartTime ? `<p><strong>Gewenste starttijd:</strong> ${data.preferredStartTime}</p>` : ''}
      ${data.projectDeadline ? `<p><strong>Project deadline:</strong> ${data.projectDeadline}</p>` : ''}
      <p><strong>Newsletter:</strong> ${data.newsletter ? 'Ja' : 'Nee'}</p>
      <h3>Bericht:</h3>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `;
    }

    private generateContactNotificationText(data: ContactEmailData): string {
        return `
Nieuwe contactaanvraag

Naam: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Telefoon: ${data.phone}\n` : ''}Project type: ${data.projectType}
Budget: ${data.budget}
Timeline: ${data.timeline}
Gewenste startdatum: ${data.preferredStartDate}
${data.preferredStartTime ? `Gewenste starttijd: ${data.preferredStartTime}\n` : ''}${data.projectDeadline ? `Project deadline: ${data.projectDeadline}\n` : ''}Newsletter: ${data.newsletter ? 'Ja' : 'Nee'}

Bericht:
${data.message}
    `.trim();
    }

    private generateContactConfirmationHTML(data: ContactEmailData): string {
        return `
      <h2>Bedankt voor je contactaanvraag, ${data.firstName}!</h2>
      <p>We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op.</p>
      
      <h3>Jouw gegevens:</h3>
      <p><strong>Project type:</strong> ${data.projectType}</p>
      <p><strong>Budget:</strong> ${data.budget}</p>
      <p><strong>Timeline:</strong> ${data.timeline}</p>
      <p><strong>Gewenste startdatum:</strong> ${data.preferredStartDate}</p>
      
      <p>Met vriendelijke groet,<br>Het Team</p>
    `;
    }

    private generateContactConfirmationText(data: ContactEmailData): string {
        return `
Bedankt voor je contactaanvraag, ${data.firstName}!

We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op.

Jouw gegevens:
Project type: ${data.projectType}
Budget: ${data.budget}
Timeline: ${data.timeline}
Gewenste startdatum: ${data.preferredStartDate}

Met vriendelijke groet,
Het Team
    `.trim();
    }
}

export const emailService = EmailService.getInstance();