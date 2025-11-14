import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Contact.css';

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.title = 'Contact Us | ROI Systems';
    window.scrollTo(0, 0);
  }, []);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return undefined;

      case 'company':
        if (!value.trim()) return 'Company is required';
        return undefined;

      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[\d\s\-\(\)\+]+$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        return undefined;

      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 5) return 'Subject must be at least 5 characters';
        return undefined;

      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 20) return 'Message must be at least 20 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // if (!response.ok) throw new Error('Failed to send message');

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
      setTouched({});

      // Show success message for 3 seconds then clear
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitError('Failed to send message. Please try again or email us directly at support@roi-systems.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <section className="contact-header">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>Contact Us</h1>
          <p className="subtitle">
            Get in touch with our team for sales, support, or partnership inquiries
          </p>
        </div>
      </section>

      <div className="container contact-container">
        <div className="contact-grid">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>Send us a message</h2>
            <p className="form-description">
              Fill out the form below and our team will get back to you within 1 business day.
            </p>

            {submitSuccess && (
              <div className="alert alert-success">
                <strong>Success!</strong> Your message has been sent. We'll get back to you soon.
              </div>
            )}

            {submitError && (
              <div className="alert alert-error">
                <strong>Error:</strong> {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.name && touched.name ? 'error' : ''}
                    disabled={isSubmitting}
                    placeholder="John Smith"
                  />
                  {errors.name && touched.name && (
                    <span className="error-message">{errors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.email && touched.email ? 'error' : ''}
                    disabled={isSubmitting}
                    placeholder="john.smith@example.com"
                  />
                  {errors.email && touched.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company">
                    Company <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.company && touched.company ? 'error' : ''}
                    disabled={isSubmitting}
                    placeholder="ABC Realty Group"
                  />
                  {errors.company && touched.company && (
                    <span className="error-message">{errors.company}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.phone && touched.phone ? 'error' : ''}
                    disabled={isSubmitting}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && touched.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">
                  Subject <span className="required">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.subject && touched.subject ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select a subject...</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="demo">Request a Demo</option>
                  <option value="billing">Billing Question</option>
                  <option value="feedback">Product Feedback</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject && touched.subject && (
                  <span className="error-message">{errors.subject}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.message && touched.message ? 'error' : ''}
                  disabled={isSubmitting}
                  rows={6}
                  placeholder="Please provide details about your inquiry..."
                />
                {errors.message && touched.message && (
                  <span className="error-message">{errors.message}</span>
                )}
                <span className="character-count">
                  {formData.message.length} / 20 minimum characters
                </span>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              <p className="form-footer">
                <span className="required">*</span> Required fields
              </p>
            </form>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <div className="contact-info-card">
              <h3>Get in Touch</h3>
              <p>We're here to help and answer any question you might have.</p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="icon">📧</div>
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:support@roi-systems.com">support@roi-systems.com</a>
                    <p className="method-note">For general inquiries</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="icon">📧</div>
                  <div>
                    <h4>Sales</h4>
                    <a href="mailto:sales@roi-systems.com">sales@roi-systems.com</a>
                    <p className="method-note">For sales and demos</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="icon">📞</div>
                  <div>
                    <h4>Phone</h4>
                    <a href="tel:+18005551234">1-800-555-1234</a>
                    <p className="method-note">Mon-Fri, 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="icon">📍</div>
                  <div>
                    <h4>Office</h4>
                    <p>123 Main Street<br />San Francisco, CA 94102</p>
                    <p className="method-note">By appointment only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-info-card">
              <h3>Response Time</h3>
              <p>We aim to respond to all inquiries within:</p>
              <ul>
                <li><strong>Sales:</strong> Within 4 hours</li>
                <li><strong>Support:</strong> Within 24 hours</li>
                <li><strong>General:</strong> Within 1-2 business days</li>
              </ul>
            </div>

            <div className="contact-info-card">
              <h3>Need Immediate Help?</h3>
              <p>For urgent issues, please:</p>
              <ul>
                <li>Check our <a href="/docs">Documentation</a></li>
                <li>Visit our <a href="/support">Support Center</a></li>
                <li>View <a href="/status">System Status</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
