/**
 * Professional email templates for AdvisorPro CRM
 * Generates HTML and text versions of system emails
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface TeamInviteEmailData {
  userName: string
  workspaceName: string
  inviterName: string
  loginUrl: string
  tempPassword?: string
  role: string
}

export interface WelcomeEmailData {
  userName: string
  workspaceName: string
  loginUrl: string
  isNewUser: boolean
  tempPassword?: string
}

export interface PasswordResetEmailData {
  userName: string
  resetUrl: string
  expiresIn: string
}

export interface PremiumReminderEmailData {
  clientName: string
  policyNumber: string
  insurer: string
  planName?: string
  premiumAmount: number
  dueDate: string
  gracePeriodEnd?: string
  paymentUrl?: string
  contactInfo: {
    name: string
    phone: string
    email: string
  }
}

/**
 * Generate team invitation email for new or existing users
 */
export function generateTeamInviteEmail(data: TeamInviteEmailData): EmailTemplate {
  const { userName, workspaceName, inviterName, loginUrl, tempPassword, role } = data
  
  const isNewUser = !!tempPassword
  const roleDescription = role === "AGENT" ? "Team Member" : "Viewer"
  
  const subject = `You've been invited to join ${workspaceName} on AdvisorPro`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation - AdvisorPro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .credentials-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .credentials-box h3 { color: #92400e; margin: 0 0 10px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #2563eb; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; color: #64748b; font-size: 14px; }
        .role-badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .security-note { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .security-note p { margin: 0; color: #047857; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to AdvisorPro</h1>
          <p>Professional Insurance CRM Platform</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName}!</h2>
          
          <div class="welcome-box">
            <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <span class="role-badge">${roleDescription}</span>.</p>
          </div>
          
          <p>AdvisorPro is a comprehensive insurance CRM that helps teams manage clients, policies, premiums, and team collaboration efficiently.</p>
          
          ${isNewUser ? `
            <div class="credentials-box">
              <h3>🔐 Your Account Credentials</h3>
              <p><strong>Email:</strong> This email address</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
              <p style="margin-top: 15px; font-size: 14px;"><strong>Important:</strong> Please change your password after your first login for security.</p>
            </div>
          ` : `
            <div class="security-note">
              <p>🎉 <strong>Good news!</strong> You already have an AdvisorPro account. Use your existing credentials to access the new workspace.</p>
            </div>
          `}
          
          <h3>Your Role & Permissions</h3>
          <ul style="margin: 15px 0; padding-left: 20px;">
            ${role === "AGENT" ? `
              <li>Manage clients and their insurance policies</li>
              <li>Record premium payments and track due dates</li>
              <li>Create and assign tasks to team members</li>
              <li>Send reminders via email and WhatsApp</li>
              <li>Generate reports and analytics</li>
            ` : `
              <li>View client information and policies</li>
              <li>Access reports and analytics</li>
              <li>View team activities and tasks</li>
              <li>Read-only access to workspace data</li>
            `}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="btn">Access Your Workspace</a>
          </div>
          
          <h3>Getting Started</h3>
          <ol style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
            <li>Click the button above to access AdvisorPro</li>
            <li>${isNewUser ? "Sign in with your email and temporary password" : "Sign in with your existing credentials"}</li>
            ${isNewUser ? "<li>Change your password in Settings > Profile</li>" : ""}
            <li>Explore the dashboard and familiarize yourself with the interface</li>
            <li>Start managing clients and policies efficiently</li>
          </ol>
          
          <div class="security-note">
            <p><strong>Security Notice:</strong> Location tracking is enabled for attendance monitoring. Please ensure location services are enabled on your device when signing in.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} from ${workspaceName}</p>
          <p style="margin-top: 10px;">If you have any questions, please contact your workspace administrator.</p>
          <p style="margin-top: 15px; font-size: 12px;">© 2025 AdvisorPro CRM - Professional Insurance Management</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Welcome to AdvisorPro - ${workspaceName}

Hello ${userName}!

${inviterName} has invited you to join ${workspaceName} as a ${roleDescription}.

${isNewUser ? `
Your Account Credentials:
- Email: This email address
- Temporary Password: ${tempPassword}

IMPORTANT: Please change your password after your first login for security.
` : `
Good news! You already have an AdvisorPro account. Use your existing credentials to access the new workspace.
`}

Your Role & Permissions:
${role === "AGENT" ? `
- Manage clients and their insurance policies
- Record premium payments and track due dates
- Create and assign tasks to team members
- Send reminders via email and WhatsApp
- Generate reports and analytics
` : `
- View client information and policies
- Access reports and analytics
- View team activities and tasks
- Read-only access to workspace data
`}

Getting Started:
1. Visit: ${loginUrl}
2. ${isNewUser ? "Sign in with your email and temporary password" : "Sign in with your existing credentials"}
${isNewUser ? "3. Change your password in Settings > Profile" : ""}
${isNewUser ? "4" : "3"}. Explore the dashboard and familiarize yourself with the interface
${isNewUser ? "5" : "4"}. Start managing clients and policies efficiently

Security Notice: Location tracking is enabled for attendance monitoring. Please ensure location services are enabled on your device when signing in.

This invitation was sent by ${inviterName} from ${workspaceName}.
If you have any questions, please contact your workspace administrator.

© 2025 AdvisorPro CRM - Professional Insurance Management
  `
  
  return { subject, html, text }
}

/**
 * Generate welcome email for new users
 */
export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const { userName, workspaceName, loginUrl, isNewUser, tempPassword } = data
  
  const subject = `Welcome to AdvisorPro - Your ${workspaceName} workspace is ready!`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AdvisorPro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 15px 0 0; opacity: 0.9; font-size: 18px; }
        .content { padding: 40px 30px; }
        .welcome-box { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .feature-card h4 { margin: 0 0 10px; color: #1e40af; font-size: 16px; }
        .feature-card p { margin: 0; color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 16px; }
        .btn:hover { background: #059669; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; color: #64748b; font-size: 14px; }
        .credentials-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .credentials-box h3 { color: #92400e; margin: 0 0 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to AdvisorPro!</h1>
          <p>Your professional insurance CRM is ready</p>
        </div>
        
        <div class="content">
          <div class="welcome-box">
            <h2 style="margin: 0 0 15px; color: #065f46;">Hello ${userName}!</h2>
            <p style="margin: 0; color: #047857; font-size: 16px;">Your <strong>${workspaceName}</strong> workspace has been created successfully.</p>
          </div>
          
          ${tempPassword ? `
            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <p><strong>Email:</strong> This email address</p>
              <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${tempPassword}</code></p>
              <p style="margin-top: 15px; font-size: 14px;"><strong>Security:</strong> Please change this password after your first login.</p>
            </div>
          ` : ''}
          
          <h3>🚀 What you can do with AdvisorPro:</h3>
          
          <div class="feature-grid">
            <div class="feature-card">
              <h4>👥 Client Management</h4>
              <p>Organize clients into family groups, track personal details, and maintain comprehensive records with document management.</p>
            </div>
            
            <div class="feature-card">
              <h4>📋 Policy Tracking</h4>
              <p>Manage insurance policies across multiple insurers, track premiums, due dates, and policy status with automated calculations.</p>
            </div>
            
            <div class="feature-card">
              <h4>💰 Premium Management</h4>
              <p>Record payments, track due dates, send automated reminders, and generate professional receipts and reports.</p>
            </div>
            
            <div class="feature-card">
              <h4>📱 Communication Hub</h4>
              <p>Send professional emails and WhatsApp messages using customizable templates for reminders and notifications.</p>
            </div>
            
            <div class="feature-card">
              <h4>📊 Analytics & Reports</h4>
              <p>Generate comprehensive reports, track team performance, and gain insights into your insurance business.</p>
            </div>
            
            <div class="feature-card">
              <h4>🔒 Security & Compliance</h4>
              <p>Location tracking for attendance, audit logs for compliance, and role-based access control for team security.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${loginUrl}" class="btn">Access Your Workspace</a>
          </div>
          
          <h3>🎯 Quick Start Guide:</h3>
          <ol style="margin: 20px 0; padding-left: 25px; line-height: 2;">
            <li><strong>Sign In:</strong> Click the button above and use your credentials</li>
            ${tempPassword ? '<li><strong>Security:</strong> Change your temporary password in Settings</li>' : ''}
            <li><strong>Setup:</strong> Configure your office details and email settings</li>
            <li><strong>Add Clients:</strong> Start by adding your first client or family group</li>
            <li><strong>Create Policies:</strong> Add insurance policies for your clients</li>
            <li><strong>Team Up:</strong> Invite team members to collaborate effectively</li>
          </ol>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #047857;"><strong>💡 Pro Tip:</strong> Enable location services on your device for attendance tracking and enhanced security features.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Need Help?</strong> Our support team is here to assist you.</p>
          <p style="margin-top: 10px;">Email: support@advisorpro.com | Phone: +91 1800-XXX-XXXX</p>
          <p style="margin-top: 20px; font-size: 12px;">© 2025 AdvisorPro CRM - Developed by Codvix Tech Private Limited</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Welcome to AdvisorPro - ${workspaceName}

Hello ${userName}!

Your ${workspaceName} workspace has been created successfully.

${tempPassword ? `
Your Login Credentials:
- Email: This email address  
- Temporary Password: ${tempPassword}

SECURITY: Please change this password after your first login.
` : ''}

What you can do with AdvisorPro:

👥 CLIENT MANAGEMENT
Organize clients into family groups, track personal details, and maintain comprehensive records.

📋 POLICY TRACKING  
Manage insurance policies across multiple insurers, track premiums and due dates.

💰 PREMIUM MANAGEMENT
Record payments, track due dates, and send automated reminders.

📱 COMMUNICATION HUB
Send professional emails and WhatsApp messages using templates.

📊 ANALYTICS & REPORTS
Generate comprehensive reports and track team performance.

🔒 SECURITY & COMPLIANCE
Location tracking, audit logs, and role-based access control.

Quick Start Guide:
1. Sign In: Visit ${loginUrl}
${tempPassword ? '2. Security: Change your temporary password in Settings' : ''}
${tempPassword ? '3' : '2'}. Setup: Configure your office details and email settings
${tempPassword ? '4' : '3'}. Add Clients: Start by adding your first client or family group  
${tempPassword ? '5' : '4'}. Create Policies: Add insurance policies for your clients
${tempPassword ? '6' : '5'}. Team Up: Invite team members to collaborate effectively

💡 Pro Tip: Enable location services on your device for attendance tracking and enhanced security.

Need Help?
Email: support@advisorpro.com
Phone: +91 1800-XXX-XXXX

© 2025 AdvisorPro CRM - Developed by Codvix Tech Private Limited
  `
  
  return { subject, html, text }
}

/**
 * Generate password reset email
 */
export function generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
  const { userName, resetUrl, expiresIn } = data
  
  const subject = "Reset your AdvisorPro password"
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - AdvisorPro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .alert-box { background: #fef2f2; border: 1px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .btn { display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #dc2626; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
          <p>AdvisorPro Account Security</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          
          <p>We received a request to reset your AdvisorPro password. If you made this request, click the button below to create a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="btn">Reset My Password</a>
          </div>
          
          <div class="alert-box">
            <p style="margin: 0; color: #dc2626;"><strong>⏰ Important:</strong> This reset link will expire in ${expiresIn}. Please use it soon.</p>
          </div>
          
          <h3>Security Guidelines:</h3>
          <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
            <li>Choose a strong password with at least 8 characters</li>
            <li>Include uppercase, lowercase, numbers, and special characters</li>
            <li>Don't reuse passwords from other accounts</li>
            <li>Keep your password confidential and secure</li>
          </ul>
          
          <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
        </div>
        
        <div class="footer">
          <p>This email was sent from AdvisorPro CRM for account security.</p>
          <p style="margin-top: 15px; font-size: 12px;">© 2025 AdvisorPro CRM - Professional Insurance Management</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Password Reset - AdvisorPro

Hello ${userName},

We received a request to reset your AdvisorPro password. If you made this request, use the link below to create a new password.

Reset Link: ${resetUrl}

⏰ IMPORTANT: This reset link will expire in ${expiresIn}. Please use it soon.

Security Guidelines:
- Choose a strong password with at least 8 characters
- Include uppercase, lowercase, numbers, and special characters  
- Don't reuse passwords from other accounts
- Keep your password confidential and secure

Didn't request this? If you didn't request a password reset, please ignore this email. Your account remains secure.

© 2025 AdvisorPro CRM - Professional Insurance Management
  `
  
  return { subject, html, text }
}

/**
 * Generate premium reminder email for clients
 */
export function generatePremiumReminderEmail(data: PremiumReminderEmailData): EmailTemplate {
  const { 
    clientName, 
    policyNumber, 
    insurer, 
    planName, 
    premiumAmount, 
    dueDate, 
    gracePeriodEnd,
    paymentUrl,
    contactInfo 
  } = data
  
  const subject = `Premium Due Reminder - Policy ${policyNumber}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Premium Due Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .policy-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 25px; margin: 25px 0; border-radius: 12px; }
        .amount-highlight { background: #dc2626; color: white; padding: 8px 16px; border-radius: 6px; font-size: 24px; font-weight: 700; display: inline-block; margin: 15px 0; }
        .btn { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background: #b91c1c; }
        .contact-box { background: #f1f5f9; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Premium Due Reminder</h1>
          <p>Important: Action Required</p>
        </div>
        
        <div class="content">
          <h2>Dear ${clientName},</h2>
          
          <p>This is a friendly reminder that your insurance premium is due soon. Please review the details below and make your payment to keep your policy active.</p>
          
          <div class="policy-box">
            <h3 style="margin: 0 0 15px; color: #92400e;">📋 Policy Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div>
                <strong>Policy Number:</strong><br>
                <span style="font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px;">${policyNumber}</span>
              </div>
              <div>
                <strong>Insurer:</strong><br>
                ${insurer}
              </div>
              ${planName ? `
                <div style="grid-column: 1 / -1;">
                  <strong>Plan:</strong> ${planName}
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center;">
              <p style="margin: 0 0 10px; font-size: 16px;"><strong>Premium Amount Due:</strong></p>
              <div class="amount-highlight">₹${premiumAmount.toLocaleString('en-IN')}</div>
              <p style="margin: 10px 0 0; color: #92400e;"><strong>Due Date:</strong> ${dueDate}</p>
              ${gracePeriodEnd ? `<p style="margin: 5px 0 0; color: #dc2626; font-size: 14px;"><strong>Grace Period Ends:</strong> ${gracePeriodEnd}</p>` : ''}
            </div>
          </div>
          
          ${paymentUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentUrl}" class="btn">Pay Now Online</a>
            </div>
          ` : ''}
          
          <h3>💳 Payment Options:</h3>
          <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Online:</strong> Net banking, UPI, debit/credit cards</li>
            <li><strong>Cheque:</strong> Payable to "${insurer}"</li>
            <li><strong>Cash:</strong> Visit our office during business hours</li>
            <li><strong>Auto-debit:</strong> Set up automatic premium deduction</li>
          </ul>
          
          <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important:</strong> Ensure timely payment to avoid policy lapse and maintain continuous coverage for you and your family.</p>
          </div>
          
          <div class="contact-box">
            <h4 style="margin: 0 0 15px; color: #1e40af;">📞 Need Assistance?</h4>
            <p style="margin: 0;"><strong>Contact:</strong> ${contactInfo.name}</p>
            <p style="margin: 5px 0 0;"><strong>Phone:</strong> ${contactInfo.phone}</p>
            <p style="margin: 5px 0 0;"><strong>Email:</strong> ${contactInfo.email}</p>
            <p style="margin: 15px 0 0; font-size: 14px; color: #475569;">We're here to help with any questions about your policy or payment process.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from your insurance advisor.</p>
          <p style="margin-top: 10px;">Please do not reply to this email. Contact us using the details above.</p>
          <p style="margin-top: 15px; font-size: 12px;">© 2025 AdvisorPro CRM - Professional Insurance Management</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Premium Due Reminder - Policy ${policyNumber}

Dear ${clientName},

This is a friendly reminder that your insurance premium is due soon.

POLICY DETAILS:
- Policy Number: ${policyNumber}
- Insurer: ${insurer}
${planName ? `- Plan: ${planName}` : ''}

PREMIUM AMOUNT DUE: ₹${premiumAmount.toLocaleString('en-IN')}
DUE DATE: ${dueDate}
${gracePeriodEnd ? `GRACE PERIOD ENDS: ${gracePeriodEnd}` : ''}

PAYMENT OPTIONS:
- Online: Net banking, UPI, debit/credit cards
- Cheque: Payable to "${insurer}"  
- Cash: Visit our office during business hours
- Auto-debit: Set up automatic premium deduction

${paymentUrl ? `Pay Online: ${paymentUrl}` : ''}

⚠️ IMPORTANT: Ensure timely payment to avoid policy lapse and maintain continuous coverage.

NEED ASSISTANCE?
Contact: ${contactInfo.name}
Phone: ${contactInfo.phone}
Email: ${contactInfo.email}

We're here to help with any questions about your policy or payment process.

© 2025 AdvisorPro CRM - Professional Insurance Management
  `
  
  return { subject, html, text }
}

/**
 * Generate policy renewal reminder email
 */
export function generatePolicyRenewalEmail(data: {
  clientName: string
  policyNumber: string
  insurer: string
  planName?: string
  maturityDate: string
  renewalOptions: string[]
  contactInfo: {
    name: string
    phone: string
    email: string
  }
}): EmailTemplate {
  const { clientName, policyNumber, insurer, planName, maturityDate, renewalOptions, contactInfo } = data
  
  const subject = `Policy Renewal Opportunity - ${policyNumber} maturing soon`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Policy Renewal - AdvisorPro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .renewal-box { background: #f3e8ff; border: 1px solid #8b5cf6; padding: 25px; margin: 25px 0; border-radius: 12px; }
        .btn { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Policy Renewal</h1>
          <p>Secure Your Future</p>
        </div>
        
        <div class="content">
          <h2>Dear ${clientName},</h2>
          
          <p>Your insurance policy is approaching maturity. This is an excellent opportunity to review your coverage and explore renewal options that best suit your current needs.</p>
          
          <div class="renewal-box">
            <h3 style="margin: 0 0 15px; color: #6b21a8;">📋 Policy Information</h3>
            <p><strong>Policy Number:</strong> ${policyNumber}</p>
            <p><strong>Insurer:</strong> ${insurer}</p>
            ${planName ? `<p><strong>Current Plan:</strong> ${planName}</p>` : ''}
            <p><strong>Maturity Date:</strong> ${maturityDate}</p>
          </div>
          
          <h3>🎯 Renewal Options Available:</h3>
          <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
            ${renewalOptions.map(option => `<li>${option}</li>`).join('')}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:${contactInfo.phone}" class="btn">Schedule Consultation</a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Contact ${contactInfo.name}</strong></p>
          <p>Phone: ${contactInfo.phone} | Email: ${contactInfo.email}</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Policy Renewal Opportunity - ${policyNumber}

Dear ${clientName},

Your insurance policy is approaching maturity on ${maturityDate}. This is an excellent opportunity to review your coverage and explore renewal options.

POLICY INFORMATION:
- Policy Number: ${policyNumber}
- Insurer: ${insurer}
${planName ? `- Current Plan: ${planName}` : ''}
- Maturity Date: ${maturityDate}

RENEWAL OPTIONS AVAILABLE:
${renewalOptions.map(option => `- ${option}`).join('\n')}

Contact ${contactInfo.name} for consultation:
Phone: ${contactInfo.phone}
Email: ${contactInfo.email}

© 2025 AdvisorPro CRM
  `
  
  return { subject, html, text }
}

/**
 * Generate birthday greeting email for clients
 */
export function generateBirthdayGreetingEmail(data: {
  clientName: string
  age?: number
  personalMessage?: string
  contactInfo: {
    name: string
    phone: string
    email: string
  }
}): EmailTemplate {
  const { clientName, age, personalMessage, contactInfo } = data
  
  const subject = `🎉 Happy Birthday ${clientName}! Best wishes from your insurance advisor`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Happy Birthday</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; text-align: center; }
        .birthday-box { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border: 2px solid #ec4899; padding: 30px; margin: 25px 0; border-radius: 12px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎂 Happy Birthday!</h1>
          <p>Celebrating You Today</p>
        </div>
        
        <div class="content">
          <div class="birthday-box">
            <h2 style="margin: 0 0 20px; color: #be185d; font-size: 28px;">Happy Birthday ${clientName}!</h2>
            ${age ? `<p style="font-size: 18px; color: #be185d; margin: 0 0 15px;">Wishing you a wonderful ${age}th birthday!</p>` : ''}
            <p style="margin: 0; color: #831843; font-size: 16px;">May this special day bring you joy, happiness, and prosperity.</p>
          </div>
          
          ${personalMessage ? `
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; font-style: italic; color: #475569;">"${personalMessage}"</p>
            </div>
          ` : ''}
          
          <p>As your trusted insurance advisor, we're grateful for the opportunity to serve you and protect what matters most to you and your family.</p>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #047857;"><strong>🛡️ Birthday Reminder:</strong> It's a great time to review your insurance coverage and ensure your family's financial security is up to date.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Warm wishes from ${contactInfo.name}</strong></p>
          <p>Your Insurance Advisor</p>
          <p style="margin-top: 15px;">Phone: ${contactInfo.phone} | Email: ${contactInfo.email}</p>
          <p style="margin-top: 15px; font-size: 12px;">© 2025 AdvisorPro CRM - Professional Insurance Management</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
🎂 Happy Birthday ${clientName}!

${age ? `Wishing you a wonderful ${age}th birthday!` : 'Wishing you a wonderful birthday!'}

May this special day bring you joy, happiness, and prosperity.

${personalMessage ? `"${personalMessage}"` : ''}

As your trusted insurance advisor, we're grateful for the opportunity to serve you and protect what matters most to you and your family.

🛡️ Birthday Reminder: It's a great time to review your insurance coverage and ensure your family's financial security is up to date.

Warm wishes from ${contactInfo.name}
Your Insurance Advisor

Phone: ${contactInfo.phone}
Email: ${contactInfo.email}

© 2025 AdvisorPro CRM - Professional Insurance Management
  `
  
  return { subject, html, text }
}

/**
 * Generate policy maturity notification email
 */
export function generatePolicyMaturityEmail(data: {
  clientName: string
  policyNumber: string
  insurer: string
  planName?: string
  maturityDate: string
  maturityAmount?: number
  nextSteps: string[]
  contactInfo: {
    name: string
    phone: string
    email: string
  }
}): EmailTemplate {
  const { clientName, policyNumber, insurer, planName, maturityDate, maturityAmount, nextSteps, contactInfo } = data
  
  const subject = `🎉 Policy Maturity - ${policyNumber} has matured successfully`
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Policy Maturity Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .maturity-box { background: #ecfdf5; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; }
        .amount-highlight { background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; font-size: 24px; font-weight: 700; display: inline-block; margin: 15px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your Policy Has Matured</p>
        </div>
        
        <div class="content">
          <h2>Dear ${clientName},</h2>
          
          <p>We're delighted to inform you that your insurance policy has successfully matured. Congratulations on completing your investment journey!</p>
          
          <div class="maturity-box">
            <h3 style="margin: 0 0 15px; color: #065f46;">📋 Maturity Details</h3>
            <p><strong>Policy Number:</strong> ${policyNumber}</p>
            <p><strong>Insurer:</strong> ${insurer}</p>
            ${planName ? `<p><strong>Plan:</strong> ${planName}</p>` : ''}
            <p><strong>Maturity Date:</strong> ${maturityDate}</p>
            ${maturityAmount ? `
              <div style="margin: 20px 0;">
                <p style="margin: 0 0 10px; font-size: 16px;"><strong>Maturity Amount:</strong></p>
                <div class="amount-highlight">₹${maturityAmount.toLocaleString('en-IN')}</div>
              </div>
            ` : ''}
          </div>
          
          <h3>📝 Next Steps:</h3>
          <ol style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
            ${nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ol>
          
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #0c4a6e;"><strong>💡 Financial Planning:</strong> Consider reinvesting your maturity amount in new insurance or investment products to continue building your financial security.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Contact ${contactInfo.name} for assistance</strong></p>
          <p>Phone: ${contactInfo.phone} | Email: ${contactInfo.email}</p>
          <p style="margin-top: 15px; font-size: 12px;">© 2025 AdvisorPro CRM - Professional Insurance Management</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Policy Maturity Notification - ${policyNumber}

Dear ${clientName},

Congratulations! Your insurance policy has successfully matured.

MATURITY DETAILS:
- Policy Number: ${policyNumber}
- Insurer: ${insurer}
${planName ? `- Plan: ${planName}` : ''}
- Maturity Date: ${maturityDate}
${maturityAmount ? `- Maturity Amount: ₹${maturityAmount.toLocaleString('en-IN')}` : ''}

NEXT STEPS:
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

💡 Financial Planning: Consider reinvesting your maturity amount in new insurance or investment products to continue building your financial security.

Contact ${contactInfo.name} for assistance:
Phone: ${contactInfo.phone}
Email: ${contactInfo.email}

© 2025 AdvisorPro CRM - Professional Insurance Management
  `
  
  return { subject, html, text }
}