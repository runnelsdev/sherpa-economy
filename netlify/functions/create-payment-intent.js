// Netlify Function for creating Stripe Payment Intents
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { product, customer, amount, currency, serviceType, eventDetails, assessmentData, courseData } = JSON.parse(event.body);

    // Validate required fields
    if (!product || !customer || !amount || !currency) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Product configurations
    const productConfigs = {
      book: {
        name: 'Sherpa Economy Book Pre-Order',
        description: 'Pre-order the Sherpa Economy book by David Runnels',
      },
      consultation: {
        name: 'Leadership Consultation',
        description: `${serviceType ? serviceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' - ' : ''}Leadership consultation with David Runnels`,
      },
      speaking: {
        name: 'Speaking Engagement Deposit',
        description: `Speaking engagement booking deposit${eventDetails?.eventName ? ' for ' + eventDetails.eventName : ''}`,
      },
      assessment: {
        name: 'Sherpa Leadership Assessment Report',
        description: 'Detailed leadership assessment report with personalized recommendations',
      },
      course: {
        name: 'Sherpa Economy Foundations Course',
        description: 'Complete 8-week foundations course with lifetime access and community',
      },
      'faith-book': {
        name: 'Sherpa Economy - Faith Edition',
        description: 'The Sherpa as an Archetype for Christ - Theological exploration of servant leadership',
      },
    };

    const productConfig = productConfigs[product];
    if (!productConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid product type' }),
      };
    }

    // Create customer metadata
    const metadata = {
      product_type: product,
      customer_name: customer.name,
      customer_email: customer.email,
    };

    // Add product-specific metadata
    if (product === 'consultation') {
      metadata.organization = customer.organization || '';
      metadata.service_type = serviceType || '';
      metadata.consultation_details = customer.details || '';
    }

    if (product === 'speaking') {
      metadata.event_name = eventDetails?.eventName || '';
      metadata.event_date = eventDetails?.eventDate || '';
      metadata.audience_size = eventDetails?.audienceSize || '';
      metadata.format_type = eventDetails?.formatType || '';
      metadata.event_details = eventDetails?.details || '';
    }

    if (product === 'assessment') {
      metadata.assessment_type = assessmentData?.sherpaType || '';
      metadata.assessment_scores = JSON.stringify(assessmentData?.scores || {});
    }

    if (product === 'course') {
      metadata.course_tier = courseData?.tier || 'pilot';
      metadata.course_interests = courseData?.interests || '';
      metadata.course_experience = courseData?.experience || '';
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: currency.toLowerCase(),
      description: productConfig.description,
      metadata: metadata,
      receipt_email: customer.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Log successful payment intent creation
    console.log(`Payment intent created: ${paymentIntent.id} for ${customer.email} - ${product}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
    };

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      }),
    };
  }
};
