import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const sns = new SESClient({ region: process.env.AWS_REGION });

// Pre-load and compile the Handlebars template
const templatePath = path.join(dirname, 'template', 'credit.hbs');
const source = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(source);

export const handler = async (event) => {

  const senderEmail = process.env.SENDER_EMAIL;

  for (const record of event.Records) {
    const { name, email, isApproved, amount, paymentPlan = [] } = JSON.parse(record.body);
    const subject = isApproved ? 'Crédito Aprobado' : 'Crédito Rechazado';

    try {
      const messageBody = template({
        name,
        isApproved,
        amount,
        paymentPlan,
      });

      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: messageBody,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
        Source: senderEmail,
      });

      await ses.send(command);
      console.log(`Email sent to ${email}`);

    } catch (e) {
      console.error('Error sending email:', e);
    }
  }

  return { statusCode: 200 };
};
