// Payment UI Components and Handlers
class PaymentComponents {
    constructor() {
        this.stripePayments = window.StripePayments;
        this.currentPaymentElement = null;
        this.currentElements = null;
    }

    // Create payment modal HTML
    createPaymentModal(productType, productInfo) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.id = 'payment-modal';
        
        modal.innerHTML = `
            <div class="payment-modal-overlay" onclick="this.closePaymentModal()">
                <div class="payment-modal-content" onclick="event.stopPropagation()">
                    <div class="payment-modal-header">
                        <h3>${productInfo.title}</h3>
                        <button class="payment-modal-close" onclick="this.closePaymentModal()">&times;</button>
                    </div>
                    <div class="payment-modal-body">
                        <div class="product-summary">
                            <div class="product-details">
                                <h4>${productInfo.name}</h4>
                                <p>${productInfo.description}</p>
                                <div class="price">${this.stripePayments.formatPrice(productInfo.price)}</div>
                            </div>
                        </div>
                        
                        <form id="payment-form" class="payment-form">
                            <div class="customer-info">
                                <div class="form-row">
                                    <input type="text" id="customer-name" placeholder="Full Name" required>
                                    <input type="email" id="customer-email" placeholder="Email Address" required>
                                </div>
                                ${productType === 'consultation' ? this.getConsultationFields() : ''}
                                ${productType === 'speaking' ? this.getSpeakingFields() : ''}
                            </div>
                            
                            <div id="payment-element">
                                <!-- Stripe Elements will create form elements here -->
                            </div>
                            
                            <div class="payment-actions">
                                <button type="button" class="btn-secondary" onclick="this.closePaymentModal()">Cancel</button>
                                <button type="submit" id="submit-payment" class="btn-primary">
                                    <span class="button-text">Pay ${this.stripePayments.formatPrice(productInfo.price)}</span>
                                    <div class="spinner" style="display: none;"></div>
                                </button>
                            </div>
                            
                            <div id="payment-messages" class="payment-messages"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    // Get consultation-specific form fields
    getConsultationFields() {
        return `
            <div class="form-row">
                <input type="text" id="organization" placeholder="Organization" required>
                <select id="service-type" required>
                    <option value="">Select Service</option>
                    <option value="sherpa-transformation">Sherpa Leadership Transformation</option>
                    <option value="vision-execution">Vision to Execution Bridge</option>
                    <option value="transition-leadership">Transition Leadership</option>
                    <option value="team-development">Leadership Team Development</option>
                    <option value="culture-design">Culture Design & Implementation</option>
                    <option value="ai-leadership">AI-Era Leadership Preparation</option>
                </select>
            </div>
            <textarea id="consultation-details" placeholder="Tell us about your organization and consulting needs..." rows="3"></textarea>
        `;
    }

    // Get speaking-specific form fields
    getSpeakingFields() {
        return `
            <div class="form-row">
                <input type="text" id="event-name" placeholder="Event Name" required>
                <input type="date" id="event-date" placeholder="Event Date" required>
            </div>
            <div class="form-row">
                <input type="text" id="audience-size" placeholder="Expected Audience Size">
                <select id="format-type">
                    <option value="">Select Format</option>
                    <option value="keynote">Keynote (45-60 min)</option>
                    <option value="workshop">Workshop (2-4 hours)</option>
                    <option value="masterclass">Masterclass (Half/Full Day)</option>
                    <option value="panel">Panel Discussion</option>
                    <option value="fireside">Fireside Chat</option>
                    <option value="virtual">Virtual Presentation</option>
                </select>
            </div>
            <textarea id="event-details" placeholder="Tell us about your event, audience, and specific needs..." rows="3"></textarea>
        `;
    }

    // Initialize payment process
    async initializePayment(productType, productInfo) {
        try {
            console.log('Initializing payment for:', productType, productInfo);
            
            // Show loading state
            this.showLoading();

            // Get customer information from form
            const customerInfo = this.getCustomerInfo(productType);
            console.log('Customer info:', customerInfo);

            // Create payment intent based on product type
            let clientSecret;
            switch (productType) {
                case 'book':
                    clientSecret = await this.stripePayments.createBookPayment(customerInfo);
                    break;
                case 'consultation':
                    clientSecret = await this.stripePayments.createConsultationPayment(customerInfo, customerInfo.serviceType);
                    break;
                case 'speaking':
                    clientSecret = await this.stripePayments.createSpeakingPayment(customerInfo, customerInfo.eventDetails);
                    break;
                case 'assessment':
                    clientSecret = await this.stripePayments.createAssessmentPayment(customerInfo, customerInfo.assessmentData);
                    break;
                case 'course':
                    clientSecret = await this.stripePayments.createCoursePayment(customerInfo, customerInfo.courseData);
                    break;
                default:
                    throw new Error('Invalid product type');
            }

            // Create Stripe Elements
            const { elements, paymentElement } = this.stripePayments.createPaymentElements(clientSecret);
            this.currentElements = elements;
            this.currentPaymentElement = paymentElement;

            // Mount the payment element
            const paymentElementContainer = document.getElementById('payment-element');
            if (paymentElementContainer) {
                paymentElement.mount('#payment-element');
                console.log('Stripe Elements mounted successfully');
            } else {
                throw new Error('Payment element container not found');
            }

            // Hide loading state
            this.hideLoading();

            return { clientSecret, elements, paymentElement };
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to initialize payment. Please try again.');
            console.error('Payment initialization error:', error);
            throw error;
        }
    }

    // Get customer information from form
    getCustomerInfo(productType) {
        const customerInfo = {
            name: document.getElementById('customer-name')?.value || '',
            email: document.getElementById('customer-email')?.value || '',
        };

        if (productType === 'consultation') {
            customerInfo.organization = document.getElementById('organization')?.value || '';
            customerInfo.serviceType = document.getElementById('service-type')?.value || '';
            customerInfo.details = document.getElementById('consultation-details')?.value || '';
        }

        if (productType === 'speaking') {
            customerInfo.eventDetails = {
                eventName: document.getElementById('event-name')?.value || '',
                eventDate: document.getElementById('event-date')?.value || '',
                audienceSize: document.getElementById('audience-size')?.value || '',
                formatType: document.getElementById('format-type')?.value || '',
                details: document.getElementById('event-details')?.value || ''
            };
        }

        if (productType === 'course') {
            customerInfo.courseData = {
                tier: 'pilot', // Default to pilot for now
                interests: document.getElementById('course-interests')?.value || '',
                experience: document.getElementById('course-experience')?.value || ''
            };
        }

        return customerInfo;
    }

    // Handle payment form submission
    async handlePaymentSubmission(event, productType) {
        event.preventDefault();

        if (!this.currentElements) {
            this.showError('Payment form not properly initialized. Please refresh and try again.');
            return;
        }

        this.setLoadingState(true);

        try {
            const customerInfo = this.getCustomerInfo(productType);
            
            // Validate required fields
            if (!customerInfo.name || !customerInfo.email) {
                throw new Error('Please fill in all required fields.');
            }

            const { error } = await this.stripePayments.stripe.confirmPayment({
                elements: this.currentElements,
                confirmParams: {
                    return_url: `${window.location.origin}/success?product=${productType}`,
                    receipt_email: customerInfo.email,
                },
            });

            if (error) {
                if (error.type === "card_error" || error.type === "validation_error") {
                    this.showError(error.message);
                } else {
                    this.showError("An unexpected error occurred.");
                }
            }
        } catch (error) {
            this.showError(error.message || 'Payment failed. Please try again.');
            console.error('Payment submission error:', error);
        }

        this.setLoadingState(false);
    }

    // Show payment modal
    showPaymentModal(productType, productInfo) {
        // Remove existing modal if any
        this.closePaymentModal();

        // Create and show new modal
        const modal = this.createPaymentModal(productType, productInfo);
        document.body.appendChild(modal);
        
        // Add CSS classes for animation
        setTimeout(() => modal.classList.add('active'), 10);

        // Initialize payment after modal is shown and DOM is ready
        setTimeout(() => this.initializePayment(productType, productInfo), 300);

        // Add form submission handler
        const form = document.getElementById('payment-form');
        form.addEventListener('submit', (e) => this.handlePaymentSubmission(e, productType));
    }

    // Close payment modal
    closePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.remove();
        }
        this.currentPaymentElement = null;
        this.currentElements = null;
    }

    // Show loading state
    showLoading() {
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
            this.setLoadingState(true);
        }
    }

    // Hide loading state
    hideLoading() {
        const submitButton = document.getElementById('submit-payment');
        if (submitButton) {
            this.setLoadingState(false);
        }
    }

    // Set loading state for submit button
    setLoadingState(isLoading) {
        const submitButton = document.getElementById('submit-payment');
        const buttonText = submitButton?.querySelector('.button-text');
        const spinner = submitButton?.querySelector('.spinner');

        if (submitButton && buttonText && spinner) {
            if (isLoading) {
                submitButton.disabled = true;
                buttonText.style.display = 'none';
                spinner.style.display = 'inline-block';
            } else {
                submitButton.disabled = false;
                buttonText.style.display = 'inline';
                spinner.style.display = 'none';
            }
        }
    }

    // Show error message
    showError(message) {
        const messagesContainer = document.getElementById('payment-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `<div class="error-message">${message}</div>`;
            setTimeout(() => {
                messagesContainer.innerHTML = '';
            }, 5000);
        }
    }

    // Show success message
    showSuccess(message) {
        const messagesContainer = document.getElementById('payment-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `<div class="success-message">${message}</div>`;
        }
    }
}

// Global instance
window.PaymentComponents = new PaymentComponents();

// Global function to close modal (for onclick handlers)
window.closePaymentModal = () => window.PaymentComponents.closePaymentModal();
