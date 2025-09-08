import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const sns = new SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.SNS_TOPIC_ARN;

// Pre-load and compile the Handlebars template
const templatePath = path.join(dirname, 'template', 'credit.hbs');
const source = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(source);

export const handler = async (event) => {
  for (const record of event.Records) {
    const { name, isApproved, amount } = JSON.parse(record.body);
    const subject = isApproved ? 'Crédito Aprobado' : 'Crédito Rechazado';

    const messageBody = template({
      name,
      isApproved,
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
