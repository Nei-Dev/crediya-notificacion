import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

const sns = new SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.SNS_TOPIC_ARN;

// Pre-load and compile the Handlebars template
const templatePath = path.join(__dirname, 'template', 'credit.hbs');
const source = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(source);

export const handler = async (event) => {
  for (const record of event.Records) {
    const {
      name,
      approved,
      amount,
    } = JSON.parse(record.body);
    const subject = approved ? 'Crédito Aprobado' : 'Crédito Rechazado';

    const messageBody = template({
      name,
      approved,
      amount
    });

    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: messageBody
    });

    await sns.send(command);
  }

  return { statusCode: 200 };
};
