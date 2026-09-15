import fs from 'fs';
import path from 'path';
import { HELP_TOPICS, HelpTopic } from '../content/help/helpTopics';

export interface HelpTopicWithContent extends HelpTopic {
  content: string;
}

// Server-only: lee cada .md listado en HELP_TOPICS desde disco. No usar desde un client component.
export function getHelpTopicsWithContent(): HelpTopicWithContent[] {
  return HELP_TOPICS.map((topic) => {
    const filePath = path.join(process.cwd(), 'src', 'content', 'help', topic.file);
    const content = fs.readFileSync(filePath, 'utf8');
    return { ...topic, content };
  });
}
