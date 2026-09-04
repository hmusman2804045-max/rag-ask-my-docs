import { UploadZone } from './UploadZone';
import { DocumentList } from './DocumentList';
import { SessionList } from './SessionList';

export function Sidebar() {
  return (
    <aside className="glass flex h-full min-h-0 w-full flex-col gap-5 rounded-2xl p-4">
      <UploadZone />
      <div className="h-px w-full gold-divider" />
      <DocumentList />
      <div className="h-px w-full gold-divider" />
      <SessionList />
    </aside>
  );
}
