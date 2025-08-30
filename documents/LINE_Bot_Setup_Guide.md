# LINE Bot Setup Guide for EVEP Platform

## 🎯 Overview

This guide provides step-by-step instructions for setting up and configuring the LINE Bot integration for the EVEP Platform. The LINE Bot provides automated vision screening assistance, appointment reminders, and educational content delivery.

## 📋 Prerequisites

- LINE Developer Account
- EVEP Platform deployed and running
- Domain name with SSL certificate
- LINE Bot Channel created

## 🚀 Quick Setup

### 1. Create LINE Bot Channel

1. **Visit LINE Developers Console**
   - Go to [LINE Developers Console](https://developers.line.biz/)
   - Sign in with your LINE account

2. **Create a New Provider**
   - Click "Create New Provider"
   - Enter provider name: "EVEP Vision Screening"
   - Click "Create"

3. **Create a Messaging API Channel**
   - Click "Create Channel"
   - Select "Messaging API"
   - Fill in the details:
     - **Channel name**: EVEP Vision Screening Bot
     - **Channel description**: AI-powered vision screening assistant for children
     - **Category**: Health & Beauty
     - **Subcategory**: Medical
     - **Email address**: your-email@domain.com
   - Click "Create"

4. **Get Channel Credentials**
   - Note down the following from your channel:
     - **Channel ID**
     - **Channel Secret**
     - **Channel Access Token** (generate if not available)

### 2. Configure LINE Bot Settings

1. **Access Admin Panel**
   - Navigate to: `https://your-domain.com/admin`
   - Login with admin credentials

2. **Go to LINE Bot Manager**
   - Click on "LINE Bot Manager" in the sidebar
   - Navigate to "Bot Settings" tab

3. **Configure Bot Settings**
   - **Channel ID**: Enter your LINE Channel ID
   - **Channel Access Token**: Enter your Channel Access Token
   - **Channel Secret**: Enter your Channel Secret
   - **Webhook URL**: `https://your-domain.com/api/v1/line_integration/webhook`
   - **Display Name**: EVEP Vision Screening Bot
   - **Status Message**: Vision screening assistant for children
   - **Production Mode**: Enable for production use

4. **Save Settings**
   - Click "Save Settings"
   - Test webhook connection

### 3. Configure LINE Developer Console

1. **Set Webhook URL**
   - Go back to LINE Developers Console
   - Navigate to your channel settings
   - Set Webhook URL: `https://your-domain.com/api/v1/line_integration/webhook`
   - Enable "Use webhook"

2. **Configure Bot Features**
   - **Auto-reply messages**: Disable (we handle this via API)
   - **Greeting messages**: Enable
   - **Group chat**: Enable if needed
   - **QR code login**: Enable for easy access

3. **Set Bot Icon and Cover**
   - Upload appropriate bot icon (square, 1024x1024px)
   - Upload cover image (rectangle, 843x504px)

## 🤖 LINE Bot Features Configuration

### 1. Rich Menu Setup

1. **Access Rich Menu Manager**
   - Go to LINE Bot Manager → Rich Menus tab

2. **Create Main Menu**
   - Click "Create New Rich Menu"
   - **Name**: Main Menu
   - **Size**: Full
   - **Areas**: Configure menu buttons:
     - Vision Screening
     - Appointment Booking
     - Educational Content
     - Help & Support
     - Contact Us

3. **Set as Default**
   - Make the main menu the default rich menu

### 2. Keyword Reply Setup

1. **Access Keyword Reply Manager**
   - Go to LINE Bot Manager → Keyword Replies tab

2. **Create Common Replies**
   - **Keywords**: ["สวัสดี", "hello", "hi"]
   - **Message**: Welcome message in Thai
   - **Priority**: 1

   - **Keywords**: ["ตรวจสายตา", "vision test", "screening"]
   - **Message**: Vision screening information
   - **Priority**: 2

   - **Keywords**: ["นัดหมาย", "appointment", "booking"]
   - **Message**: Appointment booking information
   - **Priority**: 2

### 3. Flex Message Templates

1. **Access Flex Message Manager**
   - Go to LINE Bot Manager → Flex Messages tab

2. **Create Screening Reminder Template**
   - **Name**: Screening Reminder
   - **Purpose**: reminder
   - **Content**: Create attractive reminder message

3. **Create Results Template**
   - **Name**: Screening Results
   - **Purpose**: results
   - **Content**: Professional results presentation

4. **Create Educational Content Template**
   - **Name**: Educational Content
   - **Purpose**: education
   - **Content**: Engaging educational material

## 📊 Analytics and Monitoring

### 1. Message Dashboard

- **Access**: LINE Bot Manager → Message Dashboard
- **Features**:
  - Real-time message statistics
  - User engagement metrics
  - Response time analytics
  - Popular keywords and topics

### 2. LINE Followers Management

- **Access**: LINE Bot Manager → LINE Followers
- **Features**:
  - Follower demographics
  - Active user tracking
  - User engagement history
  - Growth analytics

### 3. AI Health Assistant

- **Access**: LINE Bot Manager → AI Health Assistant
- **Features**:
  - AI-powered health consultations
  - Symptom analysis
  - Health recommendations
  - Educational content delivery

## 🔧 Advanced Configuration

### 1. Follow Event Management

1. **Configure Welcome Flow**
   - Set up automated welcome messages
   - Configure onboarding process
   - Set user preferences

2. **Configure Unfollow Handling**
   - Set up re-engagement strategies
   - Configure follow-up messages

### 2. Custom Integrations

1. **Patient Data Integration**
   - Connect with EVEP patient database
   - Personalized messaging based on patient history
   - Automated appointment reminders

2. **Educational Content**
   - Upload educational materials
   - Schedule content delivery
   - Track content engagement

## 🧪 Testing

### 1. Test Bot Functionality

1. **Add Bot as Friend**
   - Scan QR code or search bot name
   - Add bot to your LINE contacts

2. **Test Basic Features**
   - Send greeting message
   - Test keyword replies
   - Test rich menu navigation
   - Test webhook responses

3. **Test Advanced Features**
   - Test AI health assistant
   - Test appointment booking
   - Test educational content delivery

### 2. Test Production Features

1. **Load Testing**
   - Test with multiple users
   - Monitor response times
   - Check error handling

2. **Security Testing**
   - Verify webhook security
   - Test authentication
   - Check data privacy

## 📈 Monitoring and Maintenance

### 1. Regular Monitoring

- **Daily**: Check message dashboard
- **Weekly**: Review analytics and performance
- **Monthly**: Update content and features

### 2. Performance Optimization

- Monitor response times
- Optimize message templates
- Update keyword replies based on usage

### 3. Content Updates

- Regular educational content updates
- Seasonal health campaigns
- User feedback integration

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Working**
   - Verify webhook URL is correct
   - Check SSL certificate
   - Verify LINE channel settings

2. **Messages Not Sending**
   - Check channel access token
   - Verify bot is not blocked
   - Check rate limits

3. **Rich Menu Not Displaying**
   - Verify rich menu is set as default
   - Check menu configuration
   - Test on different devices

### Support Resources

- LINE Developers Documentation
- EVEP Platform Documentation
- Admin Panel Help Section
- Technical Support Team

## 📞 Support

For technical support:
- Email: support@your-domain.com
- Documentation: https://your-domain.com/docs
- Admin Panel: https://your-domain.com/admin

---

## 🎉 Success Checklist

- [ ] LINE Bot channel created
- [ ] Webhook URL configured
- [ ] Bot settings saved in Admin Panel
- [ ] Rich menu created and set as default
- [ ] Keyword replies configured
- [ ] Flex message templates created
- [ ] Bot tested with multiple scenarios
- [ ] Analytics dashboard working
- [ ] Monitoring alerts configured
- [ ] Documentation updated

**Congratulations! Your LINE Bot is now fully integrated with the EVEP Platform and ready to provide vision screening assistance to users.** 🎊
