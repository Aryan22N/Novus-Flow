import EmailRow from "./email-row";
import {
  Sparkles,
  Music2,
  Database,
  Container,
  ShieldAlert,
  GitBranch,
  PenTool,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export default function EmailList() {
  return (
    <div className="flex-[2.7] bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="group flex items-center p-3 border-b border-surface-container-highest hover:bg-surface-container-low transition-colors cursor-pointer bg-blue-50/30">
          <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
              <Music2 size={16} />
            </div>

            <span className="font-bold text-body-md text-on-surface truncate">
              Spotify
            </span>
          </div>

          <div className="flex-1 flex items-center gap-2 pr-4 truncate">
            <span className="text-body-md font-bold text-on-surface">
              Get 3 months of Spotify Premium
            </span>

            <span className="text-on-surface-variant text-body-md truncate">
              - Save your favorite songs. Take them anywhere...
            </span>
          </div>

          <div className="flex items-center gap-3 w-[150px] justify-end">
            <span className="px-2 py-0.5 rounded-full text-label-caps bg-error-container text-on-error-container border border-error/20">
              HIGH
            </span>

            <span className="text-body-sm font-semibold text-on-surface whitespace-nowrap">
              10:42 AM
            </span>
          </div>
        </div>

        <EmailRow
          icon={<Database size={16} />}
          avatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDmstf7916r-Olca-NJwIBHb6CBiNzJOQp4yalOX4zDnFS8SVWV8s7jsI73GSlm1VXvzaZNZJyXsXauMQziOvhy8sZu4B3_TdHdo6S8NdiqZV_eSzMq9ITWMpsW5b4HLpNfUXBXetefo05H_GIqW1JMb6hgyxJnwKU8JDFgMMzFmpnWRW2vwtO0mehB5x_MJ6I5MLG8vPdKK_U8sFFTeguCBUYDxFIAKY60M0MrirqiC5_1VbbKoZRz4SHGt3vj3p6uH5znw-e7WGJz"
          title="Supabase"
          subject="Supa Update June 2026"
          snippet="Everything that happened in the last month..."
          tagLabel="MED"
          tagClass="bg-primary-fixed text-on-primary-fixed border border-primary/20"
          time="Yesterday"
        />

        <EmailRow
          isAi
          icon={<Container size={16} />}
          avatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuC0YevQ2AICP9LRUiUslm9L1VyZ0c9wPoWR9UaQHDGtFUN2wePqdtYnPeHMbZU86dIXJT3azRJZqB1xTcgLpLH8s_s4yaw9-tG-wA4gfWWpxjklmS1mnBnbPRdIlp7S3ynND_prHLMNAf9AQYKkkPA5hX6VS2xYkVBBolWGLjyIdXAn0x1_kYvRnvQHyVBuUlgFWwKa9PuHfGrLaDsghHEY6UTrnAjWeZnQNN27ItgrxST_0sGZ6sEax4mNawEnIUd7ooDcGHav4JT7"
          title="Docker"
          subject="[Action Required] Token created"
          snippet="Personal access token was created for account..."
          tagLabel="HIGH"
          tagClass="bg-error-container text-on-error-container border border-error/20"
          time="Jun 8"
        />

        <EmailRow
          icon={<ShieldAlert size={16} />}
          avatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDkAvLTFLJsrxfo-ErmzinWo_2mDm8x1EVIwJ7a1nGDff0oNUEvIiAyRZ7lrXC3GY3rvgNkhTe-nhxJK3nTv4J04JX3jjDofWhq9i53V9AQ_42JNbBlxK_NKEcothHveDNOc17QpzJaQ30Kcs0BJ447O955OAj8p_jsFVTbXQUHr9ldcOxrW7kJrAKUqu14PCli9walzTebEpX11pOYWkc0HKXxIebeyV17MHZ0ok6QinQ2QPzcf433iY1nGKMs6X6GoCQhA7le2X01"
          title="Google"
          subject="Security alert for account"
          snippet="This is a copy of a security alert sent to..."
          tagLabel="LOW"
          tagClass="bg-surface-variant text-on-surface-variant border border-outline/20"
          time="Jun 8"
        />

        <EmailRow
          icon={<ArrowRight size={16} />}
          avatarText="L"
          avatarColorClass="bg-primary"
          title="Linear"
          subject="New issue assigned to you"
          snippet="ENG-2041: Fix layout shift on mobile..."
          tagLabel="MED"
          tagClass="bg-primary-fixed text-on-primary-fixed border border-primary/20"
          time="Jun 7"
        />

        <EmailRow
          icon={<PenTool size={16} />}
          avatarText="F"
          avatarColorClass="bg-secondary"
          title="Figma"
          subject="Sarah left a comment on 'Dashboard UI'"
          snippet="Can we try increasing the contrast here?"
          tagLabel="LOW"
          tagClass="bg-surface-variant text-on-surface-variant border border-outline/20"
          time="Jun 7"
        />

        <EmailRow
          avatarText="G"
          avatarColorClass="bg-tertiary"
          title="GitHub"
          subject="Pull Request Review Requested"
          snippet="You have been asked to review #421..."
          tagLabel="HIGH"
          tagClass="bg-error-container text-on-error-container border border-error/20"
          time="Jun 6"
        />

        <EmailRow
          icon={<MessageSquare size={16} />}
          avatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDmstf7916r-Olca-NJwIBHb6CBiNzJOQp4yalOX4zDnFS8SVWV8s7jsI73GSlm1VXvzaZNZJyXsXauMQziOvhy8sZu4B3_TdHdo6S8NdiqZV_eSzMq9ITWMpsW5b4HLpNfUXBXetefo05H_GIqW1JMb6hgyxJnwKU8JDFgMMzFmpnWRW2vwtO0mehB5x_MJ6I5MLG8vPdKK_U8sFFTeguCBUYDxFIAKY60M0MrirqiC5_1VbbKoZRz4SHGt3vj3p6uH5znw-e7WGJz"
          title="Slack"
          subject="You have 5 unread mentions"
          snippet="Catch up on conversations in #engineering and #design..."
          tagLabel="MED"
          tagClass="bg-primary-fixed text-on-primary-fixed border border-primary/20"
          time="Jun 6"
        />
      </div>
    </div>
  );
}
