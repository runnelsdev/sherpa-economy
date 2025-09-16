// Stripe Configuration
// ✅ SECURITY: Only publishable key here - safe to expose in client-side code
// 🔐 SECRET KEY is stored securely in Netlify environment variables (server-side only)
// Live Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_AwTlcHPBYYURE75CNMwpq6XE';

// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// Product configurations
const PRODUCTS = {
    book: {
        name: 'Sherpa Economy Book Pre-Order',
        price: 2499, // $24.99 in cents
        currency: 'usd',
        description: 'Pre-order the Sherpa Economy book by David Runnels'
    },
    consultation: {
        name: 'Leadership Consultation',
        price: 25000, // $250.00 in cents
        currency: 'usd',
        description: 'Initial consultation for organizational transformation'
    },
    speaking: {
        name: 'Speaking Engagement Deposit',
        price: 100000, // $1000.00 deposit in cents
        currency: 'usd',
        description: 'Speaking engagement booking deposit'
    },
    assessment: {
        name: 'Sherpa Leadership Assessment Report',
        price: 4999, // $49.99 in cents
        currency: 'usd',
        description: 'Detailed leadership assessment report with personalized recommendations'
    },
    course: {
        name: 'Sherpa Economy Foundations Course',
        price: 19900, // $199.00 in cents (pilot pricing)
        currency: 'usd',
        description: 'Complete 8-week foundations course with lifetime access'
    },
    'faith-book': {
        name: 'Sherpa Economy - Faith Edition',
        price: 2999, // $29.99 in cents
        currency: 'usd',
        description: 'The Sherpa as an Archetype for Christ - Theological exploration of servant leadership'
    }
};

// Stripe payment processing functions
class StripePayments {
    constructor() {
        this.stripe = stripe;
    }

    // Create payment intent for book pre-order
    async createBookPayment(customerInfo) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'book',
                    customer: customerInfo,
                    amount: PRODUCTS.book.price,
                    currency: PRODUCTS.book.currency
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Payment creation failed: ${errorData.error || response.statusText}`);
            }

            const { clientSecret } = await response.json();
            console.log('Payment intent created successfully');
            return clientSecret;
        } catch (error) {
            console.error('Error creating book payment:', error);
            throw error;
        }
    }

    // Create payment intent for consulting services
    async createConsultationPayment(customerInfo, serviceType) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'consultation',
                    serviceType: serviceType,
                    customer: customerInfo,
                    amount: PRODUCTS.consultation.price,
                    currency: PRODUCTS.consultation.currency
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Payment creation failed: ${errorData.error || response.statusText}`);
            }

            const { clientSecret } = await response.json();
            console.log('Consultation payment intent created successfully');
            return clientSecret;
        } catch (error) {
            console.error('Error creating consultation payment:', error);
            throw error;
        }
    }

    // Create payment intent for speaking engagements
    async createSpeakingPayment(customerInfo, eventDetails) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'speaking',
                    eventDetails: eventDetails,
                    customer: customerInfo,
                    amount: PRODUCTS.speaking.price,
                    currency: PRODUCTS.speaking.currency
                })
            });

            const { clientSecret } = await response.json();
            return clientSecret;
        } catch (error) {
            console.error('Error creating speaking payment:', error);
            throw error;
        }
    }

    // Create payment intent for assessment report
    async createAssessmentPayment(customerInfo, assessmentData) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'assessment',
                    assessmentData: assessmentData,
                    customer: customerInfo,
                    amount: PRODUCTS.assessment.price,
                    currency: PRODUCTS.assessment.currency
                })
            });

            const { clientSecret } = await response.json();
            return clientSecret;
        } catch (error) {
            console.error('Error creating assessment payment:', error);
            throw error;
        }
    }

    // Create payment intent for course enrollment
    async createCoursePayment(customerInfo, courseData) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'course',
                    courseData: courseData,
                    customer: customerInfo,
                    amount: PRODUCTS.course.price,
                    currency: PRODUCTS.course.currency
                })
            });

            const { clientSecret } = await response.json();
            return clientSecret;
        } catch (error) {
            console.error('Error creating course payment:', error);
            throw error;
        }
    }

    // Create payment intent for faith-based book
    async createFaithBookPayment(customerInfo) {
        try {
            const response = await fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product: 'faith-book',
                    customer: customerInfo,
                    amount: PRODUCTS['faith-book'].price,
                    currency: PRODUCTS['faith-book'].currency
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Payment creation failed: ${errorData.error || response.statusText}`);
            }

            const { clientSecret } = await response.json();
            console.log('Faith book payment intent created successfully');
            return clientSecret;
        } catch (error) {
            console.error('Error creating faith book payment:', error);
            throw error;
        }
    }

    // Process payment with Stripe Elements
    async processPayment(clientSecret, paymentElement) {
        try {
            const { error, paymentIntent } = await this.stripe.confirmPayment({
                elements: paymentElement,
                clientSecret: clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/success`,
                }
            });

            if (error) {
                throw error;
            }

            return paymentIntent;
        } catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        }
    }

    // Create Stripe Elements for payment form
    createPaymentElements(clientSecret, appearance = {}) {
        const defaultAppearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#e67e22',
                colorBackground: '#ffffff',
                colorText: '#1a3a52',
                colorDanger: '#df1b41',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
            }
        };

        const elements = this.stripe.elements({
            clientSecret: clientSecret,
            appearance: { ...defaultAppearance, ...appearance }
        });

        const paymentElement = elements.create('payment');
        return { elements, paymentElement };
    }

    // Format price for display
    formatPrice(priceInCents, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(priceInCents / 100);
    }
}

// Global instance
window.StripePayments = new StripePayments();
