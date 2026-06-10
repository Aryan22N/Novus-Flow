import InboxFilters from "./inbox-filters";

export default function InboxHeader() {
  return (
    <div className="flex flex-col gap-4 mb-4 shrink-0">
      <h1 className="text-display-lg font-display-lg text-on-surface m-0">Priority Inbox</h1>
      <InboxFilters />
    </div>
  );
}
