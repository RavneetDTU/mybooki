// =============================================================================
// LEGAL PAGES — all text for /privacy-policy and /terms-of-service lives here.
// =============================================================================
// How to edit (no coding needed):
//   • Change the details in LEGAL_DETAILS below; they are reused everywhere.
//   • Edit text between the backticks ` `. Keep the backticks and commas.
//   • **two stars** make text bold. [link text](https://example.com) makes a link.
//   • Anything still in [SQUARE BRACKETS] is a placeholder to fill in.
//   • After editing, update LEGAL_DETAILS.lastUpdated.
// The section `id` values are used in links (e.g. /privacy-policy#data-deletion
// is registered with Meta), so do not rename them.
// =============================================================================

export const LEGAL_DETAILS = {
    companyName: 'Booki AI',
    productName: 'Booki AI',
    website: 'https://booki.co.za',
    contactEmail: 'support@booki.ai',
    businessAddress: '34 Aldigronde Way, Langebaan Country Estate, Langebaan, Morsvalla Way 665, Cape Town, Western Cape, 7357, South Africa',
    governingLaw: 'the Republic of South Africa',
    lastUpdated: 'November 2, 2026',
    retentionPeriod: '12 months',
    deletionDays: 30,
    minimumAge: 18,
};

const D = LEGAL_DETAILS;
const EMAIL = `[${D.contactEmail}](mailto:${D.contactEmail})`;

