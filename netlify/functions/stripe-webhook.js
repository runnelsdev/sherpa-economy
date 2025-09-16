// Netlify Function for handling Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  // Handle the event
  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(stripeEvent.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(stripeEvent.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };

  } catch (error) {
    console.error('Error handling webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
};

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  const metadata = paymentIntent.metadata;
  const productType = metadata.product_type;
  const customerEmail = metadata.customer_email;
  const customerName = metadata.customer_name;

  // Send confirmation email based on product type
  switch (productType) {
    case 'book':
      await sendBookPreorderConfirmation(customerEmail, customerName, paymentIntent);
      break;
    
    case 'consultation':
      await sendConsultationConfirmation(customerEmail, customerName, metadata, paymentIntent);
      break;
    
    case 'speaking':
      await sendSpeakingConfirmation(customerEmail, customerName, metadata, paymentIntent);
      break;
    
    case 'assessment':
      await sendAssessmentConfirmation(customerEmail, customerName, metadata, paymentIntent);
      break;
    
    case 'course':
      await sendCourseConfirmation(customerEmail, customerName, metadata, paymentIntent);
      break;
  }

  // Log to your CRM or database here
  await logSuccessfulPayment(paymentIntent);
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  const customerEmail = paymentIntent.metadata.customer_email;
  const customerName = paymentIntent.metadata.customer_name;
  
  // Send failure notification email
  await sendPaymentFailureEmail(customerEmail, customerName, paymentIntent);
  
  // Log failed payment
  await logFailedPayment(paymentIntent);
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);
  
  // Log canceled payment
  await logCanceledPayment(paymentIntent);
}

// Email functions (you'll need to implement with your email service)
async function sendBookPreorderConfirmation(email, name, paymentIntent) {
  // TODO: Implement email sending with your service (e.g., SendGrid, Mailgun, etc.)
  console.log(`Sending book pre-order confirmation to ${email}`);
  
  const emailData = {
    to: email,
    subject: 'Sherpa Economy Book Pre-Order Confirmation',
    template: 'book-preorder-confirmation',
    data: {
      customerName: name,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentId: paymentIntent.id,
      bookTitle: 'Sherpa Economy: Why the Future Belongs to Guides, Not Gurus',
      author: 'David Runnels'
    }
  };
  
  // Example: await sendEmail(emailData);
}

async function sendConsultationConfirmation(email, name, metadata, paymentIntent) {
  console.log(`Sending consultation confirmation to ${email}`);
  
  const emailData = {
    to: email,
    subject: 'Leadership Consultation Booking Confirmed',
    template: 'consultation-confirmation',
    data: {
      customerName: name,
      organization: metadata.organization,
      serviceType: metadata.service_type,
      consultationDetails: metadata.consultation_details,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentId: paymentIntent.id
    }
  };
  
  // Example: await sendEmail(emailData);
}

async function sendSpeakingConfirmation(email, name, metadata, paymentIntent) {
  console.log(`Sending speaking engagement confirmation to ${email}`);
  
  const emailData = {
    to: email,
    subject: 'Speaking Engagement Booking Confirmed',
    template: 'speaking-confirmation',
    data: {
      customerName: name,
      eventName: metadata.event_name,
      eventDate: metadata.event_date,
      audienceSize: metadata.audience_size,
      formatType: metadata.format_type,
      eventDetails: metadata.event_details,
      depositAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentId: paymentIntent.id
    }
  };
  
  // Example: await sendEmail(emailData);
}

async function sendAssessmentConfirmation(email, name, metadata, paymentIntent) {
  console.log(`Sending assessment report confirmation to ${email}`);
  
  const emailData = {
    to: email,
    subject: 'Sherpa Leadership Assessment Report Purchase Confirmed',
    template: 'assessment-confirmation',
    data: {
      customerName: name,
      assessmentType: metadata.assessment_type,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentId: paymentIntent.id
    }
  };
  
  // Example: await sendEmail(emailData);
}

async function sendCourseConfirmation(email, name, metadata, paymentIntent) {
  console.log(`Sending course enrollment confirmation to ${email}`);
  
  const emailData = {
    to: email,
    subject: 'Welcome to Sherpa Economy Foundations!',
    template: 'course-confirmation',
    data: {
      customerName: name,
      courseTier: metadata.course_tier,
      courseInterests: metadata.course_interests,
      courseExperience: metadata.course_experience,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentId: paymentIntent.id,
      courseStartDate: 'TBD', // You can set this based on your cohort schedule
      accessLink: 'https://your-course-platform.com/access' // Replace with actual course platform
    }
  };
  
  // Example: await sendEmail(emailData);
}

async function sendPaymentFailureEmail(email, name, paymentIntent) {
  console.log(`Sending payment failure notification to ${email}`);
  
  // TODO: Implement payment failure email
}

// Logging functions (implement with your preferred logging/CRM service)
async function logSuccessfulPayment(paymentIntent) {
  console.log('Logging successful payment:', {
    paymentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.metadata.customer_email,
    product: paymentIntent.metadata.product_type,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Log to your CRM, database, or analytics service
}

async function logFailedPayment(paymentIntent) {
  console.log('Logging failed payment:', {
    paymentId: paymentIntent.id,
    customer: paymentIntent.metadata.customer_email,
    product: paymentIntent.metadata.product_type,
    timestamp: new Date().toISOString()
  });
}

async function logCanceledPayment(paymentIntent) {
  console.log('Logging canceled payment:', {
    paymentId: paymentIntent.id,
    customer: paymentIntent.metadata.customer_email,
    product: paymentIntent.metadata.product_type,
    timestamp: new Date().toISOString()
  });
}
