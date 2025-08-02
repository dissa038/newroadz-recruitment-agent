import { NextRequest, NextResponse } from 'next/server';
import { contactSchema, type ContactFormData } from '@/lib/validations';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valideer de form data
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validatie gefaald',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const formData: ContactFormData = validationResult.data;

    // Converteer form data naar email data
    const emailData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      projectType: formData.projectType,
      budget: formData.budget,
      timeline: formData.timeline,
      preferredStartDate: formData.preferredStartDate,
      preferredStartTime: formData.preferredStartTime || undefined,
      projectDeadline: formData.projectDeadline,
      message: formData.message,
      newsletter: formData.newsletter
    };

    // Verstuur notificatie email naar jezelf
    const notificationSent = await emailService.sendContactNotification(emailData);

    if (!notificationSent) {
      console.error('Failed to send notification email');
      return NextResponse.json(
        { error: 'Er ging iets mis bij het versturen van de notificatie' },
        { status: 500 }
      );
    }

    // Verstuur bevestiging naar de klant
    const confirmationSent = await emailService.sendContactConfirmation(emailData);

    if (!confirmationSent) {
      console.error('Failed to send confirmation email');
      // We gaan door, want de notificatie is wel verstuurd
    }

    return NextResponse.json({
      success: true,
      message: 'Contactaanvraag succesvol verstuurd',
      notificationSent,
      confirmationSent
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het verwerken van je aanvraag' },
      { status: 500 }
    );
  }
}

// Test endpoint om email functionaliteit te testen
export async function GET() {
  try {
    const testEmailData = {
      firstName: 'Test',
      lastName: 'Gebruiker',
      email: 'test@example.com',
      projectType: 'Website',
      budget: '€5.000 - €10.000',
      timeline: '2-4 weken',
      preferredStartDate: new Date().toLocaleDateString('nl-NL'),
      message: 'Dit is een test bericht om de email functionaliteit te controleren.',
      newsletter: false
    };

    const result = await emailService.sendContactNotification(testEmailData);

    return NextResponse.json({
      success: result,
      message: result ? 'Test email verstuurd!' : 'Test email gefaald',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Test email gefaald', details: error },
      { status: 500 }
    );
  }
}