export const PRIVACY_POLICY = {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    metaTitle: `Privacy Policy | ${D.companyName}`,
    metaDescription: `How ${D.companyName} collects, uses, shares and protects personal information, including messages sent to restaurants through the ${D.companyName} WhatsApp booking assistant, and how to ask for your data to be deleted.`,
    intro: [
        `This Privacy Policy explains how **${D.companyName}** ("we", "us", "our") handles personal information when you use ${D.productName} on WhatsApp, call or message a restaurant that uses ${D.companyName}, or use our website and restaurant dashboard at ${D.website}.`,
    ],
    sections: [
        {
            id: 'who-we-are',
            title: 'Who we are and how to contact us',
            blocks: [
                `${D.companyName} provides AI booking assistants for restaurants. Restaurants use our service to take table bookings and answer enquiries on WhatsApp and by phone.`,
                {
                    list: [
                        `**Business name:** ${D.companyName}`,
                        `**Address:** ${D.businessAddress}`,
                        `**Email:** ${EMAIL}`,
                        `**Website:** [${D.website}](${D.website})`,
                    ],
                },
            ],
        },
        {
            id: 'information-we-collect',
            title: 'Information we collect',
            blocks: [
                'When you chat with a restaurant through our WhatsApp booking assistant, we collect:',
                {
                    list: [
                        '**Your name**, as you give it to us.',
                        '**Your phone number** (your WhatsApp number, and any other contact number you give us).',
                        '**Your WhatsApp profile name**, as shared by WhatsApp.',
                        '**Message content**: the messages you send and the replies we send.',
                        '**Booking details**: date, time, party size, and preferences such as allergies, special occasions or seating requests.',
                        '**Message information**: when messages were sent and their delivery status (for example sent, delivered, read or failed).',
                    ],
                },
                'If you call a restaurant that uses our phone assistant, we also collect your phone number, a recording of the call and a written transcript of it.',
                'If you pay a booking deposit, the payment is handled by our payment provider. We receive the payment status and amount, but we do not see or store your card details.',
                'If you are a restaurant using our dashboard, we collect your account details (name, email, business name and address) and the booking data you manage.',
            ],
        },
        {
            id: 'how-we-use-information',
            title: 'How we use your information',
            blocks: [
                {
                    list: [
                        'To handle table bookings: checking availability, creating the booking and passing it to the restaurant.',
                        'To reply to your messages and answer your questions about the restaurant.',
                        'To send booking confirmations, deposit payment links and reminders about your booking.',
                        'To give support and deal with problems or complaints.',
                        'To prevent spam, fraud and abuse of the service.',
                        'To keep the service working and improve it.',
                    ],
                },
                'We only use your information for these purposes, or where the law requires or allows it.',
            ],
        },
        {
            id: 'ai-processing',
            title: 'Automated and AI processing',
            blocks: [
                'Your messages may be processed by an AI model to understand what you are asking for (for example the date, time and number of guests) and to write replies. Phone calls may be transcribed automatically.',
                'The AI does not decide on its own whether a booking can be made. Availability is checked against the restaurant\'s booking system, and the restaurant can review every booking.',
                '**We do not sell your personal information.** We do not use it for advertising.',
            ],
        },
        {
            id: 'sharing',
            title: 'Who we share information with',
            blocks: [
                'We share personal information only with the following parties, and only as needed to provide the service:',
                {
                    list: [
                        '**Meta Platforms (WhatsApp Business Platform)**, which carries WhatsApp messages between you and us.',
                        '**The restaurant you are booking with**, which receives your booking details so it can serve you.',
                        '**Our hosting and database providers** (Google Cloud / Firebase and Vercel), which store and run our systems.',
                        '**Our AI model provider** (OpenAI), which processes messages and call audio to understand requests and write replies.',
                        '**Our communication provider** (Twilio), which handles phone calls and text messages (SMS).',
                        '**Our payment provider** (PayFast), when you pay a booking deposit.',
                        '**Authorities or advisers**, if the law requires it or to protect our rights and the safety of others.',
                    ],
                },
                'Some of these providers process data outside your country, including in the United States and the European Union. When this happens we rely on the provider\'s safeguards for international transfers and only share what is needed.',
            ],
        },
        {
            id: 'google-api-disclosure',
            title: 'Google API Limited Use Disclosure',
            blocks: [
                `${D.companyName}'s use and transfer of information received from Google APIs to any other app will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.`,
                'Restaurants can connect a Google account. We request these permissions:',
                {
                    list: [
                        '**auth/calendar**: full access to read, create, modify and delete calendar events, to manage the restaurant\'s bookings.',
                        '**auth/userinfo.profile**: to identify the account and personalise the dashboard.',
                    ],
                },
                'How we use Google data:',
                {
                    list: [
                        '**Service delivery:** to sync, display and manage restaurant reservations in Google Calendar.',
                        '**No AI training:** we do not use Google user data to train, retrain or improve generalised AI or machine learning models.',
                        '**No advertising:** we do not use Google data for advertising or marketing.',
                    ],
                },
                'Google access can be removed at any time in the dashboard or in [Google account permissions](https://myaccount.google.com/permissions).',
            ],
        },
        {
            id: 'retention',
            title: 'How long we keep information',
            blocks: [
                `Booking details and chat messages are kept for ${D.retentionPeriod} after your last booking or message, and then deleted or anonymised.`,
                'We may keep some records longer where the law requires it, for example payment and tax records, or to resolve a dispute.',
                'Restaurant account data is kept while the account is active and deleted within 30 days after the account is closed.',
            ],
        },
        {
            id: 'security',
            title: 'How we protect information',
            blocks: [
                'We use reasonable technical and organisational safeguards to protect personal information. These include encryption in transit (HTTPS/TLS), encrypted storage with our cloud providers, access controls so only authorised staff can see data, and verification that incoming WhatsApp messages really come from Meta.',
                'No system is completely secure. If a data breach affects you, we will tell you and the relevant authorities as required by law.',
            ],
        },
        {
            id: 'your-rights',
            title: 'Your rights and choices',
            blocks: [
                'You can ask us to:',
                {
                    list: [
                        '**Access** the personal information we hold about you.',
                        '**Correct** information that is wrong or incomplete.',
                        '**Delete** your information (see [Data Deletion Instructions](#data-deletion)).',
                        '**Withdraw your consent** to us processing your information, where we rely on consent.',
                        '**Stop receiving messages:** reply **STOP** on WhatsApp at any time and we will stop sending you messages.',
                    ],
                },
                `To use any of these rights, email ${EMAIL}. We may need to confirm your identity first. You can also complain to the data protection authority in your country. In South Africa this is the Information Regulator.`,
            ],
        },
        {
            id: 'data-deletion',
            title: 'Data Deletion Instructions',
            blocks: [
                'You can ask us to delete the personal information we hold about you, including your WhatsApp messages and booking details, in either of these ways:',
                {
                    list: [
                        `**By email:** send an email to ${EMAIL} with the subject "Delete my data". Send it from the email address you used with us, or include the phone number you used on WhatsApp.`,
                        '**On WhatsApp:** send the message **"delete my data"** in the same WhatsApp chat.',
                    ],
                },
                `We will confirm that we received your request and delete your data within **${D.deletionDays} days**. We will tell you when it is done.`,
                'We may keep a small amount of information where the law requires it (for example payment records). Messages already delivered to your phone stay on your device and in WhatsApp under Meta\'s own policies.',
            ],
        },
        {
            id: 'children',
            title: 'Children',
            blocks: [
                `Our service is not intended for anyone under ${D.minimumAge}. We do not knowingly collect information from children. If you believe a child has given us personal information, contact us and we will delete it.`,
            ],
        },
        {
            id: 'changes',
            title: 'Changes to this policy',
            blocks: [
                `We may update this policy from time to time. The "Last updated" date at the top shows when it last changed. If the changes are important, we will make this clear on this page.`,
                `This policy was last updated on ${D.lastUpdated}.`,
            ],
        },
    ],
};

