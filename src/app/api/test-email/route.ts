import { NextRequest, NextResponse } from 'next/server';
import { emailService, type EmailTemplate } from '@/lib/email';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { to, templateName = 'test-email' } = await request.json();
    
    if (!to) {
      return NextResponse.json(
        { error: 'Email adres is verplicht' },
        { status: 400 }
      );
    }

    // Laad de test email template
    const templatePath = join(process.cwd(), 'src/lib/email-templates', `${templateName}.html`);
    let htmlContent: string;
    
    try {
      htmlContent = await readFile(templatePath, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: `Template '${templateName}' niet gevonden` },
        { status: 404 }
      );
    }

    // Vervang template variabelen
    const templateData = {
      timestamp: new Date().toLocaleString('nl-NL'),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      sendDate: new Date().toLocaleDateString('nl-NL')
    };

    // Simpele template replacement
    let processedHtml = htmlContent;
    Object.entries(templateData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedHtml = processedHtml.replace(regex, value);
    });

    const emailTemplate: EmailTemplate = {
      to,
      subject: `🧪 Test Email - ${templateData.timestamp}`,
      htmlContent: processedHtml,
      textContent: `Test Email\n\nTimestamp: ${templateData.timestamp}\nEnvironment: ${templateData.environment}\nVersion: ${templateData.version}`
    };

    const success = await emailService.sendEmail(emailTemplate);

    return NextResponse.json({
      success,
      message: success ? 'Test email succesvol verstuurd!' : 'Test email versturen gefaald',
      template: templateName,
      to,
      timestamp: templateData.timestamp
    });

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het versturen van de test email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Email API',
    usage: 'POST met { "to": "email@example.com", "templateName": "test-email" }',
    availableTemplates: ['test-email', 'contact-notification', 'contact-confirmation']
  });
}