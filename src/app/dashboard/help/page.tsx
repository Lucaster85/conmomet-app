import HelpPageClient from '../../../components/help/HelpPageClient';
import { getHelpTopicsWithContent } from '../../../utils/helpContent';

export default function HelpPage() {
  const topics = getHelpTopicsWithContent();
  return <HelpPageClient topics={topics} />;
}