export const TERMS_OF_SERVICE = {
    path: '/terms-of-service',
    title: 'Terms of Service',
    metaTitle: `Terms of Service | ${D.companyName}`,
    metaDescription: `The terms for using ${D.companyName}, including the ${D.companyName} WhatsApp booking assistant for restaurant table bookings and enquiries.`,
    intro: [
        `These Terms of Service ("Terms") apply to your use of ${D.productName} on WhatsApp and of the ${D.companyName} website, dashboard and services (together, the "Service"), provided by **${D.companyName}** ("we", "us", "our").`,
    ],
    sections: [
        {
            id: 'acceptance',
            title: 'Acceptance of these Terms and the Service',
            blocks: [
                'By sending a message to a restaurant through our WhatsApp booking assistant, or by using our website or dashboard, you agree to these Terms. If you do not agree, please do not use the Service.',
                'The Service is a WhatsApp chatbot, provided on behalf of restaurants, that helps you book a table, check availability and get answers to common questions (such as the menu and contact details). Restaurants also use our phone assistant and dashboard to manage their bookings.',
            ],
        },
        {
            id: 'eligibility',
            title: 'Eligibility and acceptable use',
            blocks: [
                `You must be at least ${D.minimumAge} years old to use the Service. You agree not to:`,
                {
                    list: [
                        'Send spam, bulk or automated messages.',
                        'Harass, threaten or abuse anyone, including restaurant staff.',
                        'Send unlawful, offensive or misleading content, or make fake bookings.',
                        'Try to disrupt, overload, hack or reverse-engineer the Service, or bypass its security.',
                        'Use the Service to misuse third-party services such as WhatsApp, Google or Twilio.',
                    ],
                },
            ],
        },
        {
            id: 'bookings',
            title: 'Bookings',
            blocks: [
                {
                    list: [
                        'All bookings depend on availability at the restaurant.',
                        'A booking is only confirmed when you receive a confirmation message. Some restaurants also require a deposit, paid through a secure link, to secure the table.',
                        'The restaurant provides the dining service, not us. Cancellations, changes, deposits, refunds and no-shows are subject to the restaurant\'s own policy.',
                        'To change or cancel a booking, contact the restaurant using the details it provides.',
                    ],
                },
            ],
        },
        {
            id: 'messages-consent',
            title: 'Consent to receive WhatsApp messages',
            blocks: [
                'When you message a restaurant through the Service, you agree to receive WhatsApp messages about your booking or enquiry. These include replies, booking confirmations, deposit payment links and booking reminders. We do not send marketing messages through the booking assistant.',
                'You can opt out at any time by replying **STOP**. You can also block the number in WhatsApp. If you opt out, you may not receive confirmations or reminders for existing bookings.',
            ],
        },
        {
            id: 'ai-disclaimer',
            title: 'AI assistant disclaimer',
            blocks: [
                'The booking assistant uses artificial intelligence to understand your messages and write replies. AI replies may occasionally be inaccurate or incomplete.',
                'Please check the details in your booking confirmation, and confirm important information (such as allergies, dietary needs, prices or opening times) directly with the restaurant. Restaurants using our dashboard are responsible for reviewing the bookings and messages handled by the AI.',
            ],
        },
        {
            id: 'intellectual-property',
            title: 'Intellectual property',
            blocks: [
                `The Service, including its software, design, text and the ${D.companyName} name and logo, belongs to ${D.companyName} or its licensors. You may not copy, modify or resell it without our written permission. Restaurant names, menus and logos belong to the restaurants.`,
            ],
        },
        {
            id: 'third-party-services',
            title: 'Third-party services',
            blocks: [
                'The Service relies on services run by other companies. Their terms also apply when you use them:',
                {
                    list: [
                        '**WhatsApp (Meta Platforms):** your use of WhatsApp is subject to the [WhatsApp Terms of Service](https://www.whatsapp.com/legal/terms-of-service) and [WhatsApp Privacy Policy](https://www.whatsapp.com/legal/privacy-policy).',
                        '**Payments (PayFast):** deposits are processed by PayFast under its own terms.',
                        `**Google APIs:** restaurants that connect a Google account let ${D.companyName} read, create, edit and delete Google Calendar events to manage their bookings. Our use of Google data follows the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. We do not use Google data for advertising or transfer it to others except to provide the Service. Access can be removed at any time in the dashboard or in Google's security settings.`,
                    ],
                },
                'We are not responsible for outages or changes in these third-party services.',
            ],
        },
        {
            id: 'restaurant-accounts',
            title: 'Restaurant accounts and fees',
            blocks: [
                'Restaurants pay for the Service according to their chosen plan. Payments are processed through PayFast. Unless the law requires otherwise, fees are non-refundable. We will give 30 days\' notice of any price changes.',
            ],
        },
        {
            id: 'liability',
            title: 'Disclaimer of warranties and limitation of liability',
            blocks: [
                'The Service is provided "as is" and "as available". We do not promise that it will always be available, error-free or that every booking request will succeed.',
                `To the maximum extent permitted by law, ${D.companyName} is not liable for any indirect, incidental or consequential loss (including lost data, lost bookings or lost business revenue) arising from your use of the Service, from AI errors, or from interruptions to third-party services such as WhatsApp. Nothing in these Terms limits rights you have under consumer protection law that cannot be excluded.`,
            ],
        },
        {
            id: 'termination',
            title: 'Suspension and termination',
            blocks: [
                'We may suspend or stop your access to the Service, without notice, if you break these Terms, misuse the Service, or if a restaurant or the law requires it. You can stop using the Service at any time by no longer messaging us, replying STOP, or blocking the number.',
            ],
        },
        {
            id: 'governing-law',
            title: 'Governing law and contact details',
            blocks: [
                `These Terms are governed by the laws of ${D.governingLaw}. Any disputes are subject to the jurisdiction of its courts.`,
                {
                    list: [
                        `**${D.companyName}**`,
                        `**Address:** ${D.businessAddress}`,
                        `**Email:** ${EMAIL}`,
                        `**Website:** [${D.website}](${D.website})`,
                    ],
                },
            ],
        },
        {
            id: 'changes',
            title: 'Changes to these Terms',
            blocks: [
                'We may update these Terms from time to time. The "Last updated" date at the top shows when they last changed. If you keep using the Service after a change, you accept the updated Terms.',
                `These Terms were last updated on ${D.lastUpdated}.`,
            ],
        },
    ],
};

export const LEGAL_PAGES = [PRIVACY_POLICY, TERMS_OF_SERVICE];